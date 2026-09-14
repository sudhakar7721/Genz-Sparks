/* =========================================================
   EDUNEXA V13 FEATURE PACK
   Additive only: keeps all existing modules and handlers.
   ========================================================= */
(function(){
  'use strict';
  const escV13 = s => (typeof esc==='function'?esc(String(s??'')):String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])));
  const api = () => window.EduNexaAPI && window.EduNexaAPI.request;
  const cls = () => currentUser?.className || currentUser?.assignedClassName || currentUser?.classesHandled?.[0] || currentUser?.batch || 'II B.Sc Data Analytics';
  const latest3 = a => (a||[]).slice().sort((x,y)=>Number(y.id)-Number(x.id)).slice(0,3);
  const itemId = x => Number(x.__backendId || x.id);

  function studentTargeted(className){
    return (db.users||[]).filter(s=>s.role==='student' && (s.className===className || s.assignedClassName===className || (!s.className && s.batch===className)));
  }

  window.createTest = async function(event){
    event.preventDefault();
    const title=document.getElementById('testTitle')?.value.trim(), subject=document.getElementById('testSubject')?.value.trim();
    const start=document.getElementById('testStart')?.value, due=document.getElementById('testDue')?.value, className=document.getElementById('testClass')?.value || cls();
    if(new Date(due)<new Date(start)){toast('Due date cannot be before start date.');return;}
    const parse=v=>{const p=v.split('|').map(x=>x.trim()); if(p.length<6)throw Error('Question format is invalid.'); const ans=Number(p[5]); if(!Number.isInteger(ans)||ans<1||ans>4)throw Error('Correct option must be 1 to 4.'); return {q:p[0],opts:p.slice(1,5),ans:ans-1};};
    let questions=[]; try{questions=[parse(document.getElementById('q1')?.value||''),parse(document.getElementById('q2')?.value||'')];}catch(e){toast(e.message);return;}
    const test={id:Date.now(),title,subject,className,faculty:currentUser.name,start,due,questions,__synced:false};
    db.tests.push(test); let backendCreated=false;
    if(api() && localStorage.getItem('edunexa_token')){
      try{
        const f=new FormData(); f.append('title',title); f.append('description',JSON.stringify({questions,start})); f.append('subject',subject); f.append('class_name',className); f.append('due_date',due); f.append('max_mark','100');
        const r=await api()('/academics/tests',{method:'POST',body:f}); test.__backendId=r.id; test.id=Number(r.id); test.__synced=true; backendCreated=true;
      }catch(e){console.warn('V13 test sync deferred',e);}
    }
    if(!backendCreated) studentTargeted(className).forEach(s=>addNotice('New test published',`${title} is available for ${className}. Due: ${due}.`,s.studentId));
    save(); refreshAll(); event.target.reset(); toast('Test published and targeted-class students notified.');
  };

  window.createAssignment = async function(event){
    event.preventDefault();
    const title=document.getElementById('asTitle')?.value.trim(), subject=document.getElementById('asSubject')?.value.trim(), assigned=document.getElementById('asAssigned')?.value, due=document.getElementById('asDue')?.value, description=document.getElementById('asDesc')?.value.trim(), className=document.getElementById('asClass')?.value||cls();
    if(new Date(due)<new Date(assigned)){toast('Due date cannot be before assigned date.');return;}
    const a={id:Date.now(),title,subject,className,faculty:currentUser.name,assigned,due,description,__synced:false}; db.assignments.push(a); let backendCreated=false;
    if(api() && localStorage.getItem('edunexa_token')){try{const f=new FormData();f.append('title',title);f.append('description',description);f.append('subject',subject);f.append('class_name',className);f.append('due_date',due);f.append('max_mark','100');const r=await api()('/academics/assignments',{method:'POST',body:f});a.__backendId=r.id;a.id=Number(r.id);a.__synced=true;backendCreated=true;}catch(e){console.warn('V13 assignment sync deferred',e);}}
    if(!backendCreated) studentTargeted(className).forEach(s=>addNotice('New assignment published',`${title} is available for ${className}. Due: ${due}.`,s.studentId));
    save();refreshAll();event.target.reset();toast('Assignment published and targeted-class students notified.');
  };

  async function assessmentDetails(type,id){
    const endpoint=type==='test'?`/academics/tests/${id}/details`:`/academics/assignments/${id}/details`;
    try{return await api()(endpoint);}catch(e){return null;}
  }
  function openOverlay(html){
    let o=document.getElementById('v13Overlay'); if(!o){o=document.createElement('div');o.id='v13Overlay';document.body.appendChild(o);}
    o.innerHTML=`<div class="v13-backdrop" onclick="document.getElementById('v13Overlay').remove()"><div class="v13-modal" onclick="event.stopPropagation()">${html}<button class="btn secondary" onclick="document.getElementById('v13Overlay').remove()">Close</button></div></div>`;
  }
  window.viewFacultyAssessment = async function(type,id){
    const list=type==='test'?db.tests:db.assignments, x=list.find(a=>Number(a.id)===Number(id)||Number(a.__backendId)===Number(id));
    if(!x)return;
    const d=await assessmentDetails(type,itemId(x));
    const students=d?.students||[]; const desc=d?.[type]?.description||x.description||'';
    let q=''; try{const j=JSON.parse(desc); if(j.questions)q=`<h4>Questions</h4><ol>${j.questions.map(v=>`<li>${escV13(v.q)}<br><small>${(v.opts||[]).map(escV13).join(' • ')}</small></li>`).join('')}</ol>`;}catch(e){q=desc?`<p>${escV13(desc)}</p>`:'';}
    const rows=students.map(s=>`<tr><td>${escV13(s.student_name)}</td><td>${s.register_no||''}</td><td>${s.seen?'Seen':'Not seen'}</td><td>${s.completed?'Completed':'Not completed'}</td><td>${s.submission_status||'—'}</td></tr>`).join('');
    openOverlay(`<h2>${escV13(x.title)}</h2><p><b>Subject:</b> ${escV13(x.subject)} &nbsp; <b>Class:</b> ${escV13(x.className)}</p><p><b>Due:</b> ${escV13(x.due)}</p><div class="v13-stat-grid"><div><b>${d?.seen_count??0}</b><small>Students Seen</small></div><div><b>${d?.completed_count??0}</b><small>Students Completed</small></div></div>${q}<h4>Student Activity</h4><div class="table-wrap"><table><thead><tr><th>Student</th><th>ID</th><th>Seen</th><th>Completed</th><th>Status</th></tr></thead><tbody>${rows||'<tr><td colspan="5">No student activity yet.</td></tr>'}</tbody></table></div><button class="btn primary" onclick="editFacultyAssessment('${type}',${itemId(x)})">Edit</button>`);
  };
  window.editFacultyAssessment=function(type,id){
    const x=(type==='test'?db.tests:db.assignments).find(a=>Number(a.id)===Number(id)||Number(a.__backendId)===Number(id)); if(!x)return;
    openOverlay(`<h2>Edit ${type==='test'?'Test':'Assignment'}</h2><div class="form-group"><label>Title</label><input id="v13EditTitle" class="control" value="${escV13(x.title)}"></div><div class="form-group"><label>Subject</label><input id="v13EditSubject" class="control" value="${escV13(x.subject)}"></div><div class="form-group"><label>Due Date</label><input id="v13EditDue" type="date" class="control" value="${escV13(x.due)}"></div><div class="form-group"><label>Description</label><textarea id="v13EditDesc" class="control">${escV13(x.description||'')}</textarea></div><button class="btn primary" onclick="saveFacultyAssessmentEdit('${type}',${itemId(x)})">Save Changes</button>`);
  };
  window.saveFacultyAssessmentEdit=async function(type,id){
    const x=(type==='test'?db.tests:db.assignments).find(a=>Number(a.id)===Number(id)||Number(a.__backendId)===Number(id)); if(!x)return;
    const payload={title:document.getElementById('v13EditTitle').value.trim(),subject:document.getElementById('v13EditSubject').value.trim(),due_date:document.getElementById('v13EditDue').value,description:document.getElementById('v13EditDesc').value};
    try{await api()(`/academics/${type==='test'?'tests':'assignments'}/${id}`,{method:'PUT',body:JSON.stringify(payload)});Object.assign(x,{title:payload.title,subject:payload.subject,due:payload.due_date,description:payload.description});save();refreshAll();document.getElementById('v13Overlay')?.remove();toast(`${type==='test'?'Test':'Assignment'} updated successfully.`);}catch(e){toast(e.message||'Unable to update.');}
  };

  window.renderFacultyTests=function(){
    const e=document.getElementById('facultyTestList');if(!e)return;const arr=latest3(db.tests);
    e.innerHTML=(arr.length?arr.map(t=>`<div class="item"><div class="item-top"><div><b>${escV13(t.title)}</b><p>${escV13(t.subject)} • Class: ${escV13(t.className||'All')} • ${escV13(t.start)} → ${escV13(t.due)} • ${(t.questions||[]).length} questions</p></div><button class="btn primary" onclick="viewFacultyAssessment('test',${itemId(t)})">View</button></div></div>`).join(''):'<div class="empty">No tests published.</div>')+`<div class="actions" style="margin-top:12px"><button class="btn secondary" onclick="showAssessmentHistory('test')">History</button></div>`;
  };
  window.renderFacultyAssignments=function(){
    const e=document.getElementById('facultyAssignmentList');if(!e)return;const arr=latest3(db.assignments);
    e.innerHTML=(arr.length?arr.map(a=>`<div class="item"><div class="item-top"><div><b>${escV13(a.title)}</b><p>${escV13(a.subject)} • Class: ${escV13(a.className||'All')} • ${escV13(a.assigned)} → ${escV13(a.due)}</p></div><button class="btn primary" onclick="viewFacultyAssessment('assignment',${itemId(a)})">View</button></div><p>${escV13(a.description)}</p></div>`).join(''):'<div class="empty">No assignments published.</div>')+`<div class="actions" style="margin-top:12px"><button class="btn secondary" onclick="showAssessmentHistory('assignment')">History</button></div>`;
  };
  window.showAssessmentHistory=async function(type){
    let data=type==='test'?db.tests:db.assignments; try{const r=await api()(`/academics/${type==='test'?'tests':'assignments'}/history`);if(Array.isArray(r))data=r.map(v=>({...v,id:Number(v.id),__backendId:Number(v.id),title:v.title,subject:v.subject,className:v.class_name,due:type==='test'?v.due_date:v.due_date,description:v.description}));}catch(e){}
    openOverlay(`<h2>${type==='test'?'Test':'Assignment'} History</h2><p>Older records remain stored in the database.</p><div class="table-wrap"><table><thead><tr><th>Title</th><th>Subject</th><th>Class</th><th>Due</th><th>Action</th></tr></thead><tbody>${data.map(x=>`<tr><td>${escV13(x.title)}</td><td>${escV13(x.subject)}</td><td>${escV13(x.className||x.class_name)}</td><td>${escV13(x.due||x.due_date)}</td><td><button class="btn secondary" onclick="viewFacultyAssessment('${type}',${itemId(x)})">View</button></td></tr>`).join('')||'<tr><td colspan="5">No history.</td></tr>'}</tbody></table></div>`);
  };

  async function renderAttendanceV13(){
    if(currentUser?.role!=='faculty'&&currentUser?.role!=='hod')return;
    const page=document.getElementById('faculty-attendance'); if(!page||!api())return;
    try{
      const d=await api()('/faculty/attendance-summary');
      const by={};
      (d.students||[]).forEach(s=>{const k=s.class_name||'Unassigned';if(!by[k])by[k]=[];by[k].push(s);});
      const classHtml=(d.classes||[]).map(c=>{
        const studentsHtml=(by[c.name]||[]).map(s=>`<tr><td>${escV13(s.name)}</td><td>${escV13(s.student_id)}</td><td><b>${Number(s.attendance_percentage||0).toFixed(2)}%</b></td><td><button class="btn primary" onclick="viewStudentAttendanceV13(${s.id})">View</button></td></tr>`).join('');
        return `<div class="card" style="margin-top:12px"><h3>${escV13(c.name)}</h3><p>Adviser: ${escV13(c.class_adviser_name||'—')} • Year: ${escV13(c.batch||'—')} • Semester: ${escV13(c.semester||'—')} • Section: ${escV13(c.section||'—')}</p><div class="table-wrap"><table><thead><tr><th>Student</th><th>ID</th><th>Attendance %</th><th>Action</th></tr></thead><tbody>${studentsHtml||'<tr><td colspan="4">No students assigned.</td></tr>'}</tbody></table></div></div>`;
      }).join('');
      let box=document.getElementById('v13AttendanceOverview');
      if(!box){box=document.createElement('div');box.id='v13AttendanceOverview';box.className='card';page.appendChild(box);}
      box.innerHTML=`<div class="card-head"><div><h3>Handled Classes & Student Attendance</h3><p>Existing attendance marking remains above. This section adds class-wise percentages and daily View access.</p></div></div>${classHtml||'<div class="empty">No handled classes found.</div>'}`;
    }catch(err){console.warn('V13 attendance',err);}
  }
  window.viewStudentAttendanceV13=async function(id){try{const rows=await api()(`/attendance/${id}`);openOverlay(`<h2>Daily Attendance</h2><div class="table-wrap"><table><thead><tr><th>Date</th><th>Subject</th><th>Status</th></tr></thead><tbody>${(rows||[]).map(r=>`<tr><td>${escV13(r.date)}</td><td>${escV13(r.subject)}</td><td>${escV13(r.status)}</td></tr>`).join('')||'<tr><td colspan="3">No daily attendance records.</td></tr>'}</tbody></table></div>`);}catch(e){toast(e.message||'Unable to load attendance.');}};

  window.renderFacultyLeaves=function(){
    const e=document.getElementById('facultyLeaves');if(!e)return;const pending=(db.leaves||[]).filter(l=>String(l.status).toLowerCase()==='pending');
    e.innerHTML=`<div class="actions" style="margin-bottom:12px"><button class="btn secondary" onclick="showAllLeaveRequestsV13()">All Requests</button></div>`+(pending.map(l=>`<div class="card"><div class="item-top"><div><h3>${escV13(l.studentName)}</h3><p>${escV13(l.type)} • ${escV13(l.from)} → ${escV13(l.to)}</p></div><span class="badge yellow">Pending</span></div><p>${escV13(l.reason)}</p><div class="actions"><button class="btn success" onclick="reviewLeave(${Number(l.id)},'Approved')">Accept</button><button class="btn danger" onclick="reviewLeave(${Number(l.id)},'Rejected')">Decline</button></div></div>`).join('')||'<div class="card empty">No pending leave requests.</div>');
  };
  window.reviewLeave=async function(id,status){
    const l=db.leaves.find(x=>Number(x.id)===Number(id));if(!l){toast('Leave request not found.');return;}l.status=status;l.reviewedBy=currentUser.name;l.reviewedAt=new Date().toLocaleString();
    try{await api()(`/leaves/${id}`,{method:'PUT',body:JSON.stringify({status:status==='Approved'?'approved':'declined',review_note:`Reviewed by ${currentUser.name}`})});}catch(e){console.warn(e);}
    addNotice(status==='Approved'?'Leave approved':'Leave rejected',`${l.type} from ${l.from} to ${l.to} has been ${status.toLowerCase()} by ${currentUser.name}.`,l.studentId); save();renderFacultyLeaves();toast(status==='Approved'?'Student notified.':'Student notified.');
  };
  window.showAllLeaveRequestsV13=async function(){
    let rows=[];try{rows=await api()('/leaves/all');}catch(e){rows=(db.leaves||[]).map(l=>({...l,register_no:l.studentId}));}
    openOverlay(`<h2>All Leave Requests</h2><div class="v13-filters"><input id="v13LeaveStudent" class="control" placeholder="Student name"><select id="v13LeaveStatus" class="control"><option value="all">All Status</option><option value="approved">Accepted</option><option value="declined">Declined</option><option value="pending">Pending</option></select><input id="v13LeaveDate" type="date" class="control"><input id="v13LeaveMonth" type="month" class="control"><button class="btn primary" onclick="filterLeavesV13()">Filter</button></div><div id="v13LeaveTable"></div>`); window.__v13LeaveRows=rows; renderLeaveTableV13(rows);
  };
  function renderLeaveTableV13(rows){const e=document.getElementById('v13LeaveTable');if(!e)return;e.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Student</th><th>Type</th><th>From</th><th>To</th><th>Status</th><th>Reviewed</th></tr></thead><tbody>${rows.map(l=>`<tr><td>${escV13(l.student_name||l.studentName)}</td><td>${escV13(l.leave_type||l.type)}</td><td>${escV13(l.from_date||l.from)}</td><td>${escV13(l.to_date||l.to)}</td><td>${escV13(l.status)}</td><td>${escV13(l.reviewed_by_name||l.reviewedBy||'—')}</td></tr>`).join('')||'<tr><td colspan="6">No requests match the filters.</td></tr>'}</tbody></table></div>`;}
  window.filterLeavesV13=function(){const all=window.__v13LeaveRows||[];const n=(document.getElementById('v13LeaveStudent')?.value||'').toLowerCase(),s=(document.getElementById('v13LeaveStatus')?.value||'all').toLowerCase(),d=document.getElementById('v13LeaveDate')?.value||'',m=document.getElementById('v13LeaveMonth')?.value||'';renderLeaveTableV13(all.filter(l=>(!n||String(l.student_name||l.studentName).toLowerCase().includes(n))&&(s==='all'||String(l.status).toLowerCase()===s)&&(!d||((l.from_date||l.from)<=d&&(l.to_date||l.to)>=d))&&(!m||String(l.from_date||l.from).slice(0,7)===m||String(l.to_date||l.to).slice(0,7)===m)));};

  async function classDetailsV13(){
    if(currentUser?.role!=='student'||!api())return;try{const d=await api()('/student/class-details');const page=document.getElementById('student-timetable');if(!page)return;const info=page.querySelector('#eduClassInfo');if(info){info.innerHTML=`<div class="card-head"><div><h3>🏫 Class Information</h3></div></div><div class="grid3"><div class="item"><b>Class</b><p>${escV13(d.class_name||d.batch)}</p></div><div class="item"><b>Year / Batch</b><p>${escV13(d.class_batch||d.batch)}</p></div><div class="item"><b>Class Adviser</b><p>${escV13(d.class_adviser_name||'—')}</p></div><div class="item"><b>Mentor</b><p>${escV13(d.mentor_name||'—')}</p></div><div class="item"><b>HOD</b><p>${escV13(d.hod_name||'—')}</p></div><div class="item"><b>Department</b><p>${escV13(d.department||'—')}</p></div></div>`;}const t=document.getElementById('studentTimetable');if(t){
      const rows=Array.isArray(d.timetable)?d.timetable:[];
      const defaultTimes={1:'09:00 AM - 09:50 AM',2:'09:50 AM - 10:40 AM',3:'10:55 AM - 11:45 AM',4:'11:45 AM - 12:35 PM',5:'01:30 PM - 02:20 PM',6:'02:20 PM - 03:10 PM'};
      const periodTimes={};
      rows.forEach(r=>{const p=String(r.period||''); if(p && (r.start_time||r.end_time)) periodTimes[p]=`${r.start_time||''}${r.end_time?' - '+r.end_time:''}`;});
      const periods=['1','2','3','4','5','6'];
      const baseDays=['Monday','Tuesday','Wednesday','Thursday','Friday'];
      const hasSaturday=rows.some(r=>String(r.day||'').toLowerCase()==='saturday');
      const days=hasSaturday?[...baseDays,'Saturday']:baseDays;
      const findRow=(day,p)=>rows.find(r=>String(r.day||'').toLowerCase()===day.toLowerCase() && String(r.period||'')===p);
      const cell=(day,p)=>{const r=findRow(day,p);if(!r)return '<span class="v13-tt-empty">—</span>';const subject=escV13(r.subject||'—');const faculty=escV13(r.faculty_name||r.faculty||'—');const room=r.room?`<span class="v13-tt-room">${escV13(r.room)}</span>`:'';return `<div class="v13-tt-subject">${subject}</div><div class="v13-tt-faculty">${faculty}</div>${room}`;};
      const header=periods.map(p=>`<th class="v13-tt-period"><div>PERIOD ${p}</div><small>${escV13(periodTimes[p]||defaultTimes[p])}</small></th>`).join('');
      t.innerHTML=`<div class="v13-timetable-wrap"><table class="v13-student-timetable"><thead><tr><th class="v13-tt-day">DAY</th>${header}</tr></thead><tbody>${days.map(day=>`<tr><th class="v13-tt-day-name">${escV13(day.toUpperCase())}</th>${periods.map(p=>`<td>${cell(day,p)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="v13-tt-note">Subject faculty is shown inside each period. The timetable shows 5 days × 6 periods. Scroll horizontally on smaller screens if needed.</div>`;
    }}catch(e){console.warn('V13 class details',e);}}

  const oldRefresh=window.refreshAll;window.refreshAll=function(){if(oldRefresh)oldRefresh();setTimeout(()=>{renderAttendanceV13();classDetailsV13();},250);};
  document.addEventListener('click',e=>{const b=e.target.closest('[onclick*="takeTest"]');if(b&&currentUser?.role==='student'){const m=b.getAttribute('onclick').match(/takeTest\((\d+)\)/);if(m&&api())api()(`/academics/tests/${m[1]}/view`,{method:'POST'}).catch(()=>{});}});
  setTimeout(()=>{if(currentUser){renderAttendanceV13();classDetailsV13();}},500);
})();
