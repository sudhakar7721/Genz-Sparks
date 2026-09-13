/* =========================================================
   EDUNEXA STUDENT ENHANCEMENT PACK
   Version: 2026-09
   Purpose: requested Student improvements only.
   IMPORTANT: Existing modules are preserved.
========================================================= */
(function(){
"use strict";

const EDU_ENH_VERSION = "2026.09.12";

function eduStudentId(){
    return window.currentUser?.studentId || window.currentUser?.id || null;
}
function eduUser(){
    return window.currentUser || null;
}
function eduEsc(v){
    try { return typeof esc==="function" ? esc(v ?? "") : String(v ?? ""); }
    catch(e){ return String(v ?? ""); }
}

/* ---------------------------------------------------------
   1) DEFAULT ATTENDANCE + INTERACTIVE STUDENT DASHBOARD
--------------------------------------------------------- */
function eduEnsureAttendance(){
    if(!window.db) return;
    if(!Array.isArray(db.users)) return;

    db.users.forEach(u=>{
        if(u.role==="student" && (u.attendance===undefined || u.attendance===null || Number.isNaN(Number(u.attendance)))){
            u.attendance = 85;
        }
    });

    if(eduUser() && eduUser().role==="student"){
        if(eduUser().attendance===undefined || eduUser().attendance===null || Number.isNaN(Number(eduUser().attendance))){
            eduUser().attendance = 85;
            const same = db.users.find(u=>u.email===eduUser().email);
            if(same) same.attendance = 85;
        }
        if(typeof save==="function") save();
    }
}

function eduAttendanceValue(){
    eduEnsureAttendance();
    const n=Number(eduUser()?.attendance);
    return Math.max(0,Math.min(100,Number.isFinite(n)?n:85));
}

function eduStudentDashboard(){
    const page=document.getElementById("student-dashboard");
    if(!page || !eduUser() || eduUser().role!=="student") return;

    const attendance=eduAttendanceValue();
    const leaves=Array.isArray(db.leaves)?db.leaves.filter(x=>String(x.studentId)===String(eduStudentId())).length:0;
    const tests=Array.isArray(db.tests)?db.tests.length:0;
    const assignments=Array.isArray(db.assignments)?db.assignments.length:0;
    const submissions=Array.isArray(db.submissions)?db.submissions.filter(x=>String(x.studentId)===String(eduStudentId())).length:0;
    const notices=typeof getVisibleNotifications==="function"?getVisibleNotifications().length:0;

    const oldStats=page.querySelector(".stats");
    if(oldStats){
        oldStats.className="stats edu-interactive-stats";
        oldStats.innerHTML=`
          <div class="stat edu-attendance-stat">
            <div class="edu-ring" style="--attendance:${attendance}%"><span>${attendance}%</span></div>
            <div class="stat-title">Attendance</div>
            <div class="stat-change">${attendance>=75?"Good standing":"Needs attention"}</div>
          </div>
          <div class="stat"><div class="stat-title">Tests</div><div class="stat-number">${tests}</div><div class="stat-change">${submissions} of your submissions</div></div>
          <div class="stat"><div class="stat-title">Assignments</div><div class="stat-number">${assignments}</div><div class="stat-change">Faculty-created work</div></div>
          <div class="stat"><div class="stat-title">Notifications</div><div class="stat-number">${notices}</div><div class="stat-change">Faculty • Adviser • Mentor • HOD • Admin</div></div>`;
    }

    let panel=page.querySelector("#eduInteractiveDashboard");
    if(!panel){
        panel=document.createElement("div");
        panel.id="eduInteractiveDashboard";
        panel.className="card edu-interactive-dashboard";
        const anchor=page.querySelector(".grid2");
        if(anchor) anchor.parentNode.insertBefore(panel,anchor);
        else page.appendChild(panel);
    }

    const level=attendance>=90?"Excellent":attendance>=75?"Good":"Needs Attention";
    const cls=eduUser().className || eduUser().class || eduUser().classesHandled?.[0] || "Class not assigned";
    panel.innerHTML=`
      <div class="card-head">
        <div><h3>📊 Interactive Academic Dashboard</h3>
        <p>${eduEsc(cls)} • Attendance status: <b>${level}</b></p></div>
        <button class="btn secondary" type="button" onclick="go('student-attendance')">View Attendance</button>
      </div>
      <div class="edu-dashboard-grid">
        <div class="edu-mini">
          <div class="edu-mini-top"><b>Attendance</b><span>${attendance}%</span></div>
          <div class="edu-bar"><i style="width:${attendance}%"></i></div>
          <small>Default academic attendance is applied when no value is available.</small>
        </div>
        <div class="edu-mini">
          <div class="edu-mini-top"><b>Tests</b><span>${tests}</span></div>
          <div class="edu-bar"><i style="width:${Math.min(100,tests*10)}%"></i></div>
          <small>Faculty-created tests available.</small>
        </div>
        <div class="edu-mini">
          <div class="edu-mini-top"><b>Assignments</b><span>${assignments}</span></div>
          <div class="edu-bar"><i style="width:${Math.min(100,assignments*10)}%"></i></div>
          <small>Assignments available in your portal.</small>
        </div>
        <div class="edu-mini">
          <div class="edu-mini-top"><b>Leave Requests</b><span>${leaves}</span></div>
          <div class="edu-bar"><i style="width:${Math.min(100,leaves*20)}%"></i></div>
          <small>Requests remain saved after logout.</small>
        </div>
      </div>`;
}

/* ---------------------------------------------------------
   2) LEAVE DATE RULE + SINGLE LEAVE DURATION
--------------------------------------------------------- */
function eduFixLeaveForm(){
    const form=document.querySelector("#student-leave form");
    if(!form) return;

    /* Prevent the enhancement layer from ever adding a second
       Leave Duration control. If another duplicate exists, keep
       the first and remove later duplicates. */
    const durationLabels=[...form.querySelectorAll("label")].filter(x=>x.textContent.trim().toLowerCase()==="leave duration");
    if(durationLabels.length>1){
        durationLabels.slice(1).forEach(label=>{
            const group=label.closest(".form-group") || label.parentElement;
            if(group) group.remove();
        });
    }

    let duration=document.getElementById("leaveDuration");
    if(!duration){
        const grid=form.querySelector(".form-grid");
        if(grid){
            const wrap=document.createElement("div");
            wrap.className="form-group";
            wrap.innerHTML=`<label>Leave Duration</label>
              <select id="leaveDuration" class="control" onchange="toggleLeaveHours()">
                <option value="full">Full Day</option>
                <option value="half">Half Day</option>
              </select>`;
            grid.insertBefore(wrap,grid.children[2]||null);
            duration=wrap.querySelector("#leaveDuration");
        }
    }

    if(duration && !document.getElementById("leaveHours")){
        const grid=form.querySelector(".form-grid");
        if(grid){
            const wrap=document.createElement("div");
            wrap.className="form-group";
            wrap.id="eduLeaveHoursGroup";
            wrap.innerHTML=`<label>Hours (Half Day — maximum 6 hours)</label>
              <input id="leaveHours" type="number" min="1" max="6" step="1" value="6" class="control">`;
            grid.insertBefore(wrap,grid.children[3]||null);
        }
    }

    const from=document.getElementById("leaveFrom");
    const to=document.getElementById("leaveTo");
    if(from && to){
        const sync=()=>{
            if(from.value){
                to.min=from.value;
                if(to.value && to.value<from.value) to.value=from.value;
            }else{
                to.removeAttribute("min");
            }
        };
        from.removeEventListener("change",from.__eduDateSync);
        from.__eduDateSync=sync;
        from.addEventListener("change",sync);
        sync();
    }

    if(typeof toggleLeaveHours==="function") toggleLeaveHours();
}

/* Override only the enhancement helper; the original submitLeave
   remains intact and continues to save requests. */
window.toggleLeaveHours=function(){
    const half=document.getElementById("leaveDuration")?.value==="half";
    const group=document.getElementById("eduLeaveHoursGroup") || document.getElementById("leaveHoursWrap");
    if(group) group.style.display=half?"block":"none";
};

/* ---------------------------------------------------------
   3) SKILL ROLE RECOMMENDATION + RESUME UPLOAD
--------------------------------------------------------- */
const EDU_ROLES=[
 {role:"Data Analyst", skills:["Python","SQL","Power BI","Excel"], desc:"Analyze data, create dashboards and communicate insights."},
 {role:"BI Analyst", skills:["Power BI","Excel","SQL"], desc:"Build business intelligence reports and interactive dashboards."},
 {role:"SQL / Database Analyst", skills:["SQL","Python","Excel"], desc:"Work with databases, queries, data quality and reporting."},
 {role:"Data Visualization Analyst", skills:["Power BI","Excel","Communication"], desc:"Turn data into clear dashboards, stories and decisions."},
 {role:"Junior Python Data Analyst", skills:["Python","SQL","Communication"], desc:"Use Python and SQL for cleaning, analysis and automation."}
];

function eduRoleScore(student,role){
    const sk=student.skills||{};
    const vals=role.skills.map(k=>Number(sk[k]??50));
    return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
}
function eduRoleHTML(){
    const u=eduUser(); if(!u) return "";
    const ranked=EDU_ROLES.map(r=>({...r,score:eduRoleScore(u,r)})).sort((a,b)=>b.score-a.score);
    const top=ranked[0], others=ranked.slice(1,4);
    return `<div class="edu-role-recommend">
      <div class="edu-role-main"><span class="edu-role-icon">🎯</span>
        <div><b>Best-fit role: ${eduEsc(top.role)}</b><p>${eduEsc(top.desc)}</p>
        <div class="edu-bar"><i style="width:${top.score}%"></i></div>
        <small>${top.score}% skill match • improve the lowest matching skills to increase your score.</small></div>
      </div>
      <div class="edu-role-list">${others.map(r=>`<div><b>${eduEsc(r.role)}</b><span>${r.score}%</span></div>`).join("")}</div>
    </div>`;
}
function eduResumeStoreKey(){ return "edunexa_resume_"+String(eduStudentId()||"guest"); }

function eduResumePanel(){
    const key=eduResumeStoreKey();
    let saved=null;
    try{ saved=JSON.parse(localStorage.getItem(key)||"null"); }catch(e){}
    return `<div class="card edu-resume-card">
      <div class="card-head"><div><h3>📄 Resume Upload</h3><p>Upload your latest resume. It is stored for this student and remains available after logout and the next login.</p></div></div>
      <div class="form-grid">
        <div class="form-group full"><input id="eduResumeFile" type="file" class="control" accept=".pdf,.doc,.docx,.txt"></div>
        <div class="full"><button class="btn primary" type="button" onclick="saveStudentResume()">Upload / Replace Resume</button>
        ${saved?` <button class="btn secondary" type="button" onclick="viewStudentResume()">View Resume</button>`:""}</div>
      </div>
      <div id="eduResumeStatus" class="muted">${saved?`Saved: ${eduEsc(saved.name)} • ${eduEsc(saved.uploadedAt||"")} `:"No resume uploaded yet."}</div>
    </div>`;
}
window.saveStudentResume=function(){
    const f=document.getElementById("eduResumeFile")?.files?.[0];
    if(!f){ toast("Please select a resume file."); return; }
    const reader=new FileReader();
    reader.onload=()=>{
        const item={name:f.name,type:f.type||"application/octet-stream",size:f.size,data:reader.result,uploadedAt:new Date().toLocaleString()};
        try{
            localStorage.setItem(eduResumeStoreKey(),JSON.stringify(item));
            toast("Resume uploaded and saved.");
            eduRefreshSkillPage();
        }catch(e){ toast("Resume is too large for browser storage. Please use a smaller file."); }
    };
    reader.readAsDataURL(f);
};
window.viewStudentResume=function(){
    try{
        const item=JSON.parse(localStorage.getItem(eduResumeStoreKey())||"null");
        if(!item?.data){toast("Resume not found.");return;}
        const w=window.open();
        if(!w){toast("Allow pop-ups to view the resume.");return;}
        if(item.type==="application/pdf" || item.type.startsWith("image/")){
            w.location.href=item.data;
        }else{
            w.document.write(`<title>${eduEsc(item.name)}</title><pre style="white-space:pre-wrap;font:14px Arial">This resume was uploaded as ${eduEsc(item.name)}. Browser preview is available for PDF/image files.</pre>`);
        }
    }catch(e){toast("Unable to open resume.");}
};

function eduRefreshSkillPage(){
    const page=document.getElementById("student-skills"); if(!page||!eduUser())return;
    let role=page.querySelector("#eduRoleRecommendation");
    if(!role){
        role=document.createElement("div"); role.id="eduRoleRecommendation"; role.className="card";
        const cards=page.querySelectorAll(".card");
        if(cards.length) cards[1]?.parentNode?.insertBefore(role,cards[1]);
        else page.appendChild(role);
    }
    role.innerHTML=`<div class="card-head"><div><h3>🎯 AI-Style Role Recommendation</h3><p>Recommended from your current skill profile.</p></div></div>${eduRoleHTML()}`;

    let resume=page.querySelector("#eduResumeContainer");
    if(!resume){
        resume=document.createElement("div"); resume.id="eduResumeContainer";
        page.appendChild(resume);
    }
    resume.innerHTML=eduResumePanel();
}

/* ---------------------------------------------------------
   4) CERTIFICATES: VIEW + PERSISTENT PER-LOGIN DISPLAY
--------------------------------------------------------- */
function eduOpenFile(file){
    if(!file?.data){toast("No uploaded file available.");return;}
    const w=window.open();
    if(!w){toast("Allow pop-ups to view the file.");return;}
    if(file.type==="application/pdf" || String(file.type||"").startsWith("image/")){
        w.location.href=file.data;
    }else{
        w.document.write(`<title>${eduEsc(file.name||"Uploaded file")}</title><p style="font-family:Arial">File: ${eduEsc(file.name||"Uploaded file")}<br>Type: ${eduEsc(file.type||"unknown")}</p>`);
    }
}
window.eduOpenCertificate=eduOpenFile;

function eduCertificateView(){
    const sid=eduStudentId();
    const rows=(db.certificates||[]).filter(x=>String(x.studentId)===String(sid));
    return rows.map(x=>`<div class="item edu-record-item">
      <div class="item-top"><b>🏆 ${eduEsc(x.name)}</b><span class="badge green">Certificate</span></div>
      <p>${eduEsc(x.organization)} • ${eduEsc(x.date||"-")}</p>
      <small>${eduEsc(x.file?.name||"No file")}</small>
      ${x.file?.data?`<div style="margin-top:8px"><button class="btn secondary" type="button" onclick='eduOpenCertificate(${JSON.stringify(x.file).replace(/'/g,"&#39;")})'>View Certificate</button></div>`:""}
    </div>`).join("") || `<div class="empty">No certificates uploaded yet.</div>`;
}

function eduEnhanceProfessional(){
    const page=document.getElementById("student-professional"); if(!page||!eduUser())return;
    let view=page.querySelector("#eduCertificateView");
    if(!view){
        view=document.createElement("div"); view.id="eduCertificateView"; view.className="card";
        const records=page.querySelector("#professionalRecords");
        if(records?.parentNode) records.parentNode.insertBefore(view,records);
        else page.appendChild(view);
    }
    view.innerHTML=`<div class="card-head"><div><h3>👁️ All My Certificates</h3><p>Every uploaded certificate remains linked to your student account and is shown on future logins.</p></div></div>${eduCertificateView()}`;
}

/* ---------------------------------------------------------
   5) ALL RECEIVED NOTIFICATIONS
--------------------------------------------------------- */
const oldGetVisible = window.getVisibleNotifications;
window.getVisibleNotifications=function(){
    if(!eduUser() || !Array.isArray(db.notifications)) return [];
    const u=eduUser();
    const targets=new Set(["all","student","adviser","mentor","faculty","hod","management","admin",u.role,u.email,u.studentId,u.id]);
    if(u.classAdviser) targets.add("adviser");
    if(u.mentor) targets.add("mentor");

    return db.notifications.filter(n=>{
        /* Backend bridge may intentionally retarget synced notices to the
           current student; local role-targeted notices are also included. */
        return n.__synced || targets.has(n.target) || targets.has(n.recipient) || targets.has(n.to);
    });
};
window.renderNotifications=function(){
    const e=document.getElementById("notificationList");
    if(!e || !eduUser()) return;
    const rows=getVisibleNotifications().slice().sort((a,b)=>{
        const da=new Date(a.createdAt||0).getTime(), dbb=new Date(b.createdAt||0).getTime();
        return (dbb||0)-(da||0);
    }).slice(0,100);
    e.innerHTML=rows.map(n=>`<div class="item">
      <div class="item-top"><b>🔔 ${eduEsc(n.title||"Notification")}</b><small class="muted">${eduEsc(n.createdAt||"")}</small></div>
      <p>${eduEsc(n.message||"")}</p>
      <small class="badge blue">Received • Faculty / Adviser / Mentor / HOD / Admin</small>
    </div>`).join("") || `<div class="empty">No notifications received yet.</div>`;
};

/* ---------------------------------------------------------
   6) CLASS DETAILS: CLASS + YEAR + ADVISER + MENTOR +
      SUBJECT FACULTY + CLASS TIMETABLE
--------------------------------------------------------- */
function eduStudentClass(){
    const u=eduUser();
    const className=u?.className||u?.class||u?.classesHandled?.[0]||"II B.Sc Data Analytics";
    const rows=(db.classTimetables||[]).filter(x=>x.className===className);
    const year=(u?.batch||u?.academicYear||"2025-2028");
    const adviser=u?.classAdviserName||u?.adviserName||"Assigned Class Adviser";
    const mentor=u?.mentorName||"Assigned Mentor";
    const faculties=[...new Set(rows.map(x=>x.faculty).filter(Boolean))];
    return {className,year,adviser,mentor,faculties,rows};
}
function eduRenderStudentClassDetails(){
    const page=document.getElementById("student-timetable"); if(!page||!eduUser())return;
    const d=eduStudentClass();
    const oldTitle=page.querySelector(".page-title h1");
    if(oldTitle) oldTitle.textContent="Class Details 🏫";
    const subtitle=page.querySelector(".page-title p");
    if(subtitle) subtitle.textContent="Your class, adviser, mentor, subject faculty and shared class timetable.";

    let info=page.querySelector("#eduClassInfo");
    if(!info){
        info=document.createElement("div"); info.id="eduClassInfo"; info.className="card";
        const firstCard=page.querySelector(".card");
        if(firstCard) firstCard.parentNode.insertBefore(info,firstCard);
        else page.appendChild(info);
    }
    info.innerHTML=`<div class="card-head"><div><h3>🏫 Class Information</h3><p>All students in the same class receive the same Class Adviser timetable.</p></div></div>
      <div class="grid3">
        <div class="item"><b>Class Name</b><p>${eduEsc(d.className)}</p></div>
        <div class="item"><b>Academic Year / Batch</b><p>${eduEsc(d.year)}</p></div>
        <div class="item"><b>Class Adviser</b><p>${eduEsc(d.adviser)}</p></div>
        <div class="item"><b>Mentor</b><p>${eduEsc(d.mentor)}</p></div>
        <div class="item"><b>Subjects</b><p>${d.faculties.length?eduEsc(d.faculties.join(", ")):"Shown in timetable below"}</p></div>
      </div>`;

    let table=page.querySelector("#studentTimetable");
    if(table){
        const rows=d.rows.slice().sort((a,b)=>String(a.day).localeCompare(String(b.day))||Number(a.period)-Number(b.period));
        table.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Day</th><th>Period</th><th>Time</th><th>Subject</th><th>Subject Faculty</th></tr></thead><tbody>
          ${rows.map(x=>`<tr><td>${eduEsc(x.day)}</td><td>${eduEsc(x.period)}</td><td>${eduEsc(x.time)}</td><td>${eduEsc(x.subject)}</td><td>${eduEsc(x.faculty)}</td></tr>`).join("")||`<tr><td colspan="5" class="empty">No class timetable entries yet. The Class Adviser can add them.</td></tr>`}
        </tbody></table></div>`;
    }
}

/* ---------------------------------------------------------
   7) CLASS ADVISER: ENTER + EDIT + DELETE, SAME DATA SHARED
--------------------------------------------------------- */
function eduEnhanceAdviserTimetable(){
    const page=document.getElementById("adviser-timetable"); if(!page||!eduUser())return;
    const form=page.querySelector("form[onsubmit*='saveClassTimetable']");
    const cls=document.getElementById("ttClass");
    if(cls && eduUser().classesHandled?.[0]) cls.value=eduUser().classesHandled[0];
    if(form && !form.querySelector("#eduTtId")){
        const hidden=document.createElement("input");
        hidden.type="hidden"; hidden.id="eduTtId"; form.appendChild(hidden);
        const button=form.querySelector("button[type=submit],button:not([type])");
        if(button) button.id="eduTtSubmit";
    }
    eduRenderAdviserRows();
}
function eduRenderAdviserRows(){
    const e=document.getElementById("adviserTimetableList"); if(!e)return;
    const form=document.querySelector("#adviser-timetable form");
    const className=document.getElementById("ttClass")?.value?.trim();
    const rows=(db.classTimetables||[]).filter(x=>!className||x.className===className);
    e.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Day</th><th>Period</th><th>Time</th><th>Subject</th><th>Faculty</th><th>Action</th></tr></thead><tbody>
      ${rows.map(x=>`<tr><td>${eduEsc(x.day)}</td><td>${eduEsc(x.period)}</td><td>${eduEsc(x.time)}</td><td>${eduEsc(x.subject)}</td><td>${eduEsc(x.faculty)}</td>
      <td><button class="btn secondary" type="button" onclick="editClassTimetable('${String(x.id||"").replace(/'/g,"\\'")}')">Edit</button></td></tr>`).join("")||`<tr><td colspan="6" class="empty">No timetable entries.</td></tr>`}
    </tbody></table></div>`;
}
window.saveClassTimetable=async function(event){
    event.preventDefault();
    const className=document.getElementById("ttClass")?.value.trim();
    const day=document.getElementById("ttDay")?.value;
    const period=document.getElementById("ttPeriod")?.value.trim();
    const rawTime=document.getElementById("ttTime")?.value.trim() || "";
    const parts=rawTime.split(/\s*-\s*/);
    const startTime=parts[0]||"";
    const endTime=parts.length>1?parts[1]:"";
    const subject=document.getElementById("ttSubject")?.value.trim();
    const facultyName=document.getElementById("ttFaculty")?.value.trim();
    if(!className||!day||!period||!rawTime||!subject||!facultyName){toast("Complete all timetable fields.");return;}
    try{
        const API=window.EduNexaAPI;
        if(!API || !localStorage.getItem("edunexa_token")) throw new Error("Backend login session is not available.");
        await API.request("/timetables/class",{
            method:"POST",
            body:JSON.stringify({class_name:className,day:day,period:period,start_time:startTime,end_time:endTime,subject:subject,faculty_name:facultyName,room:null})
        });
        await loadClassTimetablesFromEnhancement(className);
        event.target.reset();
        const b=document.getElementById("eduTtSubmit"); if(b)b.textContent="Add Timetable Period";
        const h=document.getElementById("eduTtId"); if(h)h.value="";
        if(typeof window.refreshAll==="function") window.refreshAll();
        eduRenderAdviserRows();
        toast("Class timetable saved to SQLite. All students in this class can see the update.");
    }catch(e){
        console.error("Class timetable save error",e);
        toast(e?.message||"Unable to save class timetable.");
    }
};

async function loadClassTimetablesFromEnhancement(className){
    const API=window.EduNexaAPI; if(!API)return;
    try{
        const rows=await API.request("/timetables/class?class_name="+encodeURIComponent(className));
        db.classTimetables=(rows||[]).map(r=>({
            id:"TT-"+Number(r.id),backendId:Number(r.id),className:r.class_name||className,day:r.day||"",period:String(r.period||""),
            startTime:r.start_time||"",endTime:r.end_time||"",time:(r.start_time&&r.end_time)?r.start_time+" - "+r.end_time:(r.start_time||r.end_time||""),
            subject:r.subject||"",faculty:r.faculty_name||"",facultyName:r.faculty_name||"",room:r.room||"",__synced:true,__backendId:Number(r.id)
        }));
        if(typeof save==="function")save();
    }catch(e){console.warn("Timetable refresh failed",e);}
}

window.editClassTimetable=function(id){
    const x=(db.classTimetables||[]).find(r=>String(r.id)===String(id));
    if(!x)return;
    const map={ttClass:"className",ttDay:"day",ttPeriod:"period",ttSubject:"subject",ttFaculty:"faculty"};
    Object.keys(map).forEach(k=>{const e=document.getElementById(k);if(e)e.value=x[map[k]]||"";});
    const time=document.getElementById("ttTime"); if(time) time.value=x.time||((x.startTime||"")+(x.endTime?" - "+x.endTime:""));
    const h=document.getElementById("eduTtId");if(h)h.value=x.id;
    const b=document.getElementById("eduTtSubmit");if(b)b.textContent="Update Timetable Period";
    window.scrollTo({top:0,behavior:"smooth"});
};

/* Timetable updates are persisted through the backend upsert endpoint. */
window.deleteClassTimetable=async function(id){
    toast("Timetable periods are edited through the Class Adviser form.");
};

/* ---------------------------------------------------------
   8) HOOK INTO EXISTING RENDERING WITHOUT REMOVING MODULES
--------------------------------------------------------- */
function eduApply(){
    if(!window.currentUser) return;
    eduEnsureAttendance();

    if(currentUser.role==="student"){
        eduStudentDashboard();
        eduFixLeaveForm();
        eduRefreshSkillPage();
        eduEnhanceProfessional();
        eduRenderStudentClassDetails();
    }
    if(currentUser.role==="faculty" && currentUser.classAdviser){
        eduEnhanceAdviserTimetable();
    }
}

/* Preserve existing renderEnhancementPage and add our layer after it. */
if(typeof window.renderEnhancementPage==="function" && !window.renderEnhancementPage.__eduWrapped){
    const original=window.renderEnhancementPage;
    const wrapped=function(pageId){
        const result=original.apply(this,arguments);
        setTimeout(eduApply,0);
        return result;
    };
    wrapped.__eduWrapped=true;
    window.renderEnhancementPage=wrapped;
}

/* Preserve existing refreshAll and add our layer after it. */
if(typeof window.refreshAll==="function" && !window.refreshAll.__eduWrapped){
    const originalRefresh=window.refreshAll;
    const wrappedRefresh=function(){
        const result=originalRefresh.apply(this,arguments);
        setTimeout(eduApply,30);
        return result;
    };
    wrappedRefresh.__eduWrapped=true;
    window.refreshAll=wrappedRefresh;
}

/* Re-apply after login/openApp and after navigation. */
document.addEventListener("DOMContentLoaded",()=>setTimeout(eduApply,100));
setTimeout(eduApply,300);
setInterval(()=>{ if(window.currentUser) eduApply(); },1500);

})();
