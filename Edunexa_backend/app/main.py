from pathlib import Path
import shutil,uuid,json,sqlite3
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
def clean(row): return None if row is None else {k:v for k,v in row.items() if k!='password_hash'}
def enriched_user(db, user_id):
    return row(db.execute("""SELECT u.*, fp.classes_handled, fp.subjects_handled,
        fp.is_class_adviser, COALESCE(fp.is_mentor,0) is_mentor, fp.extra_info,
        ca.name class_adviser_name, me.name mentor_name, c.name assigned_class_name
        FROM users u
        LEFT JOIN faculty_profiles fp ON fp.user_id=u.id
        LEFT JOIN student_staff_assignments a ON a.student_id=u.id
        LEFT JOIN users ca ON ca.id=a.class_adviser_id
        LEFT JOIN users me ON me.id=a.mentor_id
        LEFT JOIN classes c ON c.id=a.class_id
        WHERE u.id=?""", (user_id,)))

@app.post('/api/auth/login')
def login(x:Login):
 with get_db() as db:
  u=row(db.execute('SELECT * FROM users WHERE email=? COLLATE NOCASE',(x.email,)))
  if not u or not verify_password(x.password,u['password_hash']): raise HTTPException(401,'Invalid email or password')
  fresh=enriched_user(db,u['id']) or u
 return {'access_token':token(u['id'],u['role']),'token_type':'bearer','user':clean(fresh)}
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
def me(u=Depends(current_user)):
 with get_db() as db: fresh=enriched_user(db,u['id']) or u
 return clean(fresh)
@app.get('/api/dashboard/summary')
def dashboard(u=Depends(current_user)):
 with get_db() as db:
  if u['role']=='hod':
   d=u['department']; return {'role':'hod','department':d,'students':db.execute("SELECT COUNT(*) FROM users WHERE role='student' AND department=?",(d,)).fetchone()[0],'faculty':db.execute("SELECT COUNT(*) FROM users WHERE role='faculty' AND department=?",(d,)).fetchone()[0],'pending_mark_requests':db.execute("SELECT COUNT(*) FROM mark_change_requests WHERE status='pending'").fetchone()[0],'feedback_open':db.execute("SELECT COUNT(*) FROM feedbacks WHERE status='open'").fetchone()[0],'placements':db.execute("SELECT COUNT(*) FROM placements p JOIN users s ON s.id=p.student_id WHERE s.department=?",(d,)).fetchone()[0],'achievements':db.execute('SELECT COUNT(*) FROM achievements WHERE department=?',(d,)).fetchone()[0]}
  if u['role']=='student': return {'role':'student','marks':rows(db.execute('SELECT subject,exam,mark,max_mark FROM marks WHERE student_id=?',(u['id'],))),'pending_leaves':db.execute("SELECT COUNT(*) FROM leaves WHERE student_id=? AND status='pending'",(u['id'],)).fetchone()[0]}
  return {'role':u['role'],'students':db.execute("SELECT COUNT(*) FROM users WHERE role='student'").fetchone()[0],'faculty':db.execute("SELECT COUNT(*) FROM users WHERE role='faculty'").fetchone()[0]}
@app.get('/api/students')
def students(u=Depends(roles('faculty','hod','management'))):
 with get_db() as db: return [clean(r) for r in rows(db.execute("SELECT u.*,sp.age,sp.sex,sp.caste,sp.region,sp.address,sp.blood_group,sp.school_name,sp.tenth_mark,sp.twelfth_mark,sp.additional_details, ca.name class_adviser_name, me.name mentor_name, c.name assigned_class_name FROM users u LEFT JOIN student_profiles sp ON sp.user_id=u.id LEFT JOIN student_staff_assignments a ON a.student_id=u.id LEFT JOIN users ca ON ca.id=a.class_adviser_id LEFT JOIN users me ON me.id=a.mentor_id LEFT JOIN classes c ON c.id=a.class_id WHERE u.role='student' ORDER BY u.name"))]
@app.get('/api/students/{sid}')
def student(sid:int,u=Depends(current_user)):
 if sid!=u['id'] and u['role'] not in ('faculty','hod','management'): raise HTTPException(403,'Access denied')
 with get_db() as db: x=row(db.execute("SELECT u.*,sp.* FROM users u LEFT JOIN student_profiles sp ON sp.user_id=u.id WHERE u.id=? AND u.role='student'",(sid,)))
 if not x: raise HTTPException(404,'Student not found')
 return clean(x)
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
 with get_db() as db: return [clean(r) for r in rows(db.execute("SELECT u.*,fp.classes_handled,fp.subjects_handled,fp.is_class_adviser,COALESCE(fp.is_mentor,0) is_mentor,fp.extra_info FROM users u LEFT JOIN faculty_profiles fp ON fp.user_id=u.id WHERE u.role='faculty' ORDER BY u.name"))]
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
  if x.new_mark < 0 or x.new_mark > m['max_mark']: raise HTTPException(400,'New mark out of range')
  if u['role'] not in ('student','faculty','hod','management'): raise HTTPException(403,'Access denied')
  cur=db.execute('INSERT INTO mark_change_requests(mark_id,student_id,requested_by,old_mark,new_mark,reason,student_approved) VALUES(?,?,?,?,?,?,?)',
                 (x.mark_id,m['student_id'],u['id'],m['mark'],x.new_mark,x.reason,int(x.student_approved)))
  if u['role'] in ('faculty','management') and x.student_approved:
   db.execute("UPDATE mark_change_requests SET status='approved',reviewed_by=?,review_note='Student approved',reviewed_at=CURRENT_TIMESTAMP WHERE id=?",(u['id'],cur.lastrowid))
   db.execute("UPDATE marks SET mark=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",(x.new_mark,x.mark_id))
  return row(db.execute('SELECT * FROM mark_change_requests WHERE id=?',(cur.lastrowid,)))
@app.get('/api/hod/mark-requests')
def requests(u=Depends(roles('hod'))):
 with get_db() as db: return rows(db.execute("SELECT r.*,s.name student_name,m.subject,m.exam,f.name faculty_name FROM mark_change_requests r JOIN users s ON s.id=r.student_id JOIN marks m ON m.id=r.mark_id LEFT JOIN users f ON f.id=r.requested_by WHERE s.department=? ORDER BY r.created_at DESC",(u['department'],)))
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
 with get_db() as db:
  # A faculty member can maintain a timetable when they are the
  # registered Class Adviser for that class. HOD/Management retain control.
  if u['role']=='faculty':
   fp=row(db.execute('SELECT is_class_adviser FROM faculty_profiles WHERE user_id=?',(u['id'],)))
   c=row(db.execute("SELECT c.class_adviser_id FROM classes c JOIN departments d ON d.id=c.department_id WHERE c.name=? AND d.name=?",(x.class_name,u.get('department'))))
   if c and c['class_adviser_id'] and int(c['class_adviser_id'])!=int(u['id']):
    raise HTTPException(403,'Only the Class Adviser can edit this class timetable')
   if (not c or not c['class_adviser_id']) and not (fp and fp['is_class_adviser']):
    raise HTTPException(403,'Only a Class Adviser can edit a class timetable')
  db.execute("INSERT INTO class_timetables(class_name,day,period,start_time,end_time,subject,faculty_name,room,created_by) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(class_name,day,period) DO UPDATE SET start_time=excluded.start_time,end_time=excluded.end_time,subject=excluded.subject,faculty_name=excluded.faculty_name,room=excluded.room",(x.class_name,x.day,x.period,x.start_time,x.end_time,x.subject,x.faculty_name,x.room,u['id']))
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
 with get_db() as db:
  l=row(db.execute('SELECT l.*,s.department FROM leaves l JOIN users s ON s.id=l.student_id WHERE l.id=?',(lid,)))
  if not l or l['department']!=u['department']: raise HTTPException(404,'Leave request not found')
  if l['status']!='pending': raise HTTPException(409,'Leave request already reviewed')
  db.execute('UPDATE leaves SET status=?,reviewed_by=?,adviser_note=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?',
             (x.status,u['id'],x.review_note,lid))
  db.execute('INSERT INTO notifications(user_id,title,message) VALUES(?,?,?)',
             (l['student_id'],'Leave request updated','Your leave request was '+x.status+'.'))
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
 with get_db() as db:
  cur=db.execute('INSERT INTO tests(title,description,subject,class_name,faculty_id,due_date,max_mark,file_id) VALUES(?,?,?,?,?,?,?,?)',(title,description,subject,class_name,u['id'],due_date,max_mark,fid))
  _notify_target_class(db,class_name,'New test published',f'{title} has been assigned to your class. Due: {due_date}.')
 return {'id':cur.lastrowid}
@app.get('/api/academics/tests')
def tests(class_name:str|None=None,u=Depends(current_user)):
 with get_db() as db:
  if u['role']=='student':
   cn=class_name or u['batch']
   return rows(db.execute('SELECT * FROM tests WHERE class_name=? ORDER BY id DESC',(cn,)))
  q='SELECT * FROM tests'; a=[]
  if class_name: q+=' WHERE class_name=?'; a=[class_name]
  return rows(db.execute(q+' ORDER BY id DESC',a))
@app.post('/api/academics/assignments')
def create_assignment(title:str=Form(...),description:str=Form(''),subject:str=Form(''),class_name:str=Form(...),due_date:str=Form(''),max_mark:float=Form(100),file:UploadFile|None=File(None),u=Depends(roles('faculty','hod'))):
 fid=save_file(file,u['id'],'assignment') if file else None
 with get_db() as db:
  cur=db.execute('INSERT INTO assignments(title,description,subject,class_name,faculty_id,due_date,max_mark,file_id) VALUES(?,?,?,?,?,?,?,?)',(title,description,subject,class_name,u['id'],due_date,max_mark,fid))
  _notify_target_class(db,class_name,'New assignment published',f'{title} has been assigned to your class. Due: {due_date}.')
 return {'id':cur.lastrowid}
@app.get('/api/academics/assignments')
def assignments(class_name:str|None=None,u=Depends(current_user)):
 with get_db() as db:
  if u['role']=='student':
   cn=class_name or u['batch']
   return rows(db.execute('SELECT * FROM assignments WHERE class_name=? ORDER BY id DESC',(cn,)))
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
 with get_db() as db: return [clean(r) for r in rows(db.execute("SELECT u.*,fp.classes_handled,fp.subjects_handled,fp.is_class_adviser,COALESCE(fp.is_mentor,0) is_mentor,fp.extra_info FROM users u LEFT JOIN faculty_profiles fp ON fp.user_id=u.id WHERE u.role='faculty' AND u.department=? ORDER BY u.name",(u['department'],)))]
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


# =========================================================
# Extended EduNexa V12 endpoints
# =========================================================

def _department_guard(student_id, u):
    if u["role"] == "management":
        return
    with get_db() as db:
        s=row(db.execute("SELECT department FROM users WHERE id=? AND role='student'",(student_id,)))
    if not s or s["department"] != u["department"]:
        raise HTTPException(403,"Access denied for this department")

@app.get("/api/classes")
def list_classes(department:str|None=None,u=Depends(current_user)):
    d=department or u.get("department")
    if u["role"] not in ("management","hod") and d != u.get("department"):
        raise HTTPException(403,"Access denied")
    with get_db() as db:
        return rows(db.execute("""SELECT c.*,d.name department_name,u.name class_adviser_name
          FROM classes c LEFT JOIN departments d ON d.id=c.department_id
          LEFT JOIN users u ON u.id=c.class_adviser_id
          WHERE d.name=? ORDER BY c.name""",(d,)))

@app.post("/api/classes")
def create_class(p:dict,u=Depends(roles("hod","management"))):
    name=(p.get("name") or "").strip()
    department=p.get("department") or u["department"]
    if not name: raise HTTPException(400,"Class name is required")
    with get_db() as db:
        d=row(db.execute("SELECT id FROM departments WHERE name=?",(department,)))
        if not d:
            cur=db.execute("INSERT INTO departments(name,description) VALUES(?,?)",(department,""))
            did=cur.lastrowid
        else: did=d["id"]
        try:
            cur=db.execute("""INSERT INTO classes(department_id,name,batch,semester,section,class_adviser_id)
              VALUES(?,?,?,?,?,?)""",(did,name,p.get("batch"),p.get("semester"),p.get("section"),p.get("class_adviser_id")))
        except sqlite3.IntegrityError as e:
            raise HTTPException(409,"Class already exists")
    return {"id":cur.lastrowid,"message":"Class created"}

@app.put("/api/classes/{cid}")
def update_class(cid:int,p:dict,u=Depends(roles("hod","management"))):
    allowed={"name","batch","semester","section","class_adviser_id"}
    data={k:v for k,v in p.items() if k in allowed}
    if not data: raise HTTPException(400,"No valid fields supplied")
    with get_db() as db:
        c=row(db.execute("""SELECT c.*,d.name department FROM classes c
          LEFT JOIN departments d ON d.id=c.department_id WHERE c.id=?""",(cid,)))
        if not c or (u["role"]=="hod" and c["department"]!=u["department"]):
            raise HTTPException(404,"Class not found")
        db.execute("UPDATE classes SET "+",".join(k+"=?" for k in data)+" WHERE id=?",
                   (*data.values(),cid))
    return {"message":"Class updated"}

@app.get("/api/departments")
def departments(u=Depends(current_user)):
    with get_db() as db:
        if u["role"]=="management":
            return rows(db.execute("""SELECT d.*,u.name hod_name FROM departments d
              LEFT JOIN users u ON u.id=d.hod_user_id ORDER BY d.name"""))
        return rows(db.execute("""SELECT d.*,u.name hod_name FROM departments d
              LEFT JOIN users u ON u.id=d.hod_user_id WHERE d.name=?""",(u["department"],)))

@app.put("/api/students/{sid}")
def update_student(sid:int,p:dict,u=Depends(roles("faculty","hod","management"))):
    allowed={"name","email","student_id","department","batch","phone","parent_name","parent_phone","designation","attendance","is_active"}
    data={k:v for k,v in p.items() if k in allowed}
    if not data: raise HTTPException(400,"No valid fields supplied")
    _department_guard(sid,u)
    with get_db() as db:
        if "email" in data:
            exists=row(db.execute("SELECT id FROM users WHERE email=? COLLATE NOCASE AND id<>?",(data["email"],sid)))
            if exists: raise HTTPException(409,"Email already registered")
        db.execute("UPDATE users SET "+",".join(k+"=?" for k in data)+" WHERE id=? AND role='student'",
                   (*data.values(),sid))
    return {"message":"Student details updated"}

@app.get("/api/faculty/{fid}")
def faculty_detail(fid:int,u=Depends(current_user)):
    with get_db() as db:
        x=row(db.execute("""SELECT u.*,fp.classes_handled,fp.subjects_handled,
          fp.is_class_adviser,COALESCE(fp.is_mentor,0) is_mentor,fp.extra_info FROM users u
          LEFT JOIN faculty_profiles fp ON fp.user_id=u.id
          WHERE u.id=? AND u.role='faculty'""",(fid,)))
    if not x: raise HTTPException(404,"Faculty not found")
    if u["role"]!="management" and x["department"]!=u["department"]:
        raise HTTPException(403,"Access denied")
    return clean(x)

@app.put("/api/faculty/{fid}")
def update_faculty(fid:int,p:dict,u=Depends(roles("hod","management"))):
    with get_db() as db:
        f=row(db.execute("SELECT * FROM users WHERE id=? AND role='faculty'",(fid,)))
        if not f or (u["role"]=="hod" and f["department"]!=u["department"]):
            raise HTTPException(404,"Faculty not found")
        user_allowed={"name","email","department","designation","phone","qualification","experience","specialization","office"}
        data={k:v for k,v in p.items() if k in user_allowed}
        if data:
            db.execute("UPDATE users SET "+",".join(k+"=?" for k in data)+" WHERE id=?",
                       (*data.values(),fid))
        profile_allowed={"classes_handled","subjects_handled","is_class_adviser","is_mentor","extra_info"}
        pdata={k:v for k,v in p.items() if k in profile_allowed}
        if "classes_handled" in pdata and isinstance(pdata["classes_handled"],list):
            pdata["classes_handled"]=json.dumps(pdata["classes_handled"])
        if "subjects_handled" in pdata and isinstance(pdata["subjects_handled"],list):
            pdata["subjects_handled"]=json.dumps(pdata["subjects_handled"])
        db.execute("INSERT OR IGNORE INTO faculty_profiles(user_id) VALUES(?)",(fid,))
        if pdata:
            db.execute("UPDATE faculty_profiles SET "+",".join(k+"=?" for k in pdata)+" WHERE user_id=?",
                       (*pdata.values(),fid))
    return {"message":"Faculty details updated"}

@app.get("/api/department-hierarchy")
def department_hierarchy(department:str|None=None,u=Depends(current_user)):
    d=department or u.get("department")
    if u["role"] not in ("management","hod") and d != u.get("department"):
        raise HTTPException(403,"Access denied")
    with get_db() as db:
        dept=row(db.execute("SELECT d.*,h.name hod_name FROM departments d LEFT JOIN users h ON h.id=d.hod_user_id WHERE d.name=?",(d,)))
        if not dept: raise HTTPException(404,"Department not found")
        faculty=rows(db.execute("""SELECT u.id,u.name,u.email,u.faculty_id,u.designation,
          COALESCE(fp.is_class_adviser,0) is_class_adviser,COALESCE(fp.is_mentor,0) is_mentor
          FROM users u LEFT JOIN faculty_profiles fp ON fp.user_id=u.id
          WHERE u.role='faculty' AND u.department=? ORDER BY u.name""",(d,)))
        classes=rows(db.execute("""SELECT c.id,c.name,c.batch,c.semester,c.section,c.class_adviser_id,ca.name class_adviser_name
          FROM classes c LEFT JOIN users ca ON ca.id=c.class_adviser_id
          JOIN departments d ON d.id=c.department_id WHERE d.name=? ORDER BY c.name""",(d,)))
        students=rows(db.execute("""SELECT s.id,s.name,s.student_id,s.email,s.batch,a.class_id,c.name assigned_class_name,
          ca.name class_adviser_name,me.name mentor_name
          FROM users s LEFT JOIN student_staff_assignments a ON a.student_id=s.id
          LEFT JOIN classes c ON c.id=a.class_id LEFT JOIN users ca ON ca.id=a.class_adviser_id
          LEFT JOIN users me ON me.id=a.mentor_id
          WHERE s.role='student' AND s.department=? ORDER BY s.name""",(d,)))
    return {"department":dept,"faculty":faculty,"classes":classes,"students":students}

@app.get("/api/student-records/{sid}")
def student_records_for_staff(sid:int,u=Depends(roles("faculty","hod","management"))):
    _department_guard(sid,u)
    with get_db() as db:
        return {
          "certificates":rows(db.execute("""SELECT c.*,f.original_name FROM certificates c
             LEFT JOIN files f ON f.id=c.file_id WHERE c.student_id=? ORDER BY c.id DESC""",(sid,))),
          "courses":rows(db.execute("""SELECT c.*,f.original_name FROM courses c
             LEFT JOIN files f ON f.id=c.certificate_file_id WHERE c.student_id=? ORDER BY c.id DESC""",(sid,))),
          "internships":rows(db.execute("""SELECT i.*,f.original_name FROM internships i
             LEFT JOIN files f ON f.id=i.file_id WHERE i.student_id=? ORDER BY i.id DESC""",(sid,)))
        }

@app.post("/api/student-records/{kind}/with-file")
def student_record_with_file(kind:str,title:str=Form(""),issuer:str=Form(""),
    provider:str=Form(""),completion_date:str=Form(""),company:str=Form(""),
    role:str=Form(""),start_date:str=Form(""),end_date:str=Form(""),
    description:str=Form(""),file:UploadFile|None=File(None),
    u=Depends(roles("student"))):
    if kind not in ("certificate","course","internship"):
        raise HTTPException(400,"Invalid record type")
    fid=save_file(file,u["id"],kind) if file else None
    with get_db() as db:
        if kind=="certificate":
            cur=db.execute("INSERT INTO certificates(student_id,title,issuer,completion_date,file_id) VALUES(?,?,?,?,?)",
                           (u["id"],title,issuer,completion_date,fid))
        elif kind=="course":
            cur=db.execute("INSERT INTO courses(student_id,title,provider,completion_date,certificate_file_id) VALUES(?,?,?,?,?)",
                           (u["id"],title,provider,completion_date,fid))
        else:
            cur=db.execute("""INSERT INTO internships(student_id,company,role,start_date,end_date,description,file_id)
              VALUES(?,?,?,?,?,?,?)""",(u["id"],company,role,start_date,end_date,description,fid))
    return {"id":cur.lastrowid,"file_id":fid,"message":"Student record saved"}

@app.get("/api/submissions")
def list_submissions(item_type:str|None=None,item_id:int|None=None,
                     student_id:int|None=None,u=Depends(current_user)):
    if u["role"]=="student":
        sid=u["id"]
    else:
        sid=student_id
        if sid is not None: _department_guard(sid,u)
    with get_db() as db:
        q="""SELECT s.*,u.name student_name,u.student_id as register_no,
             f.original_name FROM submissions s
             LEFT JOIN users u ON u.id=s.student_id
             LEFT JOIN files f ON f.id=s.file_id WHERE 1=1"""
        a=[]
        if sid is not None: q+=" AND s.student_id=?"; a.append(sid)
        if item_type: q+=" AND s.item_type=?"; a.append(item_type)
        if item_id is not None: q+=" AND s.item_id=?"; a.append(item_id)
        return rows(db.execute(q+" ORDER BY s.submitted_at DESC",a))

@app.put("/api/submissions/{submission_id}/mark")
def mark_submission(submission_id:int, p:dict, u=Depends(roles("faculty","hod"))):
    mark=float(p.get("mark",0))
    with get_db() as db:
        s=row(db.execute("""SELECT s.*,u.department FROM submissions s
          JOIN users u ON u.id=s.student_id WHERE s.id=?""",(submission_id,)))
        if not s or s["department"]!=u["department"]: raise HTTPException(404,"Submission not found")
        db.execute("UPDATE submissions SET mark=?,status=? WHERE id=?",(mark,p.get("status","evaluated"),submission_id))
    return {"message":"Submission evaluated"}

@app.put("/api/feedback/{fid}/response")
def feedback_response(fid:int,p:dict,u=Depends(roles("faculty","hod","management"))):
    status=p.get("status","reviewed")
    response=p.get("response") or p.get("message") or ""
    with get_db() as db:
        f=row(db.execute("""SELECT f.*,s.department FROM feedbacks f
          LEFT JOIN users s ON s.id=f.student_id WHERE f.id=?""",(fid,)))
        if not f or (u["role"]!="management" and f["department"]!=u["department"]):
            raise HTTPException(404,"Feedback not found")
        db.execute("""UPDATE feedbacks SET status=?,response=?,responded_by=?,
          responded_at=CURRENT_TIMESTAMP WHERE id=?""",(status,response,u["id"],fid))
        if f["student_id"]:
            db.execute("INSERT INTO notifications(user_id,title,message) VALUES(?,?,?)",
                       (f["student_id"],"Feedback response","Your feedback has received a response."))
    return {"message":"Feedback response saved"}

@app.get("/api/management/dashboard")
def management_dashboard(u=Depends(roles("management"))):
    with get_db() as db:
        return {
          "role":"management",
          "departments":db.execute("SELECT COUNT(*) FROM departments").fetchone()[0],
          "students":db.execute("SELECT COUNT(*) FROM users WHERE role='student'").fetchone()[0],
          "faculty":db.execute("SELECT COUNT(*) FROM users WHERE role='faculty'").fetchone()[0],
          "companies":db.execute("SELECT COUNT(*) FROM placement_companies").fetchone()[0],
          "placed_students":db.execute("SELECT COUNT(*) FROM placements WHERE offer_status='placed'").fetchone()[0]
        }

@app.get("/api/management/students")
def management_students(department:str|None=None,class_name:str|None=None,u=Depends(roles("management"))):
    with get_db() as db:
        q="""SELECT u.id,u.name,u.email,u.student_id,u.department,u.batch,u.phone,
             u.parent_name,u.parent_phone,u.attendance,
             COALESCE(AVG(m.mark),0) average_mark,
             COALESCE(f.tuition_total,0) tuition_total,COALESCE(f.tuition_paid,0) tuition_paid,
             COALESCE(f.bus_total,0) bus_total,COALESCE(f.bus_paid,0) bus_paid,
             COALESCE(f.hostel_total,0) hostel_total,COALESCE(f.hostel_paid,0) hostel_paid,
             COALESCE(f.placement_total,0) placement_total,COALESCE(f.placement_paid,0) placement_paid
             FROM users u LEFT JOIN marks m ON m.student_id=u.id
             LEFT JOIN fees f ON f.student_id=u.id
             WHERE u.role='student'"""
        a=[]
        if department: q+=" AND u.department=?"; a.append(department)
        if class_name: q+=" AND u.batch=?"; a.append(class_name)
        return rows(db.execute(q+" GROUP BY u.id ORDER BY u.department,u.batch,u.name",a))

@app.get("/api/management/marks/{sid}")
def management_marks(sid:int,u=Depends(roles("management"))):
    with get_db() as db:
        return rows(db.execute("""SELECT m.*,u.name student_name,u.student_id register_no
          FROM marks m JOIN users u ON u.id=m.student_id WHERE m.student_id=?
          ORDER BY m.subject,m.exam""",(sid,)))

@app.put("/api/management/marks/{mid}")
def management_update_mark(mid:int,p:dict,u=Depends(roles("management"))):
    if "mark" not in p: raise HTTPException(400,"mark is required")
    new=float(p["mark"])
    with get_db() as db:
        m=row(db.execute("""SELECT m.*,u.department FROM marks m
          JOIN users u ON u.id=m.student_id WHERE m.id=?""",(mid,)))
        if not m: raise HTTPException(404,"Mark not found")
        if new<0 or new>m["max_mark"]: raise HTTPException(400,"Mark out of range")
        # Management can change marks only with explicit student approval.
        if not bool(p.get("student_approved",False)):
            raise HTTPException(409,"Student approval is required for management mark changes")
        db.execute("UPDATE marks SET mark=?,entered_by=?,updated_at=CURRENT_TIMESTAMP WHERE id=?",
                   (new,u["id"],mid))
    return {"message":"Mark updated with student approval"}

@app.get("/api/management/fees/structures")
def fee_structures(department:str|None=None,u=Depends(roles("management","hod"))):
    d=department or (u["department"] if u["role"]=="hod" else None)
    with get_db() as db:
        if d: return rows(db.execute("SELECT * FROM fee_structures WHERE department=? ORDER BY class_name",(d,)))
        return rows(db.execute("SELECT * FROM fee_structures ORDER BY department,class_name"))

@app.post("/api/management/fees/structures")
def save_fee_structure(p:dict,u=Depends(roles("management","hod"))):
    d=p.get("department") or u["department"]
    if u["role"]=="hod" and d!=u["department"]: raise HTTPException(403,"Access denied")
    vals=(d,p.get("class_name",""),float(p.get("tuition",0)),float(p.get("bus",0)),
          float(p.get("hostel",0)),float(p.get("placement",0)))
    with get_db() as db:
        db.execute("""INSERT INTO fee_structures(department,class_name,tuition,bus,hostel,placement)
          VALUES(?,?,?,?,?,?) ON CONFLICT(department,class_name) DO UPDATE SET
          tuition=excluded.tuition,bus=excluded.bus,hostel=excluded.hostel,placement=excluded.placement""",vals)
    return {"message":"Fee structure saved"}

@app.get("/api/management/faculty")
def management_faculty(department:str|None=None,u=Depends(roles("management"))):
    with get_db() as db:
        q="""SELECT u.*,fp.classes_handled,fp.subjects_handled,
          fp.is_class_adviser,COALESCE(fp.is_mentor,0) is_mentor,fp.extra_info FROM users u
          LEFT JOIN faculty_profiles fp ON fp.user_id=u.id
          WHERE u.role='faculty'"""
        a=[]
        if department: q+=" AND u.department=?"; a.append(department)
        return [clean(r) for r in rows(db.execute(q+" ORDER BY u.department,u.name",a))]

@app.get("/api/management/placements")
def management_placements(department:str|None=None,u=Depends(roles("management"))):
    with get_db() as db:
        q="""SELECT p.*,c.company_name,c.industry,c.location,c.visited,
          u.name student_name,u.student_id,u.department FROM placements p
          JOIN users u ON u.id=p.student_id LEFT JOIN placement_companies c ON c.id=p.company_id"""
        a=[]
        if department: q+=" WHERE u.department=?"; a.append(department)
        return rows(db.execute(q+" ORDER BY p.package DESC",a))

@app.put("/api/notifications/read-all")
def notification_read_all(u=Depends(current_user)):
    with get_db() as db:
        db.execute("UPDATE notifications SET is_read=1 WHERE user_id=?",(u["id"],))
    return {"message":"All notifications marked read"}

@app.get('/api/hod/faculty-timetables')
def hod_faculty_timetables(u=Depends(roles('hod'))):
 with get_db() as db:
  faculty=rows(db.execute("SELECT id,name FROM users WHERE role='faculty' AND department=?",(u['department'],)))
  result=[]
  for f in faculty:
   tts=rows(db.execute("SELECT ft.*,u.name faculty_name FROM faculty_timetables ft JOIN users u ON u.id=ft.faculty_id WHERE ft.faculty_id=? ORDER BY ft.day,ft.period",(f['id'],)))
   result.extend(tts)
  return result

@app.get('/api/hod/faculty-attendance')
def hod_faculty_attendance(date:str|None=None,u=Depends(roles('hod'))):
 with get_db() as db:
  faculty=rows(db.execute("SELECT id,name FROM users WHERE role='faculty' AND department=?",(u['department'],)))
  q="SELECT fa.*,u.name faculty_name FROM faculty_attendance fa JOIN users u ON u.id=fa.faculty_id WHERE u.department=?"
  p=[u['department']]
  if date: q+=" AND fa.date=?"; p.append(date)
  q+=" ORDER BY fa.date DESC,u.name"
  records=rows(db.execute(q,p))
  return {'faculty':[{'id':f['id'],'name':f['name']} for f in faculty],'attendance':records}

@app.post('/api/hod/faculty-attendance')
def record_faculty_attendance(p:dict,u=Depends(roles('hod'))):
 faculty_id=p.get('faculty_id'); date=p.get('date'); status=p.get('status'); remarks=p.get('remarks','')
 if not all([faculty_id,date,status]): raise HTTPException(400,'faculty_id, date, and status required')
 with get_db() as db:
  db.execute("INSERT INTO faculty_attendance(faculty_id,date,status,remarks,marked_by) VALUES(?,?,?,?,?) ON CONFLICT(faculty_id,date) DO UPDATE SET status=excluded.status,remarks=excluded.remarks,marked_by=excluded.marked_by",(faculty_id,date,status,remarks,u['id']))
 return {'message':'Faculty attendance recorded'}

@app.post('/api/marks/change-requests')
def create_mark_change_requests(p:dict,u=Depends(roles('faculty','hod'))):
 student_id=p.get('student_id'); reason=p.get('reason',''); marks_list=p.get('marks',[])
 if not student_id or not marks_list: raise HTTPException(400,'student_id and marks required')
 with get_db() as db:
  ids=[]
  for m in marks_list:
   exam=m.get('exam',''); new_mark=float(m.get('mark',0))
   existing=row(db.execute('SELECT * FROM marks WHERE student_id=? AND exam=?',(student_id,exam)))
   if existing:
    cur=db.execute('INSERT INTO mark_change_requests(mark_id,student_id,requested_by,old_mark,new_mark,reason) VALUES(?,?,?,?,?,?)',(existing['id'],student_id,u['id'],existing['mark'],new_mark,reason))
    ids.append(cur.lastrowid)
  return {'ids':ids,'message':str(len(ids))+' request(s) submitted'}


# =========================================================
# EduNexa V13 - Faculty assessment, attendance, leave and
# student class-details enhancements. Existing endpoints remain.
# =========================================================

def _notify_target_class(db, class_name, title, message, exclude_user_id=None):
    """Notify only students assigned to the requested class."""
    students = rows(db.execute("""
        SELECT DISTINCT s.id
        FROM users s
        LEFT JOIN student_staff_assignments a ON a.student_id=s.id
        LEFT JOIN classes c ON c.id=a.class_id
        WHERE s.role='student'
          AND (
             c.name=?
             OR (c.name IS NULL AND s.batch=?)
          )
    """, (class_name, class_name)))
    for s in students:
        if exclude_user_id is not None and int(s["id"]) == int(exclude_user_id):
            continue
        db.execute(
            "INSERT INTO notifications(user_id,title,message) VALUES(?,?,?)",
            (s["id"], title, message)
        )

def _assessment_stats(db, item_type, item_id):
    viewed = db.execute(
        "SELECT COUNT(*) FROM assessment_views WHERE item_type=? AND item_id=?",
        (item_type, item_id)
    ).fetchone()[0]
    completed = db.execute(
        """SELECT COUNT(*) FROM submissions
           WHERE item_type=? AND item_id=?
             AND status IN ('submitted','evaluated','completed')""",
        (item_type, item_id)
    ).fetchone()[0]
    details = rows(db.execute("""
        SELECT s.id student_id, s.name student_name, s.student_id register_no,
               CASE WHEN av.id IS NULL THEN 0 ELSE 1 END seen,
               CASE WHEN sub.id IS NULL THEN 0 ELSE 1 END completed,
               sub.status submission_status, sub.mark, sub.submitted_at
        FROM users s
        LEFT JOIN assessment_views av
          ON av.student_id=s.id AND av.item_type=? AND av.item_id=?
        LEFT JOIN submissions sub
          ON sub.student_id=s.id AND sub.item_type=? AND sub.item_id=?
        WHERE s.role='student'
        ORDER BY s.name
    """, (item_type, item_id, item_type, item_id)))
    return {"seen_count": viewed, "completed_count": completed, "students": details}

@app.get("/api/academics/tests/{test_id}/details")
def test_details(test_id:int, u=Depends(roles("faculty","hod"))):
    with get_db() as db:
        t=row(db.execute("""SELECT t.*,u.name faculty_name
            FROM tests t LEFT JOIN users u ON u.id=t.faculty_id WHERE t.id=?""",(test_id,)))
        if not t: raise HTTPException(404,"Test not found")
        if u["role"]!="hod" and t["faculty_id"] not in (None,u["id"]):
            raise HTTPException(403,"Access denied")
        return {"test":t, **_assessment_stats(db,"test",test_id)}

@app.put("/api/academics/tests/{test_id}")
def edit_test(test_id:int, p:dict, u=Depends(roles("faculty","hod"))):
    allowed={"title","description","subject","class_name","due_date","max_mark"}
    data={k:p[k] for k in allowed if k in p}
    if not data: raise HTTPException(400,"No valid fields supplied")
    with get_db() as db:
        t=row(db.execute("SELECT * FROM tests WHERE id=?",(test_id,)))
        if not t: raise HTTPException(404,"Test not found")
        if u["role"]!="hod" and t["faculty_id"]!=u["id"]: raise HTTPException(403,"Access denied")
        db.execute("UPDATE tests SET "+",".join(k+"=?" for k in data)+" WHERE id=?",
                   (*data.values(),test_id))
    return {"message":"Test updated"}

@app.get("/api/academics/tests/history")
def test_history(u=Depends(roles("faculty","hod"))):
    with get_db() as db:
        q="SELECT t.*,u.name faculty_name FROM tests t LEFT JOIN users u ON u.id=t.faculty_id"
        a=[]
        if u["role"]=="faculty":
            q+=" WHERE t.faculty_id=?"; a=[u["id"]]
        return rows(db.execute(q+" ORDER BY t.id DESC",a))

@app.post("/api/academics/tests/{test_id}/view")
def mark_test_viewed(test_id:int,u=Depends(roles("student"))):
    with get_db() as db:
        t=row(db.execute("SELECT * FROM tests WHERE id=?",(test_id,)))
        if not t: raise HTTPException(404,"Test not found")
        db.execute("""INSERT OR IGNORE INTO assessment_views(student_id,item_type,item_id)
                      VALUES(?,?,?)""",(u["id"],"test",test_id))
    return {"message":"Test marked as seen"}

@app.get("/api/academics/assignments/{assignment_id}/details")
def assignment_details(assignment_id:int, u=Depends(roles("faculty","hod"))):
    with get_db() as db:
        a=row(db.execute("""SELECT a.*,u.name faculty_name
            FROM assignments a LEFT JOIN users u ON u.id=a.faculty_id
            WHERE a.id=?""",(assignment_id,)))
        if not a: raise HTTPException(404,"Assignment not found")
        if u["role"]!="hod" and a["faculty_id"] not in (None,u["id"]):
            raise HTTPException(403,"Access denied")
        return {"assignment":a, **_assessment_stats(db,"assignment",assignment_id)}

@app.put("/api/academics/assignments/{assignment_id}")
def edit_assignment(assignment_id:int, p:dict, u=Depends(roles("faculty","hod"))):
    allowed={"title","description","subject","class_name","due_date","max_mark"}
    data={k:p[k] for k in allowed if k in p}
    if not data: raise HTTPException(400,"No valid fields supplied")
    with get_db() as db:
        a=row(db.execute("SELECT * FROM assignments WHERE id=?",(assignment_id,)))
        if not a: raise HTTPException(404,"Assignment not found")
        if u["role"]!="hod" and a["faculty_id"]!=u["id"]: raise HTTPException(403,"Access denied")
        db.execute("UPDATE assignments SET "+",".join(k+"=?" for k in data)+" WHERE id=?",
                   (*data.values(),assignment_id))
    return {"message":"Assignment updated"}

@app.get("/api/academics/assignments/history")
def assignment_history(u=Depends(roles("faculty","hod"))):
    with get_db() as db:
        q="SELECT a.*,u.name faculty_name FROM assignments a LEFT JOIN users u ON u.id=a.faculty_id"
        a=[]
        if u["role"]=="faculty":
            q+=" WHERE a.faculty_id=?"; a=[u["id"]]
        return rows(db.execute(q+" ORDER BY a.id DESC",a))

@app.post("/api/academics/assignments/{assignment_id}/view")
def mark_assignment_viewed(assignment_id:int,u=Depends(roles("student"))):
    with get_db() as db:
        a=row(db.execute("SELECT * FROM assignments WHERE id=?",(assignment_id,)))
        if not a: raise HTTPException(404,"Assignment not found")
        db.execute("""INSERT OR IGNORE INTO assessment_views(student_id,item_type,item_id)
                      VALUES(?,?,?)""",(u["id"],"assignment",assignment_id))
    return {"message":"Assignment marked as seen"}

@app.get("/api/faculty/attendance-summary")
def faculty_attendance_summary(u=Depends(roles("faculty","hod"))):
    with get_db() as db:
        if u["role"]=="hod":
            classes=rows(db.execute("""
                SELECT c.id,c.name,c.batch,c.semester,c.section,
                       ca.name class_adviser_name
                FROM classes c
                JOIN departments d ON d.id=c.department_id
                LEFT JOIN users ca ON ca.id=c.class_adviser_id
                WHERE d.name=? ORDER BY c.name""",(u["department"],)))
            students=rows(db.execute("""
                SELECT s.id,s.name,s.student_id,s.department,s.batch,
                       c.name class_name,
                       ROUND(CASE WHEN COUNT(a.id)=0 THEN COALESCE(s.attendance,0)
                                  ELSE 100.0*SUM(CASE WHEN LOWER(a.status)='present' THEN 1 ELSE 0 END)/COUNT(a.id) END,2) attendance_percentage
                FROM users s
                LEFT JOIN student_staff_assignments sa ON sa.student_id=s.id
                LEFT JOIN classes c ON c.id=sa.class_id
                LEFT JOIN attendance a ON a.student_id=s.id
                WHERE s.role='student' AND s.department=?
                GROUP BY s.id ORDER BY c.name,s.name""",(u["department"],)))
        else:
            fp=row(db.execute("SELECT classes_handled,is_class_adviser FROM faculty_profiles WHERE user_id=?",(u["id"],)))
            handled=set()
            try:
                vals=json.loads(fp["classes_handled"] or "[]") if fp else []
                handled.update(vals if isinstance(vals,list) else [])
            except Exception: pass
            cls=rows(db.execute("""
                SELECT c.id,c.name,c.batch,c.semester,c.section,ca.name class_adviser_name
                FROM classes c JOIN departments d ON d.id=c.department_id
                LEFT JOIN users ca ON ca.id=c.class_adviser_id
                WHERE d.name=? AND (c.class_adviser_id=? OR c.name IN (%s))
                ORDER BY c.name
            """ % (",".join(["?"]*len(handled)) if handled else "NULL"),
            tuple([u["department"],u["id"],*handled])))
            # If a faculty has no class profile, still show students in their department
            if not cls:
                cls=rows(db.execute("""
                    SELECT c.id,c.name,c.batch,c.semester,c.section,ca.name class_adviser_name
                    FROM classes c JOIN departments d ON d.id=c.department_id
                    LEFT JOIN users ca ON ca.id=c.class_adviser_id
                    WHERE d.name=? ORDER BY c.name""",(u["department"],)))
            class_names=[c["name"] for c in cls]
            if class_names:
                ph=",".join(["?"]*len(class_names))
                students=rows(db.execute(f"""
                    SELECT s.id,s.name,s.student_id,s.department,s.batch,c.name class_name,
                           ROUND(CASE WHEN COUNT(a.id)=0 THEN COALESCE(s.attendance,0)
                                      ELSE 100.0*SUM(CASE WHEN LOWER(a.status)='present' THEN 1 ELSE 0 END)/COUNT(a.id) END,2) attendance_percentage
                    FROM users s
                    LEFT JOIN student_staff_assignments sa ON sa.student_id=s.id
                    LEFT JOIN classes c ON c.id=sa.class_id
                    LEFT JOIN attendance a ON a.student_id=s.id
                    WHERE s.role='student' AND s.department=?
                      AND (c.name IN ({ph}) OR c.name IS NULL)
                    GROUP BY s.id ORDER BY c.name,s.name""",
                    tuple([u["department"],*class_names])))
            else:
                students=[]
    return {"classes":classes,"students":students}

@app.get("/api/leaves/all")
def all_leave_requests(student_name:str|None=None,status:str|None=None,
                       date:str|None=None,month:str|None=None,
                       u=Depends(roles("faculty","hod"))):
    with get_db() as db:
        q="""SELECT l.*,s.name student_name,s.student_id register_no,
                    s.department,s.batch,rv.name reviewed_by_name
             FROM leaves l JOIN users s ON s.id=l.student_id
             LEFT JOIN users rv ON rv.id=l.reviewed_by
             WHERE s.department=?"""
        a=[u["department"]]
        if student_name:
            q+=" AND LOWER(s.name) LIKE LOWER(?)"; a.append("%"+student_name+"%")
        if status and status.lower()!="all":
            q+=" AND LOWER(l.status)=LOWER(?)"; a.append(status.lower())
        if date:
            q+=" AND (l.from_date<=? AND l.to_date>=?)"; a.extend([date,date])
        if month:
            q+=" AND (substr(l.from_date,1,7)=? OR substr(l.to_date,1,7)=?)"; a.extend([month,month])
        return rows(db.execute(q+" ORDER BY l.created_at DESC",a))

@app.get("/api/student/class-details")
def student_class_details(u=Depends(roles("student"))):
    with get_db() as db:
        x=row(db.execute("""
            SELECT s.id,s.name,s.student_id,s.department,s.batch,
                   c.id class_id,c.name class_name,c.batch class_batch,
                   c.semester,c.section,
                   ca.name class_adviser_name,
                   me.name mentor_name,
                   h.name hod_name
            FROM users s
            LEFT JOIN student_staff_assignments a ON a.student_id=s.id
            LEFT JOIN classes c ON c.id=a.class_id
            LEFT JOIN users ca ON ca.id=COALESCE(a.class_adviser_id,c.class_adviser_id)
            LEFT JOIN users me ON me.id=a.mentor_id
            LEFT JOIN departments d ON d.id=c.department_id
            LEFT JOIN users h ON h.id=d.hod_user_id
            WHERE s.id=?""",(u["id"],)))
        if not x: raise HTTPException(404,"Student class details not found")
        class_name=x["class_name"] or x["batch"] or "II B.Sc Data Analytics"
        timetable=rows(db.execute("""
            SELECT id,class_name,day,period,start_time,end_time,subject,faculty_name,room
            FROM class_timetables WHERE class_name=? ORDER BY
            CASE day WHEN 'Monday' THEN 1 WHEN 'Tuesday' THEN 2 WHEN 'Wednesday' THEN 3
                     WHEN 'Thursday' THEN 4 WHEN 'Friday' THEN 5 WHEN 'Saturday' THEN 6 ELSE 7 END,
            CAST(period AS INTEGER),start_time""",(class_name,)))
        faculties=rows(db.execute("""
            SELECT DISTINCT faculty_name FROM class_timetables
            WHERE class_name=? AND faculty_name IS NOT NULL AND faculty_name<>''
            ORDER BY faculty_name""",(class_name,)))
        x["subject_faculty_names"]=[f["faculty_name"] for f in faculties]
        x["timetable"]=timetable
        return x
