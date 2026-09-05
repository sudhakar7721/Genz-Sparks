from pathlib import Path
import shutil,uuid
from fastapi import FastAPI,Depends,HTTPException,UploadFile,File,Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel,EmailStr,Field
from .config import CORS_ORIGINS,UPLOAD_DIR
from .db import get_db,row,rows
from .security import hash_password,verify_password,token,current_user,roles
from .init_db import seed
app=FastAPI(title='EduNexa V12 API',version='12.0',description='EduNexa Student Faculty HOD Management backend')
app.add_middleware(CORSMiddleware,allow_origins=CORS_ORIGINS or ['*'],allow_credentials=True,allow_methods=['*'],allow_headers=['*'])
@app.on_event('startup')
def startup(): seed()
class Login(BaseModel): email:EmailStr; password:str=Field(min_length=6)
class Register(BaseModel): name:str; email:EmailStr; password:str=Field(min_length=6); role:str='student'; student_id:str|None=None; department:str='Data Analytics'; batch:str|None=None; parent_name:str|None=None; parent_phone:str|None=None
class Mark(BaseModel): student_id:int; subject:str; exam:str; mark:float; max_mark:float=100
class Change(BaseModel): mark_id:int; new_mark:float; reason:str=Field(min_length=3); student_approved:bool=False
class Review(BaseModel): status:str; review_note:str=''
class Feedback(BaseModel): category:str; subject:str|None=None; rating:float|None=None; message:str; recipient:str='class_adviser'
class Leave(BaseModel): leave_type:str; from_date:str; to_date:str; hours:float=6; reason:str
class Timetable(BaseModel): class_name:str; day:str; period:str; start_time:str|None=None; end_time:str|None=None; subject:str; faculty_name:str|None=None; room:str|None=None
class FTimetable(BaseModel): day:str; period:str; start_time:str|None=None; end_time:str|None=None; subject:str|None=None; class_name:str|None=None; room:str|None=None
class Company(BaseModel): company_name:str; industry:str|None=None; location:str|None=None; visited:bool=False; visit_date:str|None=None; package_min:float|None=None; package_max:float|None=None; description:str|None=None
@app.get('/')
def root(): return {'app':'EduNexa V12','status':'online','docs':'/docs','api':'/api'}
@app.get('/api/health')
def health(): return {'status':'ok'}
@app.post('/api/auth/login')
def login(x:Login):
 with get_db() as db: u=row(db.execute('SELECT * FROM users WHERE email=? COLLATE NOCASE',(x.email,)))
 if not u or not verify_password(x.password,u['password_hash']): raise HTTPException(401,'Invalid email or password')
 return {'access_token':token(u['id'],u['role']),'token_type':'bearer','user':{k:v for k,v in u.items() if k!='password_hash'}}
@app.post('/api/auth/register')
def register(x:Register):
 if x.role not in ('student','faculty','hod'): raise HTTPException(400,'Role must be student, faculty or hod')
 with get_db() as db:
  if row(db.execute('SELECT id FROM users WHERE email=? COLLATE NOCASE',(x.email,))): raise HTTPException(409,'Email already registered')
  cur=db.execute('INSERT INTO users(name,email,password_hash,role,student_id,department,batch,parent_name,parent_phone) VALUES(?,?,?,?,?,?,?,?,?)',(x.name,x.email,hash_password(x.password),x.role,x.student_id,x.department,x.batch,x.parent_name,x.parent_phone)); uid=cur.lastrowid
  if x.role=='student': db.execute('INSERT INTO student_profiles(user_id,parent_name,parent_phone) VALUES(?,?,?)',(uid,x.parent_name,x.parent_phone))
  if x.role=='faculty': db.execute('INSERT INTO faculty_profiles(user_id) VALUES(?)',(uid,))
 return {'message':'Registration successful','user_id':uid}
@app.get('/api/auth/me')
def me(u=Depends(current_user)): return {k:v for k,v in u.items() if k!='password_hash'}
@app.get('/api/dashboard/summary')
def dashboard(u=Depends(current_user)):
 with get_db() as db:
  if u['role']=='hod':
   d=u['department']; return {'role':'hod','department':d,'students':db.execute("SELECT COUNT(*) FROM users WHERE role='student' AND department=?",(d,)).fetchone()[0],'faculty':db.execute("SELECT COUNT(*) FROM users WHERE role='faculty' AND department=?",(d,)).fetchone()[0],'pending_mark_requests':db.execute("SELECT COUNT(*) FROM mark_change_requests WHERE status='pending'").fetchone()[0],'feedback_open':db.execute("SELECT COUNT(*) FROM feedbacks WHERE status='open'").fetchone()[0],'placements':db.execute("SELECT COUNT(*) FROM placements p JOIN users s ON s.id=p.student_id WHERE s.department=?",(d,)).fetchone()[0],'achievements':db.execute('SELECT COUNT(*) FROM achievements WHERE department=?',(d,)).fetchone()[0]}
  if u['role']=='student': return {'role':'student','marks':rows(db.execute('SELECT subject,exam,mark,max_mark FROM marks WHERE student_id=?',(u['id'],))),'pending_leaves':db.execute("SELECT COUNT(*) FROM leaves WHERE student_id=? AND status='pending'",(u['id'],)).fetchone()[0]}
  return {'role':u['role'],'students':db.execute("SELECT COUNT(*) FROM users WHERE role='student'").fetchone()[0],'faculty':db.execute("SELECT COUNT(*) FROM users WHERE role='faculty'").fetchone()[0]}
@app.get('/api/students')
def students(u=Depends(roles('faculty','hod','management'))):
 with get_db() as db: return rows(db.execute("SELECT u.*,sp.age,sp.sex,sp.caste,sp.region,sp.address,sp.blood_group,sp.school_name,sp.tenth_mark,sp.twelfth_mark,sp.additional_details FROM users u LEFT JOIN student_profiles sp ON sp.user_id=u.id WHERE u.role='student' ORDER BY u.name"))
@app.get('/api/students/{sid}')
def student(sid:int,u=Depends(current_user)):
 if sid!=u['id'] and u['role'] not in ('faculty','hod','management'): raise HTTPException(403,'Access denied')
 with get_db() as db: x=row(db.execute("SELECT u.*,sp.* FROM users u LEFT JOIN student_profiles sp ON sp.user_id=u.id WHERE u.id=? AND u.role='student'",(sid,)))
 if not x: raise HTTPException(404,'Student not found')
 return x
@app.put('/api/students/{sid}/profile')
def student_profile(sid:int,p:dict,u=Depends(current_user)):
 if sid!=u['id'] and u['role'] not in ('faculty','hod','management'): raise HTTPException(403,'Access denied')
 allowed={'age','sex','caste','region','address','parent_name','parent_phone','blood_group','school_name','tenth_mark','twelfth_mark','additional_details'}; p={k:v for k,v in p.items() if k in allowed}
 with get_db() as db:
  db.execute('INSERT OR IGNORE INTO student_profiles(user_id) VALUES(?)',(sid,))
  if p: db.execute('UPDATE student_profiles SET '+','.join(f'{k}=?' for k in p)+' WHERE user_id=?',(*p.values(),sid))
 return {'message':'Profile updated'}
@app.get('/api/faculty')
def faculty(u=Depends(roles('faculty','hod','management'))):
 with get_db() as db: return rows(db.execute("SELECT u.*,fp.classes_handled,fp.subjects_handled,fp.is_class_adviser,fp.extra_info FROM users u LEFT JOIN faculty_profiles fp ON fp.user_id=u.id WHERE u.role='faculty' ORDER BY u.name"))
@app.get('/api/marks')
def marks(student_id:int|None=None,u=Depends(current_user)):
 sid=student_id or u['id']
 if sid!=u['id'] and u['role'] not in ('faculty','hod','management'): raise HTTPException(403,'Access denied')
 with get_db() as db: return rows(db.execute("SELECT m.*,u.name student_name FROM marks m JOIN users u ON u.id=m.student_id WHERE m.student_id=? ORDER BY m.subject,m.exam",(sid,)))
@app.post('/api/marks')
def add_mark(x:Mark,u=Depends(roles('faculty','hod','management'))):
 if x.mark<0 or x.mark>x.max_mark: raise HTTPException(400,'Mark out of range')
 with get_db() as db: db.execute("INSERT INTO marks(student_id,subject,exam,mark,max_mark,entered_by) VALUES(?,?,?,?,?,?) ON CONFLICT(student_id,subject,exam) DO UPDATE SET mark=excluded.mark,max_mark=excluded.max_mark,entered_by=excluded.entered_by,updated_at=CURRENT_TIMESTAMP",(x.student_id,x.subject,x.exam,x.mark,x.max_mark,u['id']))
 return {'message':'Mark saved'}
@app.post('/api/marks/change-request')
def change(x:Change,u=Depends(current_user)):
 with get_db() as db:
  m=row(db.execute('SELECT * FROM marks WHERE id=?',(x.mark_id,)))
  if not m: raise HTTPException(404,'Mark not found')
  if u['role']=='student' and m['student_id']!=u['id']: raise HTTPException(403,'Access denied')
  cur=db.execute('INSERT INTO mark_change_requests(mark_id,student_id,requested_by,old_mark,new_mark,reason,student_approved) VALUES(?,?,?,?,?,?,?)',(x.mark_id,m['student_id'],u['id'],m['mark'],x.new_mark,x.reason,int(x.student_approved)))
  return row(db.execute('SELECT * FROM mark_change_requests WHERE id=?',(cur.lastrowid,)))
@app.get('/api/hod/mark-requests')
def requests(u=Depends(roles('hod'))):
 with get_db() as db: return rows(db.execute("SELECT r.*,s.name student_name,m.subject,m.exam FROM mark_change_requests r JOIN users s ON s.id=r.student_id JOIN marks m ON m.id=r.mark_id WHERE s.department=? ORDER BY r.created_at DESC",(u['department'],)))
@app.put('/api/hod/mark-requests/{rid}')
def review(rid:int,x:Review,u=Depends(roles('hod'))):
 if x.status not in ('approved','declined'): raise HTTPException(400,'Use approved or declined')
 with get_db() as db:
  r=row(db.execute('SELECT r.*,s.department FROM mark_change_requests r JOIN users s ON s.id=r.student_id WHERE r.id=?',(rid,)))
  if not r or r['department']!=u['department']: raise HTTPException(404,'Request not found')
  db.execute('UPDATE mark_change_requests SET status=?,reviewed_by=?,review_note=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?',(x.status,u['id'],x.review_note,rid))
  if x.status=='approved': db.execute('UPDATE marks SET mark=?,updated_at=CURRENT_TIMESTAMP WHERE id=?',(r['new_mark'],r['mark_id']))
 return {'message':'Mark change '+x.status}
@app.get('/api/timetables/class')
def class_tt(class_name:str|None=None,u=Depends(current_user)):
 with get_db() as db:
  q='SELECT * FROM class_timetables'; a=[]
  if class_name: q+=' WHERE class_name=?'; a=[class_name]
  return rows(db.execute(q+' ORDER BY day,period',a))
@app.post('/api/timetables/class')
def add_class_tt(x:Timetable,u=Depends(roles('faculty','hod','management'))):
 with get_db() as db: db.execute("INSERT INTO class_timetables(class_name,day,period,start_time,end_time,subject,faculty_name,room,created_by) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(class_name,day,period) DO UPDATE SET start_time=excluded.start_time,end_time=excluded.end_time,subject=excluded.subject,faculty_name=excluded.faculty_name,room=excluded.room",(x.class_name,x.day,x.period,x.start_time,x.end_time,x.subject,x.faculty_name,x.room,u['id']))
 return {'message':'Class timetable saved'}
@app.get('/api/timetables/faculty/{fid}')
def faculty_tt(fid:int,u=Depends(current_user)):
 if fid!=u['id'] and u['role'] not in ('faculty','hod','management'): raise HTTPException(403,'Access denied')
 with get_db() as db: return rows(db.execute('SELECT * FROM faculty_timetables WHERE faculty_id=? ORDER BY day,period',(fid,)))
@app.post('/api/timetables/faculty/{fid}')
def add_faculty_tt(fid:int,x:FTimetable,u=Depends(roles('faculty','hod','management'))):
 with get_db() as db: db.execute("INSERT INTO faculty_timetables(faculty_id,day,period,start_time,end_time,subject,class_name,room) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(faculty_id,day,period) DO UPDATE SET start_time=excluded.start_time,end_time=excluded.end_time,subject=excluded.subject,class_name=excluded.class_name,room=excluded.room",(fid,x.day,x.period,x.start_time,x.end_time,x.subject,x.class_name,x.room))
 return {'message':'Faculty timetable saved'}
@app.post('/api/feedback')
def feedback(x:Feedback,u=Depends(roles('student'))):
 if x.category not in ('subject','non_subject'): raise HTTPException(400,'Invalid category')
 with get_db() as db: cur=db.execute('INSERT INTO feedbacks(student_id,category,subject,rating,message,recipient) VALUES(?,?,?,?,?,?)',(u['id'],x.category,x.subject,x.rating,x.message,x.recipient))
 return {'id':cur.lastrowid,'message':'Feedback submitted'}
@app.get('/api/feedback')
def feedbacks(u=Depends(current_user)):
 with get_db() as db:
  if u['role']=='student': return rows(db.execute('SELECT * FROM feedbacks WHERE student_id=? ORDER BY created_at DESC',(u['id'],)))
  return rows(db.execute("SELECT f.*,u.name student_name,u.department FROM feedbacks f LEFT JOIN users u ON u.id=f.student_id WHERE u.department=? ORDER BY f.created_at DESC",(u['department'],)))
@app.get('/api/hod/feedback-analytics')
def feedback_analytics(u=Depends(roles('hod'))):
 with get_db() as db:
  d=u['department']; total=db.execute('SELECT COUNT(*) FROM feedbacks f JOIN users s ON s.id=f.student_id WHERE s.department=?',(d,)).fetchone()[0]; avg=db.execute('SELECT COALESCE(AVG(rating),0) FROM feedbacks f JOIN users s ON s.id=f.student_id WHERE s.department=? AND rating IS NOT NULL',(d,)).fetchone()[0]; cat=rows(db.execute('SELECT category,COUNT(*) count,COALESCE(AVG(rating),0) avg_rating FROM feedbacks f JOIN users s ON s.id=f.student_id WHERE s.department=? GROUP BY category',(d,)))
 return {'total':total,'average_rating':round(avg,2),'by_category':cat}
@app.post('/api/leaves')
def leave(x:Leave,u=Depends(roles('student'))):
 if x.leave_type not in ('full_day','half_day'): raise HTTPException(400,'Invalid leave type')
 if x.leave_type=='half_day' and not 0<x.hours<=6: raise HTTPException(400,'Half-day hours must be 1-6')
 h=6 if x.leave_type=='full_day' else x.hours
 with get_db() as db: cur=db.execute('INSERT INTO leaves(student_id,leave_type,from_date,to_date,hours,reason) VALUES(?,?,?,?,?,?)',(u['id'],x.leave_type,x.from_date,x.to_date,h,x.reason))
 return {'id':cur.lastrowid,'message':'Leave request submitted'}
@app.get('/api/leaves')
def leaves(u=Depends(current_user)):
 with get_db() as db:
  if u['role']=='student': return rows(db.execute('SELECT * FROM leaves WHERE student_id=? ORDER BY created_at DESC',(u['id'],)))
  return rows(db.execute("SELECT l.*,u.name student_name FROM leaves l JOIN users u ON u.id=l.student_id WHERE u.department=? ORDER BY l.created_at DESC",(u['department'],)))
@app.put('/api/leaves/{lid}')
def leave_review(lid:int,x:Review,u=Depends(roles('faculty','hod'))):
 if x.status not in ('approved','declined'): raise HTTPException(400,'Invalid status')
 with get_db() as db: db.execute('UPDATE leaves SET status=?,reviewed_by=?,adviser_note=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?',(x.status,u['id'],x.review_note,lid))
 return {'message':'Leave '+x.status}
@app.post('/api/attendance')
def attendance(x:dict,u=Depends(roles('faculty','hod'))):
 for k in ('student_id','subject','date','status'):
  if k not in x: raise HTTPException(400,'Missing '+k)
 with get_db() as db: db.execute("INSERT INTO attendance(student_id,subject,date,status,marked_by) VALUES(?,?,?,?,?) ON CONFLICT(student_id,subject,date) DO UPDATE SET status=excluded.status,marked_by=excluded.marked_by",(x['student_id'],x['subject'],x['date'],x['status'],u['id']))
 return {'message':'Attendance saved'}
@app.get('/api/attendance/{sid}')
def get_attendance(sid:int,u=Depends(current_user)):
 if sid!=u['id'] and u['role'] not in ('faculty','hod','management'): raise HTTPException(403,'Access denied')
 with get_db() as db: return rows(db.execute('SELECT * FROM attendance WHERE student_id=? ORDER BY date DESC',(sid,)))
def save_file(f,uid,cat):
 ext=Path(f.filename or '').suffix.lower(); name=uuid.uuid4().hex+ext; path=UPLOAD_DIR/name
 with path.open('wb') as out: shutil.copyfileobj(f.file,out)
 with get_db() as db: cur=db.execute('INSERT INTO files(owner_id,original_name,stored_name,content_type,size,category) VALUES(?,?,?,?,?,?)',(uid,f.filename or name,name,f.content_type,path.stat().st_size,cat)); return cur.lastrowid
@app.post('/api/files/upload')
def upload(file:UploadFile=File(...),category:str=Form('general'),u=Depends(current_user)): return {'file_id':save_file(file,u['id'],category),'filename':file.filename}
@app.get('/api/files/{fid}')
def file_download(fid:int,u=Depends(current_user)):
 with get_db() as db: f=row(db.execute('SELECT * FROM files WHERE id=?',(fid,)))
 if not f: raise HTTPException(404,'File not found')
 if f['owner_id']!=u['id'] and u['role'] not in ('faculty','hod','management'): raise HTTPException(403,'Access denied')
 p=UPLOAD_DIR/f['stored_name']
 if not p.exists(): raise HTTPException(404,'Stored file missing')
 return FileResponse(p,filename=f['original_name'],media_type=f['content_type'] or 'application/octet-stream')
@app.post('/api/academics/tests')
def create_test(title:str=Form(...),description:str=Form(''),subject:str=Form(''),class_name:str=Form(...),due_date:str=Form(''),max_mark:float=Form(100),file:UploadFile|None=File(None),u=Depends(roles('faculty','hod'))):
 fid=save_file(file,u['id'],'test') if file else None
 with get_db() as db: cur=db.execute('INSERT INTO tests(title,description,subject,class_name,faculty_id,due_date,max_mark,file_id) VALUES(?,?,?,?,?,?,?,?)',(title,description,subject,class_name,u['id'],due_date,max_mark,fid))
 return {'id':cur.lastrowid}
@app.get('/api/academics/tests')
def tests(class_name:str|None=None,u=Depends(current_user)):
 with get_db() as db:
  q='SELECT * FROM tests'; a=[]
  if class_name: q+=' WHERE class_name=?'; a=[class_name]
  return rows(db.execute(q+' ORDER BY id DESC',a))
@app.post('/api/academics/assignments')
def create_assignment(title:str=Form(...),description:str=Form(''),subject:str=Form(''),class_name:str=Form(...),due_date:str=Form(''),max_mark:float=Form(100),file:UploadFile|None=File(None),u=Depends(roles('faculty','hod'))):
 fid=save_file(file,u['id'],'assignment') if file else None
 with get_db() as db: cur=db.execute('INSERT INTO assignments(title,description,subject,class_name,faculty_id,due_date,max_mark,file_id) VALUES(?,?,?,?,?,?,?,?)',(title,description,subject,class_name,u['id'],due_date,max_mark,fid))
 return {'id':cur.lastrowid}
@app.get('/api/academics/assignments')
def assignments(class_name:str|None=None,u=Depends(current_user)):
 with get_db() as db:
  q='SELECT * FROM assignments'; a=[]
  if class_name: q+=' WHERE class_name=?'; a=[class_name]
  return rows(db.execute(q+' ORDER BY id DESC',a))
@app.post('/api/academics/submissions')
def submission(item_type:str=Form(...),item_id:int=Form(...),file:UploadFile|None=File(None),text_answer:str=Form(''),u=Depends(roles('student'))):
 if item_type not in ('test','assignment'): raise HTTPException(400,'Invalid item type')
 fid=save_file(file,u['id'],'submission') if file else None
 with get_db() as db: cur=db.execute('INSERT INTO submissions(student_id,item_type,item_id,file_id,text_answer) VALUES(?,?,?,?,?)',(u['id'],item_type,item_id,fid,text_answer))
 return {'submission_id':cur.lastrowid}
@app.post('/api/student-records/{kind}')
def student_record(kind:str,p:dict,u=Depends(roles('student'))):
 with get_db() as db:
  if kind=='certificate': cur=db.execute('INSERT INTO certificates(student_id,title,issuer,completion_date,file_id) VALUES(?,?,?,?,?)',(u['id'],p.get('title'),p.get('issuer'),p.get('completion_date'),p.get('file_id')))
  elif kind=='course': cur=db.execute('INSERT INTO courses(student_id,title,provider,completion_date,certificate_file_id) VALUES(?,?,?,?,?)',(u['id'],p.get('title'),p.get('provider'),p.get('completion_date'),p.get('file_id')))
  elif kind=='internship': cur=db.execute('INSERT INTO internships(student_id,company,role,start_date,end_date,description,file_id) VALUES(?,?,?,?,?,?,?)',(u['id'],p.get('company'),p.get('role'),p.get('start_date'),p.get('end_date'),p.get('description'),p.get('file_id')))
  else: raise HTTPException(400,'Use certificate, course or internship')
 return {'id':cur.lastrowid,'message':'Record saved'}
@app.get('/api/student-records')
def records(u=Depends(roles('student'))):
 with get_db() as db: return {'certificates':rows(db.execute('SELECT * FROM certificates WHERE student_id=?',(u['id'],))),'courses':rows(db.execute('SELECT * FROM courses WHERE student_id=?',(u['id'],))),'internships':rows(db.execute('SELECT * FROM internships WHERE student_id=?',(u['id'],)))}
@app.get('/api/fees/student/{sid}')
def fees(sid:int,u=Depends(current_user)):
 if sid!=u['id'] and u['role'] not in ('faculty','hod','management'): raise HTTPException(403,'Access denied')
 with get_db() as db: f=row(db.execute('SELECT f.*,u.name student_name,u.department,u.batch FROM fees f JOIN users u ON u.id=f.student_id WHERE f.student_id=?',(sid,)))
 return f or {'student_id':sid}
@app.put('/api/fees/student/{sid}')
def update_fees(sid:int,p:dict,u=Depends(roles('hod','management'))):
 keys=['tuition_total','tuition_paid','bus_total','bus_paid','hostel_total','hostel_paid','placement_total','placement_paid']; vals=[float(p.get(k,0)) for k in keys]
 with get_db() as db: db.execute("INSERT INTO fees(student_id,tuition_total,tuition_paid,bus_total,bus_paid,hostel_total,hostel_paid,placement_total,placement_paid) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(student_id) DO UPDATE SET tuition_total=excluded.tuition_total,tuition_paid=excluded.tuition_paid,bus_total=excluded.bus_total,bus_paid=excluded.bus_paid,hostel_total=excluded.hostel_total,hostel_paid=excluded.hostel_paid,placement_total=excluded.placement_total,placement_paid=excluded.placement_paid,updated_at=CURRENT_TIMESTAMP",(sid,*vals))
 return {'message':'Fee details updated'}
@app.post('/api/placements/companies')
def company(x:Company,u=Depends(roles('hod','management'))):
 with get_db() as db: cur=db.execute('INSERT INTO placement_companies(company_name,industry,location,visited,visit_date,package_min,package_max,description) VALUES(?,?,?,?,?,?,?,?)',(x.company_name,x.industry,x.location,int(x.visited),x.visit_date,x.package_min,x.package_max,x.description))
 return {'id':cur.lastrowid}
@app.get('/api/placements/companies')
def companies(u=Depends(current_user)):
 with get_db() as db: return rows(db.execute('SELECT * FROM placement_companies ORDER BY package_max DESC'))
@app.post('/api/placements')
def placement(p:dict,u=Depends(roles('hod','management'))):
 with get_db() as db: cur=db.execute('INSERT INTO placements(company_id,student_id,package,offer_status,placed_date) VALUES(?,?,?,?,?)',(p.get('company_id'),p['student_id'],p['package'],p.get('offer_status','placed'),p.get('placed_date')))
 return {'id':cur.lastrowid}
@app.get('/api/placements/ranking')
def ranking(department:str|None=None,u=Depends(current_user)):
 d=department or u['department']
 with get_db() as db: return rows(db.execute("SELECT u.name,u.student_id,u.department,c.company_name,p.package,p.offer_status FROM placements p JOIN users u ON u.id=p.student_id LEFT JOIN placement_companies c ON c.id=p.company_id WHERE u.department=? ORDER BY p.package DESC",(d,)))
@app.get('/api/hod/dashboard')
def hod_dashboard(u=Depends(roles('hod'))): return dashboard(u)
@app.get('/api/hod/students')
def hod_students(u=Depends(roles('hod'))):
 with get_db() as db: return rows(db.execute("SELECT u.id,u.name,u.email,u.student_id,u.department,u.batch,u.attendance,COALESCE(AVG(m.mark),0) average_mark FROM users u LEFT JOIN marks m ON m.student_id=u.id WHERE u.role='student' AND u.department=? GROUP BY u.id ORDER BY u.name",(u['department'],)))
@app.get('/api/hod/faculty')
def hod_faculty(u=Depends(roles('hod'))):
 with get_db() as db: return rows(db.execute("SELECT u.*,fp.classes_handled,fp.subjects_handled,fp.is_class_adviser,fp.extra_info FROM users u LEFT JOIN faculty_profiles fp ON fp.user_id=u.id WHERE u.role='faculty' AND u.department=? ORDER BY u.name",(u['department'],)))
@app.get('/api/hod/class-details')
def hod_class_details(class_name:str|None=None,u=Depends(roles('hod'))):
 with get_db() as db:
  q="SELECT u.id,u.name,u.student_id,u.email,u.batch,u.attendance,COALESCE(AVG(m.mark),0) average_mark,COUNT(m.id) mark_count FROM users u LEFT JOIN marks m ON m.student_id=u.id WHERE u.role='student' AND u.department=?"; a=[u['department']]
  if class_name: q+=' AND u.batch=?'; a.append(class_name)
  return rows(db.execute(q+' GROUP BY u.id ORDER BY u.name',a))
@app.get('/api/hod/achievements')
def achievements(u=Depends(roles('hod'))):
 with get_db() as db: return rows(db.execute('SELECT * FROM achievements WHERE department=? ORDER BY achievement_date DESC',(u['department'],)))
@app.post('/api/hod/achievements')
def add_achievement(p:dict,u=Depends(roles('hod'))):
 with get_db() as db: cur=db.execute('INSERT INTO achievements(department,title,description,achievement_date,metric,created_by) VALUES(?,?,?,?,?,?)',(u['department'],p.get('title'),p.get('description'),p.get('achievement_date'),p.get('metric'),u['id']))
 return {'id':cur.lastrowid}
@app.get('/api/hod/analytics')
def analytics(u=Depends(roles('hod'))):
 with get_db() as db:
  d=u['department']; avg=db.execute('SELECT COALESCE(AVG(m.mark),0) FROM marks m JOIN users s ON s.id=m.student_id WHERE s.department=?',(d,)).fetchone()[0]; att=db.execute("SELECT COALESCE(AVG(attendance),0) FROM users WHERE role='student' AND department=?",(d,)).fetchone()[0]; placed=db.execute("SELECT COUNT(*) FROM placements p JOIN users s ON s.id=p.student_id WHERE s.department=? AND p.offer_status='placed'",(d,)).fetchone()[0]
 return {'department':d,'average_mark':round(avg,2),'average_attendance':round(att,2),'placed_students':placed}
@app.get('/api/hod/timetable')
def hod_timetable(class_name:str|None=None,u=Depends(roles('hod'))): return class_tt(class_name,u)
@app.get('/api/hod/faculty-timetable/{fid}')
def hod_faculty_timetable(fid:int,u=Depends(roles('hod'))): return faculty_tt(fid,u)
@app.get('/api/hod/all')
def hod_all(u=Depends(roles('hod'))): return {'dashboard':hod_dashboard(u),'students':hod_students(u),'faculty':hod_faculty(u),'mark_requests':requests(u),'feedback_analytics':feedback_analytics(u),'achievements':achievements(u)}
@app.get('/api/notifications')
def notifications(u=Depends(current_user)):
 with get_db() as db: return rows(db.execute('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC',(u['id'],)))
@app.put('/api/notifications/{nid}/read')
def notification_read(nid:int,u=Depends(current_user)):
 with get_db() as db: db.execute('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?',(nid,u['id']))
 return {'message':'Notification marked read'}
