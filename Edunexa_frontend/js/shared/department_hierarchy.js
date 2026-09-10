(function(){
"use strict";
async function loadDepartmentHierarchyPage(){
  var host=document.getElementById("department-hierarchy"); if(!host||!currentUser)return;
  host.innerHTML='<div class="page-title"><h1>Department Hierarchy</h1><p>HOD → Faculty → Class Adviser / Mentor → Students</p></div><div class="card"><p>Loading department structure…</p></div>';
  try{
    var res=await fetch((window.EduNexaAPI?EduNexaAPI.baseURL:"http://127.0.0.1:8000/api")+"/department-hierarchy",{headers:{Authorization:"Bearer "+localStorage.getItem("edunexa_token")} });
    var data=await res.json();
    if(!res.ok)throw new Error(data.detail||"Unable to load hierarchy");
    var faculty=data.faculty||[], students=data.students||[];
    var adviser=faculty.filter(f=>f.is_class_adviser)[0], mentor=faculty.filter(f=>f.is_mentor)[0], other=faculty.filter(f=>!f.is_class_adviser&&!f.is_mentor);
    var esc=window.esc||function(x){return String(x==null?"":x).replace(/[&<>\"']/g,function(c){return ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"})[c]})};
    host.innerHTML = '<div class="page-title"><h1>'+esc(data.department.name)+' — Department Hierarchy</h1><p>HOD → All Faculty → separate Class Adviser and Mentor → Students</p></div>' +
      '<div class="card"><div class="card-head"><div><h3>HOD</h3><p>'+esc(data.department.hod_name||"—")+'</p></div></div></div>' +
      '<div class="grid-3">' +
      '<div class="card"><h3>⭐ Class Adviser</h3><p><b>'+esc(adviser?adviser.name:"Not assigned")+'</b></p><small>Responsible for class administration</small></div>' +
      '<div class="card"><h3>🧭 Mentor</h3><p><b>'+esc(mentor?mentor.name:"Not assigned")+'</b></p><small>Non-Class-Adviser mentor</small></div>' +
      '<div class="card"><h3>👥 Other Faculty</h3><p><b>'+other.length+'</b> faculty</p><small>'+esc(other.map(f=>f.name).join(", ")||"None")+'</small></div></div>' +
      '<div class="card"><div class="card-head"><div><h3>All Faculty</h3><p>Every faculty member remains under the HOD.</p></div></div><div class="table-wrap"><table><thead><tr><th>Faculty</th><th>Role</th><th>Faculty ID</th></tr></thead><tbody>'+faculty.map(function(f){return '<tr><td><b>'+esc(f.name)+'</b></td><td>'+(f.is_class_adviser?'<span class="badge green">Class Adviser</span>':f.is_mentor?'<span class="badge blue">Mentor</span>':'<span class="badge">Faculty</span>')+'</td><td>'+esc(f.faculty_id||"—")+'</td></tr>'}).join("")+'</tbody></table></div></div>' +
      '<div class="card"><div class="card-head"><div><h3>Students & Assignments</h3><p>Each student has a separate Class Adviser and Mentor.</p></div></div><div class="table-wrap"><table><thead><tr><th>Student</th><th>Class</th><th>Class Adviser</th><th>Mentor</th></tr></thead><tbody>'+students.map(function(st){return '<tr><td><b>'+esc(st.name)+'</b><br><small>'+esc(st.student_id||st.email||"")+'</small></td><td>'+esc(st.assigned_class_name||"—")+'</td><td>'+esc(st.class_adviser_name||"—")+'</td><td>'+esc(st.mentor_name||"—")+'</td></tr>'}).join("")+'</tbody></table></div></div>';
  }catch(e){host.innerHTML='<div class="card"><div class="notice">'+String(e.message||e)+'</div></div>';}
}
window.loadDepartmentHierarchyPage=loadDepartmentHierarchyPage;
})();
