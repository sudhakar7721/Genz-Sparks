/* =========================================================
   EDUNEXA V2 UPDATES
   Adds requested features without removing existing modules.
========================================================= */
(function(){
"use strict";

function v2ClassOfUser(u){
  return u?.className || u?.class || u?.classesHandled?.[0] || "II B.Sc Data Analytics";
}
function v2Classes(){
  const set=new Set(["I B.Sc Data Analytics","II B.Sc Data Analytics","III B.Sc Data Analytics"]);
  (db.users||[]).forEach(u=>{ if(u.className)set.add(u.className); (u.classesHandled||[]).forEach(c=>set.add(c)); });
  return [...set];
}
function v2Table(headers, rows){
  return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.join("")||`<tr><td colspan="${headers.length}">No records found.</td></tr>`}</tbody></table></div>`;
}
function v2View(title, html){ openModal(title, html); }

/* Ensure new data structures exist on old localStorage databases */
db.classLeaveRequests = Array.isArray(db.classLeaveRequests)?db.classLeaveRequests:[];
db.achievements = Array.isArray(db.achievements)?db.achievements:[];
db.departmentFeedbackAnalytics = Array.isArray(db.departmentFeedbackAnalytics)?db.departmentFeedbackAnalytics:[];

/* ---------- Student timetable: guaranteed table format ---------- */
function renderV2StudentTimetable(){
 const el=document.getElementById("studentTimetable"); if(!el)return;
 const cls=v2ClassOfUser(currentUser);
 let rows=(db.classTimetables||[]).filter(x=>!x.className||x.className===cls);
 if(!rows.length){
   rows=[
    {day:"Monday",period:"1",time:"09:00–10:00",subject:"Python",faculty:"Dr. Priya"},
    {day:"Monday",period:"2",time:"10:00–11:00",subject:"SQL",faculty:"Dr. Priya"},
    {day:"Tuesday",period:"1",time:"09:00–10:00",subject:"Statistics",faculty:"Faculty"},
    {day:"Wednesday",period:"2",time:"10:00–11:00",subject:"Power BI",faculty:"Faculty"},
    {day:"Thursday",period:"1",time:"09:00–10:00",subject:"Excel",faculty:"Faculty"},
    {day:"Friday",period:"2",time:"10:00–11:00",subject:"Data Analytics",faculty:"Faculty"}
   ];
 }
 el.innerHTML=v2Table(["Day","Period","Time","Subject","Faculty"],rows.map(x=>`<tr><td>${esc(x.day||"")}</td><td>${esc(x.period||"")}</td><td>${esc(x.time||x.slot||"")}</td><td>${esc(x.subject||"")}</td><td>${esc(x.faculty||x.facultyName||"")}</td></tr>`));
}

/* ---------- Faculty timetable and adviser class timetable ---------- */
function renderV2FacultyTimetable(){
 const el=document.getElementById("facultyV2Timetable"); if(!el)return;
 let rows=(db.facultyTimetables||[]).filter(x=>!x.faculty||x.faculty===currentUser.name||x.facultyId===currentUser.facultyId);
 if(!rows.length) rows=[{day:"Monday",period:"1",time:"09:00–10:00",className:v2ClassOfUser(currentUser),subject:"Python",room:"Lab 1"},
 {day:"Monday",period:"2",time:"10:00–11:00",className:v2ClassOfUser(currentUser),subject:"SQL",room:"Room 204"},
 {day:"Wednesday",period:"1",time:"09:00–10:00",className:v2ClassOfUser(currentUser),subject:"Data Analytics",room:"Room 204"}];
 el.innerHTML=v2Table(["Day","Period","Time","Class","Subject","Room"],rows.map(x=>`<tr><td>${esc(x.day||"")}</td><td>${esc(x.period||"")}</td><td>${esc(x.time||"")}</td><td>${esc(x.className||"")}</td><td>${esc(x.subject||"")}</td><td>${esc(x.room||"")}</td></tr>`));
}
function renderV2AdviserTimetable(){
 const el=document.getElementById("adviserV2Timetable"); if(!el)return;
 const cls=v2ClassOfUser(currentUser);
 let rows=(db.classTimetables||[]).filter(x=>x.className===cls);
 if(!rows.length) rows=(db.facultyTimetables||[]).filter(x=>x.className===cls);
 el.innerHTML=v2Table(["Day","Period","Time","Subject","Faculty","Room"],rows.map(x=>`<tr><td>${esc(x.day||"")}</td><td>${esc(x.period||"")}</td><td>${esc(x.time||"")}</td><td>${esc(x.subject||"")}</td><td>${esc(x.faculty||x.facultyName||"")}</td><td>${esc(x.room||"")}</td></tr>`));
}

/* ---------- Adviser owns leave workflow; faculty leave menu removed ---------- */
function renderV2AdviserLeaves(){
 const el=document.getElementById("adviserLeaveV2"); if(!el)return;
 const cls=v2ClassOfUser(currentUser);
 const rows=db.classLeaveRequests.filter(r=>r.className===cls || !r.className);
 el.innerHTML=rows.length?v2Table(["Student","Date","Type","Period","Hours","Reason","Status","Action"],
 rows.map(r=>`<tr><td>${esc(r.studentName||"")}</td><td>${esc(r.date||"")}</td><td>${esc(r.type||"")}</td><td>${esc(r.period||"")}</td><td>${esc(r.hours??"")}</td><td>${esc(r.reason||"")}</td><td>${esc(r.status||"Pending")}</td><td>${r.status==="Pending"?`<button class="btn success" onclick="v2LeaveDecision('${escAttr(r.id)}','Approved')">Approve</button> <button class="btn secondary" onclick="v2LeaveDecision('${escAttr(r.id)}','Rejected')">Decline</button>`:`<button class="btn secondary" onclick="v2View('Leave Request',\`${escAttr(JSON.stringify(r))}\`)">View</button>`}</td></tr>`)).join(""):`<div class="empty">No class leave requests.</div>`;
}
window.v2LeaveDecision=function(id,status){
 const r=db.classLeaveRequests.find(x=>String(x.id)===String(id)); if(!r)return;
 r.status=status;r.reviewedBy=currentUser.name;r.reviewedAt=new Date().toLocaleString();save();renderV2AdviserLeaves();toast(`Leave ${status.toLowerCase()}.`);
};

/* ---------- View option for all feedback / committee feedback ---------- */
window.v2ViewFeedback=function(id){
 const f=db.feedbacks.find(x=>String(x.id)===String(id)); if(!f)return;
 v2View(`Feedback ${f.id}`,`<div class="item"><p><b>Student:</b> ${esc(f.studentName||"")} (${esc(f.studentId||"")})</p><p><b>Department:</b> ${esc(f.department||"")}</p><p><b>Type:</b> ${esc(f.typeLabel||f.type||"")}</p><p><b>Subject:</b> ${esc(f.subject||"")}</p><p><b>Rating:</b> ${esc(f.rating||"")}/5</p><p><b>Status:</b> ${esc(f.status||"")}</p><p><b>Feedback:</b> ${esc(f.message||"")}</p><p><b>Response:</b> ${esc(f.adviserResponse||"Not yet responded")}</p><p><b>Created:</b> ${esc(f.createdAt||"")}</p></div>`);
};
function v2FeedbackViewButton(f){return `<button class="btn secondary" onclick="v2ViewFeedback('${escAttr(f.id)}')">👁 View</button>`}

/* ---------- HOD: department achievements, class/student/marks/placement/faculty, analytics ---------- */
function renderV2HOD(){
 if(currentUser?.role!=="hod")return;
 const dep=currentUser.department||"Data Analytics";
 const students=db.users.filter(u=>u.role==="student"&&(!u.department||u.department===dep));
 const faculty=db.users.filter(u=>u.role==="faculty"&&(!u.department||u.department===dep));
 const markRows=db.marks.filter(m=>students.some(s=>s.studentId===m.studentId));
 const placed=students.filter(s=>s.placementStatus==="Placed"||s.placed===true);
 const el=document.getElementById("hodV2Dashboard"); if(el)el.innerHTML=`
 <div class="stats">${stat("Students",students.length,"Department students")}${stat("Faculty",faculty.length,"Department faculty")}${stat("Placed",placed.length,"Placement records")}${stat("Feedback",db.feedbacks.filter(f=>f.department===dep).length,"Department feedback")}</div>
 <div class="grid3"><div class="card"><h3>🏆 Overall Department Achievements</h3><p>Placements: ${placed.length} • Feedback average: ${v2Avg(dep)}/5 • Active faculty: ${faculty.length}</p><p>${esc((db.achievements.find(a=>a.department===dep)||{}).text||"Academic achievements, competitions, certifications and placement milestones can be maintained here.")}</p></div>
 <div class="card"><h3>🏫 Class Details</h3><p>${[...new Set(students.map(v2ClassOfUser))].join(", ")||"No class data"}</p><button class="btn primary" onclick="go('hod-class-details')">View Classes</button></div>
 <div class="card"><h3>🎯 Marks & Placement</h3><p>${markRows.length} mark records • ${placed.length} placed students</p><button class="btn primary" onclick="go('hod-students')">View Student Details</button></div></div>`;
 const fl=document.getElementById("hodV2Faculty"); if(fl)fl.innerHTML=v2Table(["Faculty","Class Adviser","Subjects","Qualification","Experience","Other Details"],faculty.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.classAdviser?"Yes":"No")}</td><td>${esc([...(u.basicSubjects||[]),...(u.extraSubjects||[])].join(", ")||"—")}</td><td>${esc(u.qualification||"—")}</td><td>${esc(u.experience||"—")}</td><td><button class="btn secondary" onclick="v2View('Faculty Details',\`${escAttr(JSON.stringify(u))}\`)">👁 View</button></td></tr>`));
 const st=document.getElementById("hodV2Students"); if(st)st.innerHTML=v2Table(["Student","Class","Marks","Placement","Details"],students.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(v2ClassOfUser(u))}</td><td>${db.marks.filter(m=>m.studentId===u.studentId).length}</td><td>${esc(u.placementStatus||"Not updated")}</td><td><button class="btn secondary" onclick="v2View('Student Details',\`${escAttr(JSON.stringify(u))}\`)">👁 View</button></td></tr>`));
 const fb=document.getElementById("hodV2Feedback"); if(fb){
  const arr=db.feedbacks.filter(f=>f.department===dep);
  fb.innerHTML=`<div class="stats">${stat("Total",arr.length,"Feedback")}${stat("Average",v2Avg(dep)+"/5","Rating")}${stat("Positive",arr.filter(f=>Number(f.rating)>=4).length,"Rating ≥ 4")}</div>`+v2Table(["ID","Student","Type","Rating","Status","View"],arr.map(f=>`<tr><td>${esc(f.id)}</td><td>${esc(f.studentName)}</td><td>${esc(f.typeLabel||f.type)}</td><td>${esc(f.rating)}/5</td><td>${esc(f.status)}</td><td>${v2FeedbackViewButton(f)}</td></tr>`));
 }
}
function v2Avg(dep){const a=db.feedbacks.filter(f=>f.department===dep&&Number(f.rating)>0);return a.length?(a.reduce((s,f)=>s+Number(f.rating),0)/a.length).toFixed(2):"0.00";}

/* ---------- Dashboards/marks: add all class + department context ---------- */
function v2ContextBanner(){
 const dep=currentUser?.department||"Data Analytics", cls=v2ClassOfUser(currentUser);
 return `<div class="card" style="margin-bottom:15px"><b>Department:</b> ${esc(dep)} &nbsp; • &nbsp; <b>Class:</b> ${esc(cls)} &nbsp; • &nbsp; <b>All Classes:</b> ${v2Classes().join(" | ")}</div>`;
}

/* ---------- Management: view HOD + department details and department feedback analytics ---------- */
function renderV2Management(){
 if(currentUser?.role!=="management")return;
 const h=document.getElementById("managementV2Hod"); if(h){
  const hs=db.users.filter(u=>u.role==="hod");
  h.innerHTML=v2Table(["HOD","Department","Designation","Contact","View"],hs.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.department||"")}</td><td>${esc(u.designation||"Head of Department")}</td><td>${esc(u.phone||"—")}</td><td><button class="btn secondary" onclick="v2View('HOD Details',\`${escAttr(JSON.stringify(u))}\`)">👁 View</button></td></tr>`));
 }
 const d=document.getElementById("managementV2Departments"); if(d){
  const deps=[...new Set((db.users||[]).map(u=>u.department).filter(Boolean))];
  d.innerHTML=v2Table(["Department","Students","Faculty","HOD","Feedback","Avg Rating","View"],deps.map(dep=>{let fs=db.feedbacks.filter(f=>f.department===dep);return `<tr><td>${esc(dep)}</td><td>${db.users.filter(u=>u.role==="student"&&u.department===dep).length}</td><td>${db.users.filter(u=>u.role==="faculty"&&u.department===dep).length}</td><td>${db.users.filter(u=>u.role==="hod"&&u.department===dep).length}</td><td>${fs.length}</td><td>${v2Avg(dep)}/5</td><td><button class="btn secondary" onclick="v2View('Department Details',\`${escAttr(JSON.stringify({department:dep,feedbackCount:fs.length,average:v2Avg(dep)}))}\`)">👁 View</button></td></tr>`}).join(""));
 }
}

/* ---------- Dynamic pages ---------- */
window.v2EnhancementPages=function(){
 return `
 <div class="page" id="faculty-timetable-v2"><div class="page-title"><h1>Faculty Timetable 📅</h1><p>Your teaching timetable in table format.</p></div><div class="card"><div id="facultyV2Timetable"></div></div></div>
 <div class="page" id="adviser-leaves"><div class="page-title"><h1>Class Adviser Leave Console 🗓️</h1><p>Leave requests for your class are managed here.</p></div><div class="card"><div id="adviserLeaveV2"></div></div></div>
 <div class="page" id="adviser-timetable-v2"><div class="page-title"><h1>Class Timetable 🕐</h1><p>Your class timetable in table format.</p></div><div class="card"><div id="adviserV2Timetable"></div></div></div>
 <div class="page" id="hod-v2-dashboard"><div class="page-title"><h1>HOD Department Console 🏛️</h1><p>Achievements, class, student, marks, placement, faculty and feedback controls.</p></div><div id="hodV2Dashboard"></div></div>
 <div class="page" id="hod-v2-faculty"><div class="page-title"><h1>HOD Full Faculty Details 👨‍🏫</h1></div><div class="card"><div id="hodV2Faculty"></div></div></div>
 <div class="page" id="hod-v2-students"><div class="page-title"><h1>HOD Class / Student / Marks / Placement Details 🏫</h1></div><div class="card"><div id="hodV2Students"></div></div></div>
 <div class="page" id="hod-v2-feedback"><div class="page-title"><h1>HOD Feedback View & Analytics 💬</h1></div><div class="card"><div id="hodV2Feedback"></div></div></div>
 <div class="page" id="management-v2-hod"><div class="page-title"><h1>HOD Details — View</h1></div><div class="card"><div id="managementV2Hod"></div></div></div>
 <div class="page" id="management-v2-departments"><div class="page-title"><h1>Department Details — View & Feedback Analytics</h1></div><div class="card"><div id="managementV2Departments"></div></div></div>
 `;
};

/* Patch navigation without destroying original options */
const oldBuildNav=window.buildNav;
window.buildNav=function(){
 oldBuildNav();
 const nav=document.getElementById("nav"); if(!nav)return;
 if(currentUser.role==="faculty"){
   const adviser=currentUser.classAdviser;
   const add=(id,icon,label,section="Class Adviser")=>{
    if(!document.querySelector(`.nav[data-page="${id}"]`)){
      const sec=document.createElement("div"); sec.className="menu-title";sec.textContent=section;
      const btn=document.createElement("button");btn.className="nav";btn.dataset.page=id;btn.innerHTML=`<span>${icon}</span><b>${label}</b>`;btn.onclick=()=>go(id);
      nav.append(sec,btn);
    }
   };
   add("faculty-timetable-v2","📅","Faculty Timetable","Faculty");
   if(adviser){add("adviser-leaves","🗓️","Class Leave Requests");add("adviser-timetable-v2","🕐","Class Timetable");}
 }
 if(currentUser.role==="hod"){
   addHodNav(nav);
 }
 if(currentUser.role==="management"){
   const sec=document.createElement("div");sec.className="menu-title";sec.textContent="Management Views";
   [["management-v2-hod","🏛️","HOD Details — View"],["management-v2-departments","🏫","Department Details & Feedback"]].forEach(x=>{let b=document.createElement("button");b.className="nav";b.dataset.page=x[0];b.innerHTML=`<span>${x[1]}</span><b>${x[2]}</b>`;b.onclick=()=>go(x[0]);sec.appendChild(b)});nav.appendChild(sec);
 }
};
function addHodNav(nav){
 const sec=document.createElement("div");sec.className="menu-title";sec.textContent="HOD Department Console";
 [["hod-v2-dashboard","🏛️","Overall Achievements"],["hod-v2-students","🏫","Class / Student / Marks / Placement"],["hod-v2-faculty","👨‍🏫","Full Faculty Details"],["hod-v2-feedback","💬","Feedback & Analytics"]].forEach(x=>{let b=document.createElement("button");b.className="nav";b.dataset.page=x[0];b.innerHTML=`<span>${x[1]}</span><b>${x[2]}</b>`;b.onclick=()=>go(x[0]);sec.appendChild(b)});nav.appendChild(sec);
}

/* Add dynamic pages to existing renderer */
const oldRenderPages=window.renderPages;
window.renderPages=function(){
 oldRenderPages();
 const p=document.getElementById("pages"); if(p&&window.v2EnhancementPages)p.insertAdjacentHTML("beforeend",v2EnhancementPages());
};

/* Extend go to render V2 pages while preserving original go */
const oldGo=window.go;
window.go=function(id){
 oldGo(id);
 if(id==="student-timetable")renderV2StudentTimetable();
 if(id==="faculty-timetable-v2")renderV2FacultyTimetable();
 if(id==="adviser-timetable-v2")renderV2AdviserTimetable();
 if(id==="adviser-leaves")renderV2AdviserLeaves();
 if(id==="hod-v2-dashboard"||id==="hod-v2-students"||id==="hod-v2-faculty"||id==="hod-v2-feedback")renderV2HOD();
 if(id==="management-v2-hod"||id==="management-v2-departments")renderV2Management();
};

/* HOD default now lands on the richer console */
const oldDefault=window.defaultPage;
window.defaultPage=function(){return currentUser?.role==="hod"?"hod-v2-dashboard":oldDefault();};

/* Student/Faculty target class visibility: students see only their class */
const oldRenderFacultyTests=window.renderFacultyTests;
window.renderFacultyTests=function(){
 if(typeof oldRenderFacultyTests==="function")oldRenderFacultyTests();
 const el=document.getElementById("facultyTestList");if(!el)return;
 const cls=v2ClassOfUser(currentUser);
 const arr=db.tests.filter(t=>!t.className||t.className===cls||t.faculty===currentUser.name);
 el.innerHTML=arr.length?arr.map(t=>`<div class="item"><b>${esc(t.title)}</b><p>${esc(t.subject)} • Class: ${esc(t.className||"All")} • ${esc(t.start)} → ${esc(t.due)} • ${t.questions?.length||0} questions</p></div>`).join(""):`<div class="empty">No tests published.</div>`;
};

/* Patch assignment list similarly */
const oldRenderFacultyAssignments=window.renderFacultyAssignments;
window.renderFacultyAssignments=function(){
 if(typeof oldRenderFacultyAssignments==="function")oldRenderFacultyAssignments();
 const el=document.getElementById("facultyAssignmentList");if(!el)return;
 const cls=v2ClassOfUser(currentUser);
 const arr=db.assignments.filter(t=>!t.className||t.className===cls||t.faculty===currentUser.name);
 el.innerHTML=arr.length?arr.map(t=>`<div class="item"><b>${esc(t.title)}</b><p>${esc(t.subject)} • Class: ${esc(t.className||"All")} • ${esc(t.assigned)} → ${esc(t.due)}</p><p>${esc(t.description||"")}</p></div>`).join(""):`<div class="empty">No assignments published.</div>`;
};

window.addV2ClassLeave=function(event){
 event.preventDefault();
 const cls=v2ClassOfUser(currentUser);
 const r={id:"L-"+Date.now(),studentName:currentUser.name,studentId:currentUser.studentId,className:cls,date:document.getElementById("v2LeaveDate").value,type:document.getElementById("v2LeaveType").value,period:document.getElementById("v2LeavePeriod").value,hours:Number(document.getElementById("v2LeaveHours").value||0),reason:document.getElementById("v2LeaveReason").value,status:"Pending",createdAt:new Date().toLocaleString()};
 db.classLeaveRequests.push(r);save();toast("Leave request sent to Class Adviser.");event.target.reset();
};

/* Add a student-side class leave request form without touching the existing leave module */
const oldRenderPages2=window.renderPages;
window.renderPages=function(){
 oldRenderPages2();
 if(currentUser?.role==="faculty"){
   const oldLeave=document.getElementById("faculty-leaves");
   if(oldLeave) oldLeave.remove();
 }
 if(currentUser?.role==="student"){
  const p=document.getElementById("pages");
  p.insertAdjacentHTML("beforeend",`<div class="page" id="student-class-leave-v2"><div class="page-title"><h1>Class Leave Request</h1><p>Submit a leave request to your Class Adviser.</p></div><div class="card"><form onsubmit="addV2ClassLeave(event)"><div class="form-grid"><div class="form-group"><label>Date</label><input id="v2LeaveDate" type="date" class="control" required></div><div class="form-group"><label>Leave Type</label><select id="v2LeaveType" class="control"><option>Full Day</option><option>Half Day</option><option>Permission</option></select></div><div class="form-group"><label>Period</label><input id="v2LeavePeriod" class="control" placeholder="1–2 or Morning"></div><div class="form-group"><label>Total Hours</label><input id="v2LeaveHours" type="number" min="0.5" max="8" step="0.5" class="control" required></div><div class="form-group full"><label>Reason</label><textarea id="v2LeaveReason" class="control" required></textarea></div><div class="full"><button class="btn primary">Send to Class Adviser</button></div></div></form></div></div>`);
 }
};
})();
