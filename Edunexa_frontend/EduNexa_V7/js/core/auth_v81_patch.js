/* =========================================================
   EDUNEXA V9 - FINAL FACULTY / HOD LOGIN FIX
   One top-level Faculty card. HOD/Faculty choices appear only
   after the Faculty card is selected. Existing data is preserved.
========================================================= */
(function(){
  "use strict";

  const DEMO_USERS = [
    {name:"Dr. Priya", email:"faculty@edunexa.com", password:"123456", role:"faculty", facultyId:"FAC-1001", mentor:true, classAdviser:true, department:"Data Analytics", position:"Assistant Professor", designation:"Faculty Coordinator", qualification:"Ph.D. in Computer Science", experience:"8 Years", phone:"+91 90000 10001"},
    {name:"Dr. HOD Admin", email:"hod@edunexa.com", password:"123456", role:"hod", hodId:"HOD-1001", department:"Data Analytics", designation:"Head of Department", qualification:"Ph.D. in Data Science", experience:"12 Years", phone:"+91 90000 20001"}
  ];

  function normalize(v){ return String(v ?? "").trim().toLowerCase(); }

  function ensureDemoAccounts(){
    if(!window.db || !Array.isArray(db.users)) return;
    let changed=false;
    for(const demo of DEMO_USERS){
      let user=db.users.find(u=>
        normalize(u.email)===normalize(demo.email) ||
        (demo.facultyId && normalize(u.facultyId)===normalize(demo.facultyId)) ||
        (demo.hodId && normalize(u.hodId)===normalize(demo.hodId))
      );
      if(!user){
        db.users.push({...demo});
        changed=true;
      }else{
        // Repair authentication identity only; retain all other existing fields.
        for(const key of ["email","password","role"]){
          if(user[key] !== demo[key]) { user[key]=demo[key]; changed=true; }
        }
        for(const key of ["facultyId","hodId"]){
          if(demo[key] && user[key] !== demo[key]) { user[key]=demo[key]; changed=true; }
        }
      }
    }
    if(changed && typeof save === "function") save();
  }

  function setTopFacultyLabel(){
    const card=document.querySelector('#loginPanel .role[onclick*="chooseLogin(\'staff\'"]');
    if(card){
      const b=card.querySelector('b'); if(b) b.textContent='Faculty';
      const small=card.querySelector('small'); if(small) small.remove();
    }
    const title=document.querySelector('#staffLoginTypes .staff-login-title');
    if(title) title.textContent='Select Login Type';
  }

  function showStaffTypes(){
    const box=document.getElementById('staffLoginTypes');
    if(box) box.classList.remove('hidden');
  }

  ensureDemoAccounts();
  setTopFacultyLabel();

  // Final login implementation. Case-insensitive IDs make file:// usage reliable.
  window.login=function(){
    const id=normalize(document.getElementById('loginId')?.value);
    const password=String(document.getElementById('loginPassword')?.value || '').trim();
    if(!id || !password){ toast('Enter login ID and password.'); return; }

    ensureDemoAccounts();
    const selectedTop = (typeof loginRole === 'undefined') ? 'student' : loginRole;
    const selectedStaff = (typeof staffLoginRole === 'undefined' || !staffLoginRole) ? 'faculty' : staffLoginRole;
    const effectiveRole=selectedTop==='staff' ? selectedStaff : selectedTop;

    const user=(db.users||[]).find(u=>{
      const ids=[u.email,u.studentId,u.facultyId,u.hodId,u.adminId].filter(Boolean).map(normalize);
      return ids.includes(id) && String(u.password ?? '').trim()===password && normalize(u.role)===normalize(effectiveRole);
    });

    if(!user){
      toast(`Invalid ${effectiveRole==='hod'?'HOD':effectiveRole==='faculty'?'Faculty':'login'} details. Check the selected login type and credentials.`);
      return;
    }

    currentUser=user;
    localStorage.setItem('edunexa_session',JSON.stringify(user));
    openApp();
  };

  const originalChooseLogin=window.chooseLogin;
  window.chooseLogin=function(role,element){
    if(typeof originalChooseLogin==='function') originalChooseLogin(role,element);
    if(role==='staff'){
      if(!staffLoginRole) staffLoginRole='faculty';
      showStaffTypes();
      setTopFacultyLabel();
    }
  };

  // Expose a safe staff selector even if an older script replaced it.
  window.chooseStaffLogin=function(role,element){
    staffLoginRole=(role==='hod')?'hod':'faculty';
    document.querySelectorAll('#staffLoginTypes .staff-type').forEach(b=>b.classList.remove('active'));
    if(element) element.classList.add('active');
  };
})();
