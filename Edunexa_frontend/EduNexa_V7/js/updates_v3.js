/* =========================================================
   EDUNEXA V3 REQUESTED ENHANCEMENTS
   - One unified Student Leave + Class Adviser section
   - Timetables rendered as day x period rows/columns
   - Management HOD Information CRUD
   - Management Department Details CRUD + feedback analytics
   - Removes the old "Management Views" navigation
   - Preserves all existing modules/data
========================================================= */
(function(){
"use strict";

function v3ClassOf(u){
  return u?.className || u?.class || u?.classesHandled?.[0] || "II B.Sc Data Analytics";
}
function v3Periods(){
  return ["1","2","3","4","5","6"];
}
function v3Days(){
  return ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
}
function v3Cell(rows, day, period, extra){
  const r=(rows||[]).find(x=>String(x.day||"").toLowerCase()===day.toLowerCase() && String(x.period||"")===String(period));
  if(!r) return "—";
  const bits=[r.subject||"", extra==="faculty"?(r.faculty||r.facultyName||""):extra==="class"?(r.className||""):(r.room||"")].filter(Boolean);
  return bits.length ? bits.map(esc).join("<br><small>")+(bits.length>1?"</small>":"") : "—";
}
function v3Matrix(rows, extra){
  return `<div class="table-wrap"><table class="v3-timetable"><thead><tr><th>Day</th>${v3Periods().map(p=>`<th>Period ${p}</th>`).join("")}</tr></thead><tbody>${
    v3Days().map(day=>`<tr><th>${day}</th>${v3Periods().map(p=>`<td>${v3Cell(rows,day,p,extra)}</td>`).join("")}</tr>`).join("")
  }</tbody></table></div>`;
}
function v3SeedClassRows(cls){
  return [
    {day:"Monday",period:"1",subject:"Python",faculty:"Dr. Priya",room:"Lab 1",className:cls},
    {day:"Monday",period:"2",subject:"SQL",faculty:"Dr. Priya",room:"Room 204",className:cls},
    {day:"Tuesday",period:"1",subject:"Statistics",faculty:"Ms. Kavitha R",room:"Room 105",className:cls},
    {day:"Tuesday",period:"3",subject:"Power BI",faculty:"Dr. Priya",room:"Lab 2",className:cls},
    {day:"Wednesday",period:"2",subject:"Data Analytics",faculty:"Dr. Meena S",room:"Room 201",className:cls},
    {day:"Thursday",period:"1",subject:"Excel",faculty:"Mr. Arun Kumar",room:"Lab 1",className:cls},
    {day:"Friday",period:"2",subject:"Machine Learning",faculty:"Dr. Meena S",room:"Lab 3",className:cls},
    {day:"Saturday",period:"1",subject:"Communication",faculty:"Faculty",room:"Room 101",className:cls}
  ];
}
function v3SeedFacultyRows(u){
  const cls=v3ClassOf(u);
  return [
    {day:"Monday",period:"1",className:cls,subject:"Python",room:"Lab 1",faculty:u.name},
    {day:"Monday",period:"2",className:cls,subject:"SQL",room:"Room 204",faculty:u.name},
    {day:"Tuesday",period:"3",className:cls,subject:"Power BI",room:"Lab 2",faculty:u.name},
    {day:"Wednesday",period:"2",className:cls,subject:"Data Analytics",room:"Room 201",faculty:u.name},
    {day:"Thursday",period:"4",className:"I B.Sc Data Analytics",subject:"Python",room:"Lab 1",faculty:u.name},
    {day:"Friday",period:"2",className:cls,subject:"Machine Learning",room:"Lab 3",faculty:u.name}
  ];
}

/* ---------- Unified student leave ---------- */
window.submitLeave=function(event){
  event.preventDefault();
  const from=document.getElementById("leaveFrom")?.value;
  const to=document.getElementById("leaveTo")?.value || from;
  const type=document.getElementById("leaveType")?.value || "Personal Leave";
  const reason=(document.getElementById("leaveReason")?.value||"").trim();
  const duration=document.getElementById("leaveDuration")?.value || "full";
  const hours=duration==="half" ? Number(document.getElementById("leaveHours")?.value||0) : 6;
  const period=document.getElementById("leavePeriod")?.value || (duration==="half"?"Morning / selected hours":"All periods");

  if(!from || !reason){toast("Please complete the leave form.");return;}
  if(new Date(to)<new Date(from)){toast("To date cannot be before from date.");return;}
  if(duration==="half" && (!Number.isInteger(hours)||hours<1||hours>6)){toast("Half-day leave must be between 1 and 6 hours.");return;}

  db.classLeaveRequests=Array.isArray(db.classLeaveRequests)?db.classLeaveRequests:[];
  const req={
    id:"CL-"+Date.now(),
    studentId:currentUser.studentId,
    studentName:currentUser.name,
    parentName:currentUser.parentName||"",
    parentPhone:currentUser.parentPhone||"",
    department:currentUser.department||"",
    className:v3ClassOf(currentUser),
    type,
    from,to,date:from,
    durationType:duration==="half"?"Half Day":"Full Day",
    hours:duration==="half"?hours:"Full Day",
    period,
    reason,
    status:"Pending",
    createdAt:new Date().toLocaleString()
  };
  db.classLeaveRequests.push(req);
  /* Keep legacy leave history synchronized, without sending a second workflow. */
  db.leaves=Array.isArray(db.leaves)?db.leaves:[];
  db.leaves.push({...req});
  if(typeof addNotice==="function") addNotice("Leave request sent to Class Adviser",`${currentUser.name} submitted a ${req.durationType.toLowerCase()} ${type}.`,"adviser");
  save(); refreshAll();
  event.target.reset();
  toast("Leave request sent to Class Adviser Leave Console 🗓️.");
};

window.renderStudentLeaves=function(){
  const el=document.getElementById("studentLeaves"); if(!el)return;
  const arr=(db.classLeaveRequests||[]).filter(r=>r.studentId===currentUser.studentId);
  el.innerHTML=arr.length ? `<div class="table-wrap"><table><thead><tr><th>ID</th><th>From</th><th>To</th><th>Type</th><th>Duration</th><th>Hours</th><th>Period</th><th>Reason</th><th>Status</th></tr></thead><tbody>${
    arr.slice().reverse().map(r=>`<tr><td>${esc(r.id)}</td><td>${esc(r.from||r.date||"")}</td><td>${esc(r.to||r.date||"")}</td><td>${esc(r.type)}</td><td>${esc(r.durationType||"Full Day")}</td><td>${esc(r.hours??"")}</td><td>${esc(r.period||"—")}</td><td>${esc(r.reason||"")}</td><td><span class="badge ${r.status==="Approved"?"green":r.status==="Rejected"?"red":"yellow"}">${esc(r.status||"Pending")}</span></td></tr>`).join("")
  }</tbody></table></div>` : `<div class="empty">No leave requests yet.</div>`;
};

/* ---------- Student timetable: real row/column matrix ---------- */
window.renderV3StudentTimetable=function(){
  const el=document.getElementById("studentTimetable"); if(!el)return;
  const cls=v3ClassOf(currentUser);
  let rows=(db.classTimetables||[]).filter(x=>!x.className||x.className===cls);
  if(!rows.length) rows=v3SeedClassRows(cls);
  el.innerHTML=v3Matrix(rows,"faculty");
};

/* ---------- Faculty timetable + class timetable: row/column matrix ---------- */
window.renderV3FacultyTimetable=function(){
  const el=document.getElementById("facultyV2Timetable"); if(!el)return;
  let rows=(db.facultyTimetables||[]).filter(x=>!x.facultyId||x.facultyId===currentUser.facultyId||x.faculty===currentUser.name);
  if(!rows.length) rows=v3SeedFacultyRows(currentUser);
  el.innerHTML=v3Matrix(rows,"class");
};
window.renderV3AdviserTimetable=function(){
  const el=document.getElementById("adviserV2Timetable"); if(!el)return;
  const cls=v3ClassOf(currentUser);
  let rows=(db.classTimetables||[]).filter(x=>x.className===cls);
  if(!rows.length) rows=v3SeedClassRows(cls);
  el.innerHTML=v3Matrix(rows,"faculty");
};

/* ---------- Adviser leave console uses the ONE student leave workflow ---------- */
window.renderV3AdviserLeaves=function(){
  const el=document.getElementById("adviserLeaveV2"); if(!el)return;
  const cls=v3ClassOf(currentUser);
  const rows=(db.classLeaveRequests||[]).filter(r=>!r.className||r.className===cls);
  el.innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>Student</th><th>Class</th><th>Date</th><th>Type</th><th>Duration</th><th>Hours</th><th>Period</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead><tbody>${
    rows.slice().reverse().map(r=>`<tr><td>${esc(r.studentName||"")}</td><td>${esc(r.className||"")}</td><td>${esc(r.from||r.date||"")}${r.to&&r.to!==r.from?` → ${esc(r.to)}`:""}</td><td>${esc(r.type||"")}</td><td>${esc(r.durationType||"Full Day")}</td><td>${esc(r.hours??"")}</td><td>${esc(r.period||"—")}</td><td>${esc(r.reason||"")}</td><td><span class="badge ${r.status==="Approved"?"green":r.status==="Rejected"?"red":"yellow"}">${esc(r.status||"Pending")}</span></td><td>${r.status==="Pending"?`<button class="btn success" onclick="v3LeaveDecision('${escAttr(r.id)}','Approved')">Approve</button> <button class="btn secondary" onclick="v3LeaveDecision('${escAttr(r.id)}','Rejected')">Decline</button>`:`<button class="btn secondary" onclick="v2View('Leave Request',\`${escAttr(JSON.stringify(r))}\`)">👁 View</button>`}</td></tr>`).join("")
  }</tbody></table></div>`:`<div class="empty">No class leave requests.</div>`;
};
window.v3LeaveDecision=function(id,status){
  const r=(db.classLeaveRequests||[]).find(x=>String(x.id)===String(id)); if(!r)return;
  r.status=status;r.reviewedBy=currentUser.name;r.reviewedAt=new Date().toLocaleString();
  const legacy=(db.leaves||[]).find(x=>String(x.id)===String(id)||String(x.id)===String(r.id));
  if(legacy){legacy.status=status;legacy.reviewedBy=currentUser.name;legacy.reviewedAt=r.reviewedAt;}
  save();refreshAll();window.renderV3AdviserLeaves();toast(`Leave ${status.toLowerCase()}.`);
};

/* ---------- Management data helpers ---------- */
window.v3EnsureManagementData=function(){
  db.hodDetails=Array.isArray(db.hodDetails)?db.hodDetails:[];
  db.departments=Array.isArray(db.departments)?db.departments:[];
  (db.users||[]).filter(u=>u.role==="hod").forEach(u=>{
    if(!db.hodDetails.some(h=>h.id===u.hodId||h.email===u.email)){
      db.hodDetails.push({id:u.hodId||"HOD-"+Date.now(),name:u.name||"",email:u.email||"",phone:u.phone||"",department:u.department||"",designation:u.designation||"Head of Department",qualification:u.qualification||"",experience:u.experience||"",joiningYear:"",office:"",extraInfo:""});
    }
  });
  const names=new Set(db.departments.map(d=>d.name));
  (db.users||[]).map(u=>u.department).filter(Boolean).forEach(name=>{
    if(!names.has(name)) db.departments.push({id:"DEP-"+Date.now()+"-"+Math.random().toString(36).slice(2,5),name,code:"",hod:"",email:"",phone:"",classes:"",description:"",feedbackNote:""});
  });
  save();
}
function v3Field(id,label,value,type="text",extra=""){
  return `<div class="form-group"><label>${label}</label><input id="${id}" class="control" type="${type}" value="${escAttr(value||"")}" ${extra}></div>`;
}
function v3HodForm(h){
  h=h||{};
  return `<form onsubmit="v3SaveHod(event,'${escAttr(h.id||"")}')"><div class="form-grid">
    ${v3Field("v3HodName","HOD Name",h.name)}
    ${v3Field("v3HodEmail","Email",h.email,"email")}
    ${v3Field("v3HodPhone","Phone",h.phone)}
    ${v3Field("v3HodDepartment","Department",h.department)}
    ${v3Field("v3HodDesignation","Designation",h.designation||"Head of Department")}
    ${v3Field("v3HodQualification","Qualification",h.qualification)}
    ${v3Field("v3HodExperience","Experience",h.experience)}
    ${v3Field("v3HodJoining","Joining Year",h.joiningYear)}
    ${v3Field("v3HodOffice","Office",h.office)}
    <div class="form-group full"><label>Additional Information</label><textarea id="v3HodExtra" class="control" rows="3">${esc(h.extraInfo||"")}</textarea></div>
    <div class="full"><button class="btn primary">${h.id?"Save HOD Changes":"Add New HOD"}</button></div>
  </div></form>`;
}
window.v3SaveHod=function(e,id){
  e.preventDefault();v3EnsureManagementData();
  const data={id:id||"HOD-"+Date.now(),name:document.getElementById("v3HodName").value.trim(),email:document.getElementById("v3HodEmail").value.trim(),phone:document.getElementById("v3HodPhone").value.trim(),department:document.getElementById("v3HodDepartment").value.trim(),designation:document.getElementById("v3HodDesignation").value.trim(),qualification:document.getElementById("v3HodQualification").value.trim(),experience:document.getElementById("v3HodExperience").value.trim(),joiningYear:document.getElementById("v3HodJoining").value.trim(),office:document.getElementById("v3HodOffice").value.trim(),extraInfo:document.getElementById("v3HodExtra").value.trim()};
  if(!data.name||!data.department){toast("HOD name and department are required.");return;}
  const old=db.hodDetails.find(h=>h.id===data.id);
  if(old) Object.assign(old,data); else db.hodDetails.push(data);
  const u=(db.users||[]).find(x=>x.role==="hod"&&(x.hodId===data.id||x.email===data.email));
  if(u) Object.assign(u,{name:data.name,email:data.email,phone:data.phone,department:data.department,designation:data.designation,qualification:data.qualification,experience:data.experience,hodId:data.id});
  else db.users.push({name:data.name,email:data.email,password:"123456",role:"hod",hodId:data.id,department:data.department,designation:data.designation,phone:data.phone,qualification:data.qualification,experience:data.experience});
  save();renderV3ManagementHods();toast(old?"HOD details updated.":"New HOD added.");
  document.getElementById("v3HodFormHost").innerHTML=v3HodForm({});
};
window.v3EditHod=function(id){const h=db.hodDetails.find(x=>x.id===id);if(h){document.getElementById("v3HodFormHost").innerHTML=v3HodForm(h);document.getElementById("v3HodFormHost").scrollIntoView({behavior:"smooth"});}};
window.v3DeleteHod=function(id){if(!confirm("Delete this HOD information record?"))return;db.hodDetails=db.hodDetails.filter(x=>x.id!==id);save();renderV3ManagementHods();toast("HOD information removed.");};
window.renderV3ManagementHods=function(){
  v3EnsureManagementData();const el=document.getElementById("v3HodTable");if(!el)return;
  el.innerHTML=v3Table(["ID","HOD","Department","Designation","Contact","Qualification","Actions"],db.hodDetails.map(h=>`<tr><td>${esc(h.id)}</td><td><b>${esc(h.name)}</b><br><small>${esc(h.email)}</small></td><td>${esc(h.department)}</td><td>${esc(h.designation)}</td><td>${esc(h.phone)}</td><td>${esc(h.qualification||"—")}</td><td><button class="btn secondary" onclick="v3EditHod('${escAttr(h.id)}')">✏ Edit</button> <button class="btn secondary" onclick="v3DeleteHod('${escAttr(h.id)}')">Delete</button></td></tr>`));
}

/* ---------- Department CRUD + feedback analytics ---------- */
function v3DeptForm(d){
 d=d||{};
 return `<form onsubmit="v3SaveDepartment(event,'${escAttr(d.id||"")}')"><div class="form-grid">
 ${v3Field("v3DepName","Department Name",d.name)}
 ${v3Field("v3DepCode","Department Code",d.code)}
 ${v3Field("v3DepHod","HOD",d.hod)}
 ${v3Field("v3DepEmail","Department Email",d.email,"email")}
 ${v3Field("v3DepPhone","Contact Number",d.phone)}
 ${v3Field("v3DepClasses","Classes (comma separated)",d.classes)}
 <div class="form-group full"><label>Description</label><textarea id="v3DepDescription" class="control" rows="3">${esc(d.description||"")}</textarea></div>
 <div class="form-group full"><label>Management / Feedback Notes</label><textarea id="v3DepFeedback" class="control" rows="3">${esc(d.feedbackNote||"")}</textarea></div>
 <div class="full"><button class="btn primary">${d.id?"Save Department Changes":"Add New Department"}</button></div>
 </div></form>`;
}
window.v3SaveDepartment=function(e,id){
 e.preventDefault();v3EnsureManagementData();
 const data={id:id||"DEP-"+Date.now(),name:document.getElementById("v3DepName").value.trim(),code:document.getElementById("v3DepCode").value.trim(),hod:document.getElementById("v3DepHod").value.trim(),email:document.getElementById("v3DepEmail").value.trim(),phone:document.getElementById("v3DepPhone").value.trim(),classes:document.getElementById("v3DepClasses").value.trim(),description:document.getElementById("v3DepDescription").value.trim(),feedbackNote:document.getElementById("v3DepFeedback").value.trim()};
 if(!data.name){toast("Department name is required.");return;}
 const old=db.departments.find(d=>d.id===data.id);
 if(old)Object.assign(old,data);else db.departments.push(data);
 save();renderV3Departments();toast(old?"Department details updated.":"New department added.");
 document.getElementById("v3DeptFormHost").innerHTML=v3DeptForm({});
};
window.v3EditDepartment=function(id){const d=db.departments.find(x=>x.id===id);if(d){document.getElementById("v3DeptFormHost").innerHTML=v3DeptForm(d);document.getElementById("v3DeptFormHost").scrollIntoView({behavior:"smooth"});}};
window.v3DeleteDepartment=function(id){if(!confirm("Delete this department information record?"))return;db.departments=db.departments.filter(x=>x.id!==id);save();renderV3Departments();toast("Department information removed.");};
window.renderV3Departments=function(){
 v3EnsureManagementData();const el=document.getElementById("v3DeptTable");if(!el)return;
 el.innerHTML=v3Table(["Department","Code","HOD","Classes","Students","Faculty","Feedback","Avg Rating","Actions"],db.departments.map(d=>{
   const fs=(db.feedbacks||[]).filter(f=>f.department===d.name);const avg=fs.length?(fs.reduce((s,f)=>s+Number(f.rating||0),0)/fs.length).toFixed(2):"0.00";
   return `<tr><td><b>${esc(d.name)}</b><br><small>${esc(d.description||"")}</small></td><td>${esc(d.code||"—")}</td><td>${esc(d.hod||"—")}</td><td>${esc(d.classes||"—")}</td><td>${db.users.filter(u=>u.role==="student"&&u.department===d.name).length}</td><td>${db.users.filter(u=>u.role==="faculty"&&u.department===d.name).length}</td><td>${fs.length}</td><td>${avg}/5</td><td><button class="btn secondary" onclick="v3EditDepartment('${escAttr(d.id)}')">✏ Edit</button> <button class="btn secondary" onclick="v3ViewDepartmentFeedback('${escAttr(d.name)}')">💬 Feedback</button> <button class="btn secondary" onclick="v3DeleteDepartment('${escAttr(d.id)}')">Delete</button></td></tr>`;
 })).join("");
}
window.v3ViewDepartmentFeedback=function(name){
 const fs=(db.feedbacks||[]).filter(f=>f.department===name);
 const avg=fs.length?(fs.reduce((s,f)=>s+Number(f.rating||0),0)/fs.length).toFixed(2):"0.00";
 v2View(`Department Feedback — ${name}`,`<div class="stats">${stat("Total",fs.length,"Feedback")}${stat("Average",avg+"/5","Rating")}${stat("Positive",fs.filter(f=>Number(f.rating)>=4).length,"Rating ≥ 4")}</div>${v3Table(["ID","Student","Type","Rating","Status","Message"],fs.map(f=>`<tr><td>${esc(f.id)}</td><td>${esc(f.studentName)}</td><td>${esc(f.typeLabel||f.type)}</td><td>${esc(f.rating)}/5</td><td>${esc(f.status||"")}</td><td>${esc(f.message||"")}</td></tr>`))}`);
};

/* ---------- Dynamic management pages ---------- */
window.v3ManagementPages=function(){
 return `
 <div class="page" id="management-hod-details"><div class="page-title"><h1>HOD Information 🏛️</h1><p>View, edit and add new HOD records across departments.</p></div>
   <div class="card"><div class="card-head"><div><h3>Add New HOD</h3><p>Create or maintain HOD information for any department.</p></div></div><div id="v3HodFormHost">${v3HodForm({})}</div></div>
   <div class="card"><div class="card-head"><div><h3>HOD Directory</h3><p>Complete HOD information across departments.</p></div></div><div id="v3HodTable"></div></div>
 </div>
 <div class="page" id="management-department-details"><div class="page-title"><h1>Department Details 🏫</h1><p>View, edit and add departments. Feedback analytics is maintained inside this module.</p></div>
   <div class="card"><div class="card-head"><div><h3>Add New Department</h3><p>Create a department profile and maintain its academic/feedback details.</p></div></div><div id="v3DeptFormHost">${v3DeptForm({})}</div></div>
   <div class="card"><div class="card-head"><div><h3>Department Directory & Feedback</h3><p>Student/faculty counts and department feedback analytics are shown here.</p></div></div><div id="v3DeptTable"></div></div>
 </div>`;
};

/* ---------- Patch navigation ---------- */
const oldBuildNav=window.buildNav;
window.buildNav=function(){
 oldBuildNav();
 const nav=document.getElementById("nav");if(!nav)return;
 /* Student: exactly one Leave section. */
 nav.querySelectorAll('.nav[data-page="student-leave-requests"], .nav[data-page="student-class-leave-v2"]').forEach(x=>x.remove());
 const sbtn=nav.querySelector('.nav[data-page="student-leave"]');
 if(sbtn){const b=sbtn.querySelector("b");if(b)b.textContent="Leave & Class Adviser";}
 /* Remove the old Management Views group. */
 [...nav.querySelectorAll(".menu-title")].forEach(t=>{if(t.textContent.trim()==="Management Views"){let n=t.nextElementSibling;while(n&&n.classList.contains("nav")){const next=n.nextElementSibling;n.remove();n=next;}t.remove();}});
 if(currentUser?.role==="management"){
   const exists=id=>!!nav.querySelector(`.nav[data-page="${id}"]`);
   const mgTitle=[...nav.querySelectorAll(".menu-title")].find(x=>x.textContent.trim()==="Management");
   const anchor=mgTitle?.nextElementSibling;
   const add=(id,icon,label)=>{
     if(exists(id))return;const b=document.createElement("button");b.className="nav";b.dataset.page=id;b.innerHTML=`<span>${icon}</span><b>${label}</b>`;b.onclick=()=>go(id);anchor?.parentNode.insertBefore(b,anchor?.nextSibling||null);
   };
   add("management-hod-details","🏛️","HOD Information");
   add("management-department-details","🏫","Department Details");
 }
};

/* ---------- Patch pages ---------- */
const oldRenderPages=window.renderPages;
window.renderPages=function(){
 oldRenderPages();
 const p=document.getElementById("pages");if(!p)return;
 /* Remove duplicate student leave page injected by V2. */
 document.getElementById("student-class-leave-v2")?.remove();
 /* Add new management pages once. */
 if(!document.getElementById("management-hod-details"))p.insertAdjacentHTML("beforeend",v3ManagementPages());
 /* Upgrade the original student leave form into the single unified workflow. */
 const lp=document.getElementById("student-leave");
 if(lp && !lp.dataset.v3){
   lp.dataset.v3="1";
   const card=lp.querySelector(".card");
   if(card){
     const form=card.querySelector("form");
     if(form){
       const fg=form.querySelector(".form-grid");
       const extra=document.createElement("div");extra.className="form-group";
       extra.innerHTML=`<label>Duration</label><select id="leaveDuration" class="control"><option value="full">Full Day</option><option value="half">Half Day</option></select>`;
       fg.insertBefore(extra,fg.lastElementChild);
       const extra2=document.createElement("div");extra2.className="form-group";
       extra2.innerHTML=`<label>Hours (Half Day: 1–6)</label><input id="leaveHours" type="number" min="1" max="6" step="1" value="6" class="control">`;
       fg.insertBefore(extra2,fg.lastElementChild);
       const extra3=document.createElement("div");extra3.className="form-group";
       extra3.innerHTML=`<label>Period / Hours</label><input id="leavePeriod" class="control" placeholder="e.g. 1–3 / Morning">`;
       fg.insertBefore(extra3,fg.lastElementChild);
       const p=card.querySelector("p");if(p)p.textContent="One leave workflow: submit here and every request is sent directly to the Class Adviser Leave Console 🗓️.";
     }
   }
   const oldHeading=lp.querySelector("h1");if(oldHeading)oldHeading.textContent="Leave & Class Adviser 🗓️";
   const oldReq=lp.querySelector("h3");if(oldReq)oldReq.textContent="My Leave Requests";
 }
};

/* ---------- Patch navigation actions / rendering ---------- */
const oldGo=window.go;
window.go=function(id){
 oldGo(id);
 if(id==="student-timetable")window.renderV3StudentTimetable();
 if(id==="faculty-timetable-v2")window.renderV3FacultyTimetable();
 if(id==="adviser-timetable-v2")window.renderV3AdviserTimetable();
 if(id==="adviser-leaves")window.renderV3AdviserLeaves();
 if(id==="management-hod-details"){v3EnsureManagementData();renderV3ManagementHods();}
 if(id==="management-department-details"){v3EnsureManagementData();renderV3Departments();}
 if(id==="student-leave"){window.renderStudentLeaves();}
};

/* Refresh hooks: preserve existing refresh behavior and update our tables. */
const oldRefreshAll=window.refreshAll;
window.refreshAll=function(){
 if(typeof oldRefreshAll==="function")oldRefreshAll();
 if(currentUser?.role==="student")window.renderStudentLeaves();
 if(currentUser?.role==="faculty"&&currentUser.classAdviser)window.renderV3AdviserLeaves();
 if(currentUser?.role==="management"){v3EnsureManagementData();renderV3ManagementHods();renderV3Departments();}
};
})();

/* =========================================================
   V3 FINAL CONSOLIDATION PATCH
   - One Management HOD module only
   - One Management Department module only
   - One Faculty Class Timetable module only
   - Existing features are preserved
========================================================= */
(function(){
"use strict";

const _renderPages=window.renderPages;
window.renderPages=function(){
  _renderPages();
  const pages=document.getElementById("pages");
  if(!pages)return;

  /* Remove obsolete duplicate Management Views pages created by V2. */
  ["management-v2-hod","management-v2-departments"].forEach(id=>document.getElementById(id)?.remove());

  /* Keep exactly ONE HOD module: management-hod. */
  const hodNew=document.getElementById("management-hod-details");
  const hodOld=document.getElementById("management-hod");
  if(hodNew){
    hodOld?.remove();
    hodNew.id="management-hod";
  }

  /* Keep exactly ONE Department module: management-departments. */
  const depNew=document.getElementById("management-department-details");
  const depOld=document.getElementById("management-departments");
  if(depNew){
    depOld?.remove();
    depNew.id="management-departments";
  }

  /* Remove the duplicate Faculty Class Timetable page. */
  document.getElementById("adviser-timetable-v2")?.remove();

  /* Upgrade the original Class Adviser timetable page to the matrix view. */
  const adviserPage=document.getElementById("adviser-timetable");
  if(adviserPage){
    const title=adviserPage.querySelector("h1");
    const desc=adviserPage.querySelector(".page-title p");
    if(title)title.textContent="Class Timetable 🕐";
    if(desc)desc.textContent="Enter periods below and view the complete class timetable in rows and columns.";
    const list=document.getElementById("adviserTimetableList");
    if(list && !document.getElementById("adviserV2Timetable")){
      list.id="adviserV2Timetable";
    }
  }
};

const _buildNav=window.buildNav;
window.buildNav=function(){
  _buildNav();
  const nav=document.getElementById("nav");
  if(!nav)return;

  /* Remove all obsolete Management Views / duplicate management entries. */
  [...nav.querySelectorAll(".menu-title")].forEach(t=>{
    if(t.textContent.trim()==="Management Views"){
      let n=t.nextElementSibling;
      while(n && n.classList.contains("nav")){const next=n.nextElementSibling;n.remove();n=next;}
      t.remove();
    }
  });
  nav.querySelectorAll('.nav[data-page="management-hod-details"], .nav[data-page="management-department-details"], .nav[data-page="management-v2-hod"], .nav[data-page="management-v2-departments"]').forEach(x=>x.remove());

  /* Management uses the original single menu entries, now backed by the consolidated modules. */
  if(currentUser?.role==="management"){
    const hod=nav.querySelector('.nav[data-page="management-hod"]');
    const dep=nav.querySelector('.nav[data-page="management-departments"]');
    if(hod){hod.querySelector("b")?.replaceChildren(document.createTextNode("HOD Information"));}
    if(dep){dep.querySelector("b")?.replaceChildren(document.createTextNode("Department Details"));}
  }

  /* Faculty: retain ONE Class Timetable only. */
  nav.querySelectorAll('.nav[data-page="adviser-timetable-v2"]').forEach(x=>x.remove());
  if(currentUser?.role==="faculty"){
    const old=nav.querySelector('.nav[data-page="adviser-timetable"]');
    if(old){
      const b=old.querySelector("b");
      if(b)b.textContent="Class Timetable";
    }
  }
};

const _go=window.go;
window.go=function(id){
  _go(id);
  if(id==="adviser-timetable"){
    if(typeof window.renderV3AdviserTimetable==="function")window.renderV3AdviserTimetable();
  }
  if(id==="faculty-timetable-v2"){
    if(typeof window.renderV3FacultyTimetable==="function")window.renderV3FacultyTimetable();
  }
  if(id==="management-hod"){
    if(typeof window.v3EnsureManagementDataForUI==="function")window.v3EnsureManagementDataForUI();
    if(typeof window.renderV3ManagementHodsForUI==="function")window.renderV3ManagementHodsForUI();
  }
};

/* Redirect the old duplicate Class Timetable page if any legacy code opens it. */
window.renderV3AdviserTimetable=function(){
  const el=document.getElementById("adviserV2Timetable") || document.getElementById("adviserTimetableList");
  if(!el || !window.currentUser && typeof currentUser==="undefined")return;
  const u=window.currentUser || currentUser;
  const cls=u?.className || u?.class || u?.classesHandled?.[0] || "II B.Sc Data Analytics";
  let rows=(db.classTimetables||[]).filter(x=>x.className===cls);
  if(!rows.length && typeof v3SeedClassRowsForUI==="function")rows=v3SeedClassRowsForUI(cls);
  if(!rows.length){
    rows=[
      {day:"Monday",period:"1",subject:"Python",faculty:"Dr. Priya"},
      {day:"Monday",period:"2",subject:"SQL",faculty:"Dr. Priya"},
      {day:"Tuesday",period:"1",subject:"Statistics",faculty:"Ms. Kavitha R"},
      {day:"Tuesday",period:"3",subject:"Power BI",faculty:"Dr. Priya"},
      {day:"Wednesday",period:"2",subject:"Data Analytics",faculty:"Dr. Meena S"},
      {day:"Thursday",period:"1",subject:"Excel",faculty:"Mr. Arun Kumar"},
      {day:"Friday",period:"2",subject:"Machine Learning",faculty:"Dr. Meena S"},
      {day:"Saturday",period:"1",subject:"Communication",faculty:"Faculty"}
    ];
  }
  const days=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"], periods=["1","2","3","4","5","6"];
  const escFn=typeof esc==="function"?esc:(x)=>String(x??"");
  const cell=(d,p)=>{const r=rows.find(x=>String(x.day).toLowerCase()===d.toLowerCase()&&String(x.period)===p);return r?`${escFn(r.subject||"—")}<br><small>${escFn(r.faculty||r.facultyName||"")}</small>`:"—";};
  el.innerHTML=`<div class="table-wrap"><table class="v3-timetable"><thead><tr><th>Day</th>${periods.map(p=>`<th>Period ${p}</th>`).join("")}</tr></thead><tbody>${days.map(d=>`<tr><th>${d}</th>${periods.map(p=>`<td>${cell(d,p)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
};

/* Lightweight UI wrappers for the consolidated management modules. */
window.v3EnsureManagementDataForUI=function(){
  db.hodDetails=Array.isArray(db.hodDetails)?db.hodDetails:[];
  db.departments=Array.isArray(db.departments)?db.departments:[];
};
window.renderV3ManagementHodsForUI=function(){
  if(typeof window.renderV3ManagementHods==="function")window.renderV3ManagementHods();
};

/* Make legacy V2 navigation incapable of recreating the removed duplicate pages. */
const _refreshAll=window.refreshAll;
window.refreshAll=function(){
  if(typeof _refreshAll==="function")_refreshAll();
  document.getElementById("management-v2-hod")?.remove();
  document.getElementById("management-v2-departments")?.remove();
  document.getElementById("adviser-timetable-v2")?.remove();
};
})();
