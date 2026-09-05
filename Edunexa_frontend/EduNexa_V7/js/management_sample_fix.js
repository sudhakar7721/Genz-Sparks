/* EduNexa Management Sample Data + UI Safety Patch */
(function(){
  "use strict";
  const HODS=[
    {id:"HOD-1001",name:"Dr. HOD Admin",email:"hod@edunexa.com",phone:"+91 90000 20001",department:"Data Analytics",designation:"Head of Department",qualification:"Ph.D. in Data Science",experience:"12 Years",joiningYear:"2014",office:"Block A - HOD Room",extraInfo:"Academic planning, mentoring, placements and quality initiatives."},
    {id:"HOD-1002",name:"Dr. Kumar",email:"kumar.hod@edunexa.com",phone:"+91 90000 20002",department:"Computer Science",designation:"Head of Department",qualification:"Ph.D. in Computer Science",experience:"15 Years",joiningYear:"2011",office:"Block B - HOD Room",extraInfo:"Curriculum, faculty development and project activities."},
    {id:"HOD-1003",name:"Dr. Meena",email:"meena.hod@edunexa.com",phone:"+91 90000 20003",department:"Information Technology",designation:"Head of Department",qualification:"Ph.D. in Information Technology",experience:"13 Years",joiningYear:"2013",office:"Block C - HOD Room",extraInfo:"IT academic operations and industry interaction."},
    {id:"HOD-1004",name:"Dr. Ravi",email:"ravi.hod@edunexa.com",phone:"+91 90000 20004",department:"Artificial Intelligence & Data Science",designation:"Head of Department",qualification:"Ph.D. in Artificial Intelligence",experience:"10 Years",joiningYear:"2016",office:"Block D - HOD Room",extraInfo:"AI curriculum, research, internships and placements."}
  ];
  const DEPTS=[
    {id:"DEP-1001",name:"Data Analytics",code:"DA",hod:"Dr. HOD Admin",email:"da@edunexa.com",phone:"+91 90000 30001",classes:"I B.Sc Data Analytics, II B.Sc Data Analytics, III B.Sc Data Analytics",description:"Python, SQL, Excel, Power BI, statistics and machine learning.",feedbackNote:"Sample feedback: strong practical learning; improve Wi-Fi during labs."},
    {id:"DEP-1002",name:"Computer Science",code:"CS",hod:"Dr. Kumar",email:"cs@edunexa.com",phone:"+91 90000 30002",classes:"I B.Sc Computer Science, II B.Sc Computer Science, III B.Sc Computer Science",description:"Programming, algorithms, databases, systems and software development.",feedbackNote:"Sample feedback: students requested additional coding practice."},
    {id:"DEP-1003",name:"Information Technology",code:"IT",hod:"Dr. Meena",email:"it@edunexa.com",phone:"+91 90000 30003",classes:"I B.Sc Information Technology, II B.Sc Information Technology, III B.Sc Information Technology",description:"Networking, web development, cloud and enterprise applications.",feedbackNote:"Sample feedback: positive response to industry workshops."},
    {id:"DEP-1004",name:"Artificial Intelligence & Data Science",code:"AIDS",hod:"Dr. Ravi",email:"aids@edunexa.com",phone:"+91 90000 30004",classes:"I B.Sc AI & Data Science, II B.Sc AI & Data Science, III B.Sc AI & Data Science",description:"AI, machine learning, deep learning and data science.",feedbackNote:"Sample feedback: students value project-based learning."}
  ];
  function seed(){
    db.hodDetails=Array.isArray(db.hodDetails)?db.hodDetails:[];
    db.departments=Array.isArray(db.departments)?db.departments:[];
    HODS.forEach(x=>{if(!db.hodDetails.some(y=>y.id===x.id))db.hodDetails.push({...x});});
    DEPTS.forEach(x=>{if(!db.departments.some(y=>y.id===x.id))db.departments.push({...x});});
    if(typeof save==='function')save();
  }
  function escx(v){return typeof esc==='function'?esc(v):String(v??"");}
  function escax(v){return typeof escAttr==='function'?escAttr(v):String(v??"").replace(/'/g,"&#39;");}
  function render(){
    seed();
    const h=document.getElementById('v3HodTable');
    if(h){
      h.innerHTML='<div class="table-wrap"><table><thead><tr><th>ID</th><th>HOD Details</th><th>Department</th><th>Designation</th><th>Contact</th><th>Qualification</th><th>Actions</th></tr></thead><tbody>'+db.hodDetails.map(x=>`<tr><td>${escx(x.id)}</td><td><b>${escx(x.name)}</b><br><small>${escx(x.email)}</small></td><td>${escx(x.department)}</td><td>${escx(x.designation)}</td><td>${escx(x.phone)}</td><td>${escx(x.qualification)}</td><td><button class="btn secondary" onclick="v3EditHod('${escax(x.id)}')">✏ Edit</button> <button class="btn secondary" onclick="v2View('HOD Details',\`${escax(JSON.stringify(x))}\`)">👁 View</button></td></tr>`).join('')+'</tbody></table></div>';
    }
    const d=document.getElementById('v3DeptTable');
    if(d){
      d.innerHTML='<div class="table-wrap"><table><thead><tr><th>Department</th><th>Code</th><th>HOD</th><th>Classes</th><th>Students</th><th>Faculty</th><th>Feedback</th><th>Actions</th></tr></thead><tbody>'+db.departments.map(x=>{const st=(db.users||[]).filter(u=>u.role==='student'&&u.department===x.name).length;const fc=(db.users||[]).filter(u=>u.role==='faculty'&&u.department===x.name).length;const fb=(db.feedbacks||[]).filter(f=>f.department===x.name).length;return `<tr><td><b>${escx(x.name)}</b><br><small>${escx(x.description)}</small></td><td>${escx(x.code)}</td><td>${escx(x.hod)}</td><td>${escx(x.classes)}</td><td>${st}</td><td>${fc}</td><td>${fb}</td><td><button class="btn secondary" onclick="v3EditDepartment('${escax(x.id)}')">✏ Edit</button> <button class="btn secondary" onclick="v3ViewDepartmentFeedback('${escax(x.name)}')">💬 Feedback</button> <button class="btn secondary" onclick="v2View('Department Details',\`${escax(JSON.stringify(x))}\`)">👁 View</button></td></tr>`}).join('')+'</tbody></table></div>';
    }
  }
  const oldOpen=window.openApp;
  if(typeof oldOpen==='function'){
    window.openApp=function(){oldOpen();setTimeout(render,0);};
  }
  window.addEventListener('load',()=>setTimeout(render,0));
  const oldGo=window.go;
  if(typeof oldGo==='function')window.go=function(id){oldGo(id);if(id==='management-hod'||id==='management-hod-details'||id==='management-departments'||id==='management-department-details')setTimeout(render,0);};
  seed();
})();
