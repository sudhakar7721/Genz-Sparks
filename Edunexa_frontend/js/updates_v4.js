/* =========================================================
   EDUNEXA V4 FINAL CLEANUP + SAMPLE DATA
   Consolidates duplicate Management and Faculty Class Timetable UI
   while preserving existing modules and data.
========================================================= */
(function(){
  "use strict";

  function ensureSampleReports(){
    db.hodDetails = Array.isArray(db.hodDetails) ? db.hodDetails : [];
    db.departments = Array.isArray(db.departments) ? db.departments : [];
    const hodSamples = [
      {id:"HOD-1001",name:"Dr. HOD Admin",email:"hod@edunexa.com",phone:"+91 90000 20001",department:"Data Analytics",designation:"Head of Department",qualification:"Ph.D. in Data Science",experience:"12 Years",joiningYear:"2014",office:"Block A - HOD Room",extraInfo:"Leads academic planning, student mentoring, placements and department quality initiatives."},
      {id:"HOD-1002",name:"Dr. Kumar",email:"kumar.hod@edunexa.com",phone:"+91 90000 20002",department:"Computer Science",designation:"Head of Department",qualification:"Ph.D. in Computer Science",experience:"15 Years",joiningYear:"2011",office:"Block B - HOD Room",extraInfo:"Oversees computer science curriculum, faculty development and project activities."},
      {id:"HOD-1003",name:"Dr. Meena",email:"meena.hod@edunexa.com",phone:"+91 90000 20003",department:"Information Technology",designation:"Head of Department",qualification:"Ph.D. in Information Technology",experience:"13 Years",joiningYear:"2013",office:"Block C - HOD Room",extraInfo:"Coordinates IT academic operations, industry interaction and student projects."},
      {id:"HOD-1004",name:"Dr. Ravi",email:"ravi.hod@edunexa.com",phone:"+91 90000 20004",department:"Artificial Intelligence & Data Science",designation:"Head of Department",qualification:"Ph.D. in Artificial Intelligence",experience:"10 Years",joiningYear:"2016",office:"Block D - HOD Room",extraInfo:"Leads AI and Data Science curriculum, research, internships and placements."}
    ];
    hodSamples.forEach(h=>{ if(!db.hodDetails.some(x=>x.id===h.id)) db.hodDetails.push(h); });

    const deptSamples = [
      {id:"DEP-1001",name:"Data Analytics",code:"DA",hod:"Dr. HOD Admin",email:"da@edunexa.com",phone:"+91 90000 30001",classes:"I B.Sc Data Analytics, II B.Sc Data Analytics, III B.Sc Data Analytics",description:"Data analytics, statistics, Python, SQL, Excel, Power BI and machine learning programmes.",feedbackNote:"Sample feedback report: strong practical learning; improve Wi-Fi during lab sessions."},
      {id:"DEP-1002",name:"Computer Science",code:"CS",hod:"Dr. Kumar",email:"cs@edunexa.com",phone:"+91 90000 30002",classes:"I B.Sc Computer Science, II B.Sc Computer Science, III B.Sc Computer Science",description:"Computer science programming, algorithms, databases, systems and software development.",feedbackNote:"Sample feedback report: students requested additional coding practice sessions."},
      {id:"DEP-1003",name:"Information Technology",code:"IT",hod:"Dr. Meena",email:"it@edunexa.com",phone:"+91 90000 30003",classes:"I B.Sc Information Technology, II B.Sc Information Technology, III B.Sc Information Technology",description:"Information technology, networking, web development, cloud and enterprise applications.",feedbackNote:"Sample feedback report: positive response to industry-oriented workshops."},
      {id:"DEP-1004",name:"Artificial Intelligence & Data Science",code:"AIDS",hod:"Dr. Ravi",email:"aids@edunexa.com",phone:"+91 90000 30004",classes:"I B.Sc AI & Data Science, II B.Sc AI & Data Science, III B.Sc AI & Data Science",description:"Artificial intelligence, machine learning, deep learning, data science and analytics.",feedbackNote:"Sample feedback report: students value project-based learning and internship guidance."}
    ];
    deptSamples.forEach(d=>{ if(!db.departments.some(x=>x.id===d.id)) db.departments.push(d); });

    /* Keep the seeded HOD login synchronized with the HOD directory. */
    const adminHod=db.users.find(u=>u.role==="hod" && u.email==="hod@edunexa.com");
    const h=hodSamples[0];
    if(adminHod) Object.assign(adminHod,{name:h.name,hodId:h.id,department:h.department,designation:h.designation,phone:h.phone,qualification:h.qualification,experience:h.experience});

    db.sampleReports = {
      generatedAt:"2026-09-04",
      note:"Demo/sample institutional records. Replace with live college data when connecting the backend.",
      managementSummary:{departments:db.departments.length,hods:db.hodDetails.length,feedbacks:(db.feedbacks||[]).length},
      placementSummary:{highestPackage:"12 LPA",companiesVisited:8,studentsPlaced:18},
      academicSummary:{classes:12,activeFaculty:(db.users||[]).filter(u=>u.role==="faculty").length,activeStudents:(db.users||[]).filter(u=>u.role==="student").length}
    };
    save();
  }

  function table(headers, rows){
    return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows||`<tr><td colspan="${headers.length}" class="empty">No records found.</td></tr>`}</tbody></table></div>`;
  }

  function managementHodPage(){
    return `<div class="page" id="management-hod"><div class="page-title"><h1>HOD Information 🏛️</h1><p>Single HOD module — view, edit and add HOD details across departments.</p></div>
      <div class="card"><div class="card-head"><div><h3>Add New HOD</h3><p>Create or maintain HOD information for any department.</p></div></div><div id="v3HodFormHost"></div></div>
      <div class="card"><div class="card-head"><div><h3>HOD Details — View</h3><p>Complete HOD directory across departments.</p></div></div><div id="v3HodTable"></div></div>
    </div>`;
  }
  function managementDeptPage(){
    return `<div class="page" id="management-departments"><div class="page-title"><h1>Department Details 🏫</h1><p>Single department module — view, edit, add new department and view feedback analytics.</p></div>
      <div class="card"><div class="card-head"><div><h3>Add New Department</h3><p>Create or maintain department information.</p></div></div><div id="v3DeptFormHost"></div></div>
      <div class="card"><div class="card-head"><div><h3>Department Details — View</h3><p>Department, classes, HOD, student/faculty counts and feedback are maintained here.</p></div></div><div id="v3DeptTable"></div></div>
    </div>`;
  }

  function installPages(){
    const pages=document.getElementById("pages"); if(!pages)return;
    ["management-hod-details","management-department-details","management-v2-hod","management-v2-departments"].forEach(id=>document.getElementById(id)?.remove());
    let hp=document.getElementById("management-hod");
    let dp=document.getElementById("management-departments");
    if(hp) hp.outerHTML=managementHodPage(); else pages.insertAdjacentHTML("beforeend",managementHodPage());
    if(dp) dp.outerHTML=managementDeptPage(); else pages.insertAdjacentHTML("beforeend",managementDeptPage());
    /* Only one Class Timetable page for faculty/adviser. */
    document.getElementById("adviser-timetable-v2")?.remove();
  }

  function installNav(){
    const nav=document.getElementById("nav"); if(!nav)return;
    [...nav.querySelectorAll(".menu-title")].forEach(t=>{
      if(t.textContent.trim()==="Management Views"){
        let n=t.nextElementSibling; while(n&&n.classList.contains("nav")){const next=n.nextElementSibling;n.remove();n=next;} t.remove();
      }
    });
    nav.querySelectorAll('.nav[data-page="management-hod-details"],.nav[data-page="management-department-details"],.nav[data-page="management-v2-hod"],.nav[data-page="management-v2-departments"],.nav[data-page="adviser-timetable-v2"]').forEach(x=>x.remove());
    const mg=nav.querySelector('.menu-title');
    const all=[...nav.querySelectorAll('.menu-title')];
    const managementTitle=all.find(x=>x.textContent.trim()==="Management");
    if(managementTitle){
      let cursor=managementTitle.nextElementSibling;
      const buttons=[]; while(cursor&&cursor.classList.contains("nav")){buttons.push(cursor);cursor=cursor.nextElementSibling;}
      const hod=buttons.find(b=>b.dataset.page==="management-hod");
      const dep=buttons.find(b=>b.dataset.page==="management-departments");
      if(hod) hod.querySelector("b").textContent="HOD Information";
      if(dep) dep.querySelector("b").textContent="Department Details";
    }
    if(currentUser?.role==="faculty"){
      nav.querySelectorAll('.nav[data-page="adviser-timetable-v2"]').forEach(x=>x.remove());
      const old=nav.querySelector('.nav[data-page="adviser-timetable"]'); if(old) old.querySelector("b").textContent="Class Timetable";
    }
  }

  function renderHod(){
    ensureSampleReports();
    if(typeof v3HodForm==="function") document.getElementById("v3HodFormHost").innerHTML=v3HodForm({});
    const el=document.getElementById("v3HodTable"); if(!el)return;
    el.innerHTML=table(["ID","HOD Details","Department","Designation","Contact","Qualification","Actions"],db.hodDetails.map(h=>`<tr><td>${esc(h.id)}</td><td><b>${esc(h.name)}</b><br><small>${esc(h.email)}</small></td><td>${esc(h.department)}</td><td>${esc(h.designation||"Head of Department")}</td><td>${esc(h.phone||"—")}</td><td>${esc(h.qualification||"—")}</td><td><button class="btn secondary" onclick="v3EditHod('${escAttr(h.id)}')">✏ Edit</button> <button class="btn secondary" onclick="v2View('HOD Details',\`${escAttr(JSON.stringify(h))}\`)">👁 View</button></td></tr>`).join(""));
  }
  function renderDepartments(){
    ensureSampleReports();
    if(typeof v3DeptForm==="function") document.getElementById("v3DeptFormHost").innerHTML=v3DeptForm({});
    const el=document.getElementById("v3DeptTable"); if(!el)return;
    el.innerHTML=table(["Department","Code","HOD","Classes","Students","Faculty","Feedback","Avg Rating","Actions"],db.departments.map(d=>{
      const fs=(db.feedbacks||[]).filter(f=>f.department===d.name); const avg=fs.length?(fs.reduce((s,f)=>s+Number(f.rating||0),0)/fs.length).toFixed(2):"0.00";
      const students=db.users.filter(u=>u.role==="student"&&u.department===d.name).length;
      const faculty=db.users.filter(u=>u.role==="faculty"&&u.department===d.name).length;
      return `<tr><td><b>${esc(d.name)}</b><br><small>${esc(d.description||"")}</small></td><td>${esc(d.code||"—")}</td><td>${esc(d.hod||"—")}</td><td>${esc(d.classes||"—")}</td><td>${students}</td><td>${faculty}</td><td>${fs.length}</td><td>${avg}/5</td><td><button class="btn secondary" onclick="v3EditDepartment('${escAttr(d.id)}')">✏ Edit</button> <button class="btn secondary" onclick="v3ViewDepartmentFeedback('${escAttr(d.name)}')">💬 Feedback</button> <button class="btn secondary" onclick="v2View('Department Details',\`${escAttr(JSON.stringify(d))}\`)">👁 View</button></td></tr>`;
    }).join(""));
  }

  ensureSampleReports();
  const oldPages=window.renderPages;
  window.renderPages=function(){ oldPages(); installPages(); };
  const oldBuild=window.buildNav;
  window.buildNav=function(){ oldBuild(); installNav(); };
  const oldGo=window.go;
  window.go=function(id){
    if(id==="management-hod-details")id="management-hod";
    if(id==="management-department-details")id="management-departments";
    if(id==="adviser-timetable-v2")id="adviser-timetable";
    oldGo(id);
    if(id==="management-hod")renderHod();
    if(id==="management-departments")renderDepartments();
    if(id==="adviser-timetable" && typeof window.renderV3AdviserTimetable==="function")window.renderV3AdviserTimetable();
  };
  const oldRefresh=window.refreshAll;
  window.refreshAll=function(){ if(typeof oldRefresh==="function")oldRefresh(); installPages(); installNav(); if(currentUser?.role==="management"){renderHod();renderDepartments();} };

  /* Re-seed sample management data after any legacy migration. */
  window.edunexaSeedReports=ensureSampleReports;
})();
