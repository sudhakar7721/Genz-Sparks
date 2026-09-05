/* =========================================================
   EDUNEXA ENHANCEMENTS - MODULAR FEATURES
   Keeps existing features and adds the requested Student,
   Faculty/Class Adviser, HOD and Management capabilities.
========================================================= */

function enhancementToday(){
    return new Date().toISOString().slice(0,10);
}

function readFileAsData(file, callback){
    if(!file){ callback(null); return; }
    const reader = new FileReader();
    reader.onload = () => callback({
        name:file.name,
        type:file.type || "application/octet-stream",
        size:file.size,
        data:reader.result,
        uploadedAt:new Date().toLocaleString()
    });
    reader.onerror = () => callback(null);
    reader.readAsDataURL(file);
}

function upsertUserData(arr, key, value){
    const i = arr.findIndex(x => x.studentId === currentUser.studentId);
    if(i >= 0) arr[i] = {...arr[i], ...value};
    else arr.push({studentId:currentUser.studentId, ...value});
}

function enhancementPages(){
return `
<!-- ================= STUDENT PROFESSIONAL RECORD ================= -->
<div class="page" id="student-professional">
  <div class="page-title"><h1>Certificates & Career Portfolio 🎓</h1>
    <p>Upload certificates, completed courses, internships and additional achievements.</p></div>
  <div class="grid2">
    <div class="card"><h3>Upload Certificate</h3>
      <form onsubmit="saveStudentCertificate(event)">
        <div class="form-grid">
          <div class="form-group"><label>Certificate / Course Name</label><input id="certName" class="control" required></div>
          <div class="form-group"><label>Issuing Organization</label><input id="certOrg" class="control" required></div>
          <div class="form-group"><label>Completion Date</label><input id="certDate" type="date" class="control"></div>
          <div class="form-group"><label>Certificate ID</label><input id="certId" class="control"></div>
          <div class="form-group full"><label>Certificate File</label><input id="certFile" type="file" class="control" accept=".pdf,.jpg,.jpeg,.png,.webp" required></div>
          <div class="full"><button class="btn primary">Upload Certificate</button></div>
        </div>
      </form>
    </div>
    <div class="card"><h3>Completed Course</h3>
      <form onsubmit="saveCompletedCourse(event)">
        <div class="form-grid">
          <div class="form-group"><label>Course Name</label><input id="courseName" class="control" required></div>
          <div class="form-group"><label>Provider</label><input id="courseProvider" class="control" required></div>
          <div class="form-group"><label>Duration</label><input id="courseDuration" class="control"></div>
          <div class="form-group"><label>Completion Date</label><input id="courseDate" type="date" class="control"></div>
          <div class="form-group full"><label>Course Certificate / Proof</label><input id="courseFile" type="file" class="control" accept=".pdf,.jpg,.jpeg,.png,.webp"></div>
          <div class="full"><button class="btn primary">Add Course</button></div>
        </div>
      </form>
    </div>
  </div>
  <div class="card"><h3>Internship Details</h3>
    <form onsubmit="saveInternship(event)">
      <div class="form-grid">
        <div class="form-group"><label>Company</label><input id="internCompany" class="control" required></div>
        <div class="form-group"><label>Role</label><input id="internRole" class="control" required></div>
        <div class="form-group"><label>Start Date</label><input id="internStart" type="date" class="control" required></div>
        <div class="form-group"><label>End Date</label><input id="internEnd" type="date" class="control"></div>
        <div class="form-group"><label>Mode</label><select id="internMode" class="control"><option>On-site</option><option>Remote</option><option>Hybrid</option></select></div>
        <div class="form-group"><label>Stipend</label><input id="internStipend" class="control"></div>
        <div class="form-group full"><label>Internship Certificate</label><input id="internFile" type="file" class="control" accept=".pdf,.jpg,.jpeg,.png,.webp"></div>
        <div class="form-group full"><label>Description</label><textarea id="internDesc" class="control" rows="3"></textarea></div>
        <div class="full"><button class="btn primary">Save Internship</button></div>
      </div>
    </form>
  </div>
  <div class="card"><h3>Additional Student Details</h3>
    <form onsubmit="saveAdditionalStudentDetails(event)">
      <textarea id="studentAdditional" class="control" rows="5" placeholder="Achievements, competitions, clubs, publications, skills, awards, etc."></textarea>
      <button class="btn primary" style="margin-top:10px">Save Details</button>
    </form>
  </div>
  <div class="card"><h3>My Professional Records</h3><div id="professionalRecords"></div></div>
</div>

<!-- ================= STUDENT TIMETABLE ================= -->
<div class="page" id="student-timetable">
  <div class="page-title"><h1>Class Timetable 🕐</h1><p>View your class schedule and subject faculty.</p></div>
  <div class="card"><div id="studentTimetable"></div></div>
</div>

<!-- ================= STUDENT COMMITTEE ================= -->
<div class="page" id="student-committee">
  <div class="page-title"><h1>Class Committee Meeting 👥</h1>
    <p>Submit subject-wise or general feedback to your Class Adviser and HOD.</p></div>
  <div class="card">
    <form onsubmit="submitCommitteeFeedback(event)">
      <div class="form-grid">
        <div class="form-group"><label>Feedback Type</label>
          <select id="committeeType" class="control" onchange="toggleCommitteeSubject()" required>
            <option value="subject">Subject-wise Feedback</option>
            <option value="general">Without Subject / General Feedback</option>
          </select>
        </div>
        <div class="form-group" id="committeeSubjectWrap"><label>Subject</label><select id="committeeSubject" class="control"><option>Python</option><option>SQL</option><option>Power BI</option><option>Excel</option><option>Statistics</option></select></div>
        <div class="form-group"><label>Rating</label><select id="committeeRating" class="control"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></div>
        <div class="form-group full"><label>Feedback</label><textarea id="committeeMessage" class="control" rows="5" required></textarea></div>
        <div class="full"><button class="btn primary">Send to Class Adviser + HOD</button></div>
      </div>
    </form>
  </div>
  <div class="card"><h3>My Committee Feedback</h3><div id="committeeHistory"></div></div>
</div>

<!-- ================= STUDENT LEAVE REQUEST TABLE ================= -->
<div class="page" id="student-leave-requests">
  <div class="page-title"><h1>My Leave Requests 📋</h1><p>Complete table view of your leave history and status.</p></div>
  <div class="card"><div class="table-wrap"><table><thead><tr><th>Date</th><th>Type</th><th>Period</th><th>Hours</th><th>Reason</th><th>Status</th><th>Reviewed By</th></tr></thead><tbody id="leaveRequestTable"></tbody></table></div></div>
</div>

<!-- ================= FACULTY STUDENT MANAGEMENT ================= -->
<div class="page" id="faculty-student-management">
  <div class="page-title"><h1>Student Management / Student Record 👨‍🎓</h1><p>Enter and maintain complete student academic and personal records.</p></div>
  <div class="card">
    <form onsubmit="saveStudentRecord(event)">
      <div class="form-grid">
        <div class="form-group"><label>Student ID</label><input id="srStudentId" class="control" required></div>
        <div class="form-group"><label>Full Name</label><input id="srName" class="control" required></div>
        <div class="form-group"><label>Age</label><input id="srAge" type="number" class="control"></div>
        <div class="form-group"><label>Sex</label><select id="srSex" class="control"><option>Male</option><option>Female</option><option>Other</option></select></div>
        <div class="form-group"><label>Caste</label><input id="srCaste" class="control"></div>
        <div class="form-group"><label>Region</label><input id="srRegion" class="control"></div>
        <div class="form-group full"><label>Address</label><textarea id="srAddress" class="control"></textarea></div>
        <div class="form-group"><label>Father Name</label><input id="srFather" class="control"></div>
        <div class="form-group"><label>Mother Name</label><input id="srMother" class="control"></div>
        <div class="form-group"><label>Guardian Name</label><input id="srGuardian" class="control"></div>
        <div class="form-group"><label>Student Contact</label><input id="srContact" class="control"></div>
        <div class="form-group"><label>Student Email</label><input id="srEmail" type="email" class="control"></div>
        <div class="form-group"><label>Father/Mother Contact</label><input id="srParentContact" class="control"></div>
        <div class="form-group"><label>Blood Group</label><input id="srBlood" class="control"></div>
        <div class="form-group"><label>School Name</label><input id="srSchool" class="control"></div>
        <div class="form-group"><label>10th Mark / %</label><input id="sr10" type="number" step="0.01" class="control"></div>
        <div class="form-group"><label>12th Mark / %</label><input id="sr12" type="number" step="0.01" class="control"></div>
        <div class="form-group"><label>Department</label><input id="srDepartment" class="control"></div>
        <div class="form-group"><label>Class</label><input id="srClass" class="control"></div>
        <div class="form-group full"><label>Additional Details</label><textarea id="srExtra" class="control" rows="4"></textarea></div>
        <div class="full"><button class="btn primary">Save Student Record</button></div>
      </div>
    </form>
  </div>
  <div class="card"><h3>Student Records</h3><div id="facultyStudentRecords"></div></div>
</div>

<!-- ================= CLASS ADVISER TIMETABLE ================= -->
<div class="page" id="adviser-timetable">
  <div class="page-title"><h1>Class Timetable Manager 🕐</h1><p>Class Adviser can enter periods and subject faculty names.</p></div>
  <div class="card"><form onsubmit="saveClassTimetable(event)">
    <div class="form-grid">
      <div class="form-group"><label>Class</label><input id="ttClass" class="control" value="II B.Sc Data Analytics" required></div>
      <div class="form-group"><label>Day</label><select id="ttDay" class="control"><option>Monday</option><option>Tuesday</option><option>Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option></select></div>
      <div class="form-group"><label>Period</label><input id="ttPeriod" class="control" placeholder="1" required></div>
      <div class="form-group"><label>Time</label><input id="ttTime" class="control" placeholder="09:00 - 09:50" required></div>
      <div class="form-group"><label>Subject</label><input id="ttSubject" class="control" required></div>
      <div class="form-group"><label>Subject Faculty</label><input id="ttFaculty" class="control" required></div>
      <div class="full"><button class="btn primary">Add Timetable Period</button></div>
    </div>
  </form></div>
  <div class="card"><h3>Current Class Timetable</h3><div id="adviserTimetableList"></div></div>
</div>

<!-- ================= FACULTY MARK REQUESTS ================= -->
<div class="page" id="adviser-mark-requests">
  <div class="page-title"><h1>Mark Change Request ⏳</h1><p>If the permitted mark-edit period has ended, submit the correction to HOD.</p></div>
  <div class="card"><p><b>Current mark-edit period:</b> <span id="markPeriodStatus"></span></p>
    <div id="facultyMarkRequestList"></div></div>
</div>

<!-- ================= HOD ================= -->
<div class="page" id="hod-dashboard"><div class="page-title"><h1>HOD Dashboard 🏛️</h1><p>Department-level academic, faculty, student and approval controls.</p></div>
  <div class="stats">${stat("Faculty", "—", "Department faculty")}${stat("Students","—","Department students")}${stat("Pending Requests","—","Mark approvals")}${stat("Feedback","—","Committee feedback")}</div>
  <div class="grid3"><button class="card" onclick="go('hod-students')"><h3>👨‍🎓 Student Records</h3><p class="muted">View complete student records.</p></button><button class="card" onclick="go('hod-mark-requests')"><h3>🎯 Mark Requests</h3><p class="muted">Approve or reject expired-period corrections.</p></button><button class="card" onclick="go('hod-class-details')"><h3>🏫 Class Details</h3><p class="muted">Timetables and class information.</p></button></div>
</div>
<div class="page" id="hod-faculty"><div class="page-title"><h1>HOD Faculty Details 👨‍🏫</h1><p>Faculty, positions, subjects and adviser assignments.</p></div><div class="card"><div id="hodFacultyList"></div></div></div>
<div class="page" id="hod-students"><div class="page-title"><h1>HOD Student Records 👨‍🎓</h1><p>Department student records.</p></div><div class="card"><div id="hodStudentList"></div></div></div>
<div class="page" id="hod-mark-requests"><div class="page-title"><h1>HOD Mark Change Requests 🎯</h1><p>Review requests after the mark-edit period ends.</p></div><div class="card"><div id="hodMarkRequests"></div></div></div>
<div class="page" id="hod-class-details"><div class="page-title"><h1>Class Details 🏫</h1><p>Every class timetable and adviser information.</p></div><div class="card"><div id="hodClassDetails"></div></div></div>
<div class="page" id="hod-timetable"><div class="page-title"><h1>Class Timetables 🕐</h1><p>Department-wide class schedules.</p></div><div class="card"><div id="hodTimetables"></div></div></div>
<div class="page" id="hod-faculty-timetable"><div class="page-title"><h1>Faculty Timetable 📅</h1><p>Faculty teaching schedule.</p></div><div class="card"><div id="hodFacultyTimetable"></div></div></div>
<div class="page" id="hod-faculty-attendance"><div class="page-title"><h1>Faculty Attendance 🧾</h1><p>Faculty attendance records.</p></div><div class="card"><div id="hodFacultyAttendance"></div></div></div>
<div class="page" id="hod-extra"><div class="page-title"><h1>HOD Extra Details ⚙️</h1></div><div class="card"><form onsubmit="saveHodExtra(event)"><textarea id="hodExtraText" class="control" rows="6" placeholder="Department plans, meetings, academic targets, accreditation notes, etc."></textarea><button class="btn primary" style="margin-top:10px">Save</button></form><div id="hodExtraView" style="margin-top:15px"></div></div></div>
<div class="page" id="hod-feedback"><div class="page-title"><h1>Class Committee Feedback 💬</h1><p>Subject-wise and general feedback sent by students.</p></div><div class="card"><div id="hodFeedbackList"></div></div></div>

<!-- ================= MANAGEMENT EXTRA ================= -->
<div class="page" id="management-hod"><div class="page-title"><h1>HOD Details 🏛️</h1><p>HOD information across departments.</p></div><div class="card"><div id="managementHodList"></div></div></div>
<div class="page" id="management-departments"><div class="page-title"><h1>Department Details 🏫</h1><p>Institution-wide department, HOD, class and faculty information.</p></div><div class="card"><div id="managementDepartmentList"></div></div></div>
<div class="page" id="management-extra"><div class="page-title"><h1>Management Extra Details ⚙️</h1><p>Institution-level additional information.</p></div><div class="card"><form onsubmit="saveManagementExtra(event)"><div class="form-grid">
<div class="form-group"><label>Principal</label><input id="mgPrincipal" class="control"></div><div class="form-group"><label>Academic Director</label><input id="mgDirector" class="control"></div><div class="form-group"><label>Academic Year</label><input id="mgYear" class="control" value="2026-2027"></div><div class="form-group"><label>Accreditation</label><input id="mgAccreditation" class="control"></div><div class="form-group"><label>Institution Status</label><input id="mgStatus" class="control"></div><div class="form-group"><label>Management Contact</label><input id="mgContact" class="control"></div><div class="form-group full"><label>Additional Details</label><textarea id="mgExtra" class="control" rows="5"></textarea></div><div class="full"><button class="btn primary">Save Institution Details</button></div></div></form><div id="managementExtraView" style="margin-top:15px"></div></div></div>
`;
}

/* ---------- Student records / professional portfolio ---------- */

function saveStudentCertificate(event){
 event.preventDefault();
 const file=document.getElementById("certFile").files[0];
 readFileAsData(file, data=>{
   db.certificates.push({id:"CERT-"+Date.now(),studentId:currentUser.studentId,name:document.getElementById("certName").value.trim(),organization:document.getElementById("certOrg").value.trim(),date:document.getElementById("certDate").value,idNumber:document.getElementById("certId").value.trim(),file:data});
   save(); event.target.reset(); renderProfessionalRecords(); toast("Certificate uploaded.");
 });
}
function saveCompletedCourse(event){
 event.preventDefault();
 const file=document.getElementById("courseFile").files[0];
 readFileAsData(file,data=>{
   db.completedCourses.push({id:"COURSE-"+Date.now(),studentId:currentUser.studentId,name:document.getElementById("courseName").value.trim(),provider:document.getElementById("courseProvider").value.trim(),duration:document.getElementById("courseDuration").value.trim(),date:document.getElementById("courseDate").value,file:data});
   save(); event.target.reset(); renderProfessionalRecords(); toast("Course added.");
 });
}
function saveInternship(event){
 event.preventDefault();
 const file=document.getElementById("internFile").files[0];
 readFileAsData(file,data=>{
   db.internships.push({id:"INT-"+Date.now(),studentId:currentUser.studentId,company:document.getElementById("internCompany").value.trim(),role:document.getElementById("internRole").value.trim(),start:document.getElementById("internStart").value,end:document.getElementById("internEnd").value,mode:document.getElementById("internMode").value,stipend:document.getElementById("internStipend").value.trim(),description:document.getElementById("internDesc").value.trim(),file:data});
   save(); event.target.reset(); renderProfessionalRecords(); toast("Internship saved.");
 });
}
function saveAdditionalStudentDetails(event){
 event.preventDefault();
 currentUser.additionalDetails=document.getElementById("studentAdditional").value.trim();
 const u=db.users.find(x=>x.email===currentUser.email); if(u) u.additionalDetails=currentUser.additionalDetails;
 save(); toast("Additional details saved.");
}
function renderProfessionalRecords(){
 const e=document.getElementById("professionalRecords"); if(!e)return;
 const sid=currentUser.studentId;
 const c=db.certificates.filter(x=>x.studentId===sid), co=db.completedCourses.filter(x=>x.studentId===sid), i=db.internships.filter(x=>x.studentId===sid);
 e.innerHTML=`<div class="grid3"><div class="item"><b>${c.length}</b><p>Certificates</p></div><div class="item"><b>${co.length}</b><p>Completed Courses</p></div><div class="item"><b>${i.length}</b><p>Internships</p></div></div>
 ${c.map(x=>`<div class="item"><b>Certificate: ${esc(x.name)}</b><p>${esc(x.organization)} • ${esc(x.date||"-")}</p><small>${x.file?esc(x.file.name):"No file"}</small></div>`).join("")}
 ${co.map(x=>`<div class="item"><b>Course: ${esc(x.name)}</b><p>${esc(x.provider)} • ${esc(x.duration||"-")} • ${esc(x.date||"-")}</p></div>`).join("")}
 ${i.map(x=>`<div class="item"><b>Internship: ${esc(x.company)}</b><p>${esc(x.role)} • ${esc(x.start)} → ${esc(x.end||"-")} • ${esc(x.mode)}</p></div>`).join("")}`;
}

/* ---------- Timetable ---------- */
function seedEnhancementData(){
 if(!db.classTimetables.length){
  db.classTimetables=[
   {className:"II B.Sc Data Analytics",day:"Monday",period:"1",time:"09:00 - 09:50",subject:"Python",faculty:"Dr. Priya"},
   {className:"II B.Sc Data Analytics",day:"Monday",period:"2",time:"09:50 - 10:40",subject:"SQL",faculty:"Dr. Priya"},
   {className:"II B.Sc Data Analytics",day:"Tuesday",period:"1",time:"09:00 - 09:50",subject:"Statistics",faculty:"Dr. Arun"},
   {className:"II B.Sc Data Analytics",day:"Tuesday",period:"2",time:"09:50 - 10:40",subject:"Power BI",faculty:"Ms. Nivetha"},
   {className:"II B.Sc Data Analytics",day:"Wednesday",period:"1",time:"09:00 - 09:50",subject:"Excel",faculty:"Ms. Kavitha"}
  ];
 }
 if(!db.departments.length){
  db.departments=[
   {name:"Data Analytics",hod:"Dr. HOD Admin",classes:["I B.Sc Data Analytics","II B.Sc Data Analytics","III B.Sc Data Analytics"],facultyCount:8},
   {name:"Computer Science",hod:"Dr. Kumar",classes:["I B.Sc Computer Science","II B.Sc Computer Science","III B.Sc Computer Science"],facultyCount:14},
   {name:"Information Technology",hod:"Dr. Meena",classes:["I B.Sc Information Technology","II B.Sc Information Technology","III B.Sc Information Technology"],facultyCount:12},
   {name:"Artificial Intelligence & Data Science",hod:"Dr. Ravi",classes:["I B.Sc AI & Data Science","II B.Sc AI & Data Science","III B.Sc AI & Data Science"],facultyCount:10}
  ];
 }
 if(!db.markEditPeriodEnd) db.markEditPeriodEnd="2026-09-30";
 if(!db.managementExtra || !Object.keys(db.managementExtra).length) db.managementExtra={principal:"",director:"",year:"2026-2027",accreditation:"",status:"Active",contact:"",extra:""};
 save();
}
seedEnhancementData();

function saveClassTimetable(event){
 event.preventDefault();
 db.classTimetables.push({className:document.getElementById("ttClass").value.trim(),day:document.getElementById("ttDay").value,period:document.getElementById("ttPeriod").value.trim(),time:document.getElementById("ttTime").value.trim(),subject:document.getElementById("ttSubject").value.trim(),faculty:document.getElementById("ttFaculty").value.trim()});
 save(); event.target.reset(); renderEnhancementPage("adviser-timetable"); toast("Timetable period added.");
}
function renderTimetable(targetId,className){
 const e=document.getElementById(targetId); if(!e)return;
 const rows=db.classTimetables.filter(x=>!className||x.className===className).sort((a,b)=>a.day.localeCompare(b.day)||Number(a.period)-Number(b.period));
 e.innerHTML=`<div class="table-wrap"><table><thead><tr><th>Class</th><th>Day</th><th>Period</th><th>Time</th><th>Subject</th><th>Faculty</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.className)}</td><td>${esc(x.day)}</td><td>${esc(x.period)}</td><td>${esc(x.time)}</td><td>${esc(x.subject)}</td><td>${esc(x.faculty)}</td></tr>`).join("")||`<tr><td colspan="6" class="empty">No timetable entries.</td></tr>`}</tbody></table></div>`;
}

/* ---------- Committee feedback ---------- */
function toggleCommitteeSubject(){
 const general=document.getElementById("committeeType")?.value==="general";
 const wrap=document.getElementById("committeeSubjectWrap"); if(wrap)wrap.style.display=general?"none":"block";
}
function submitCommitteeFeedback(event){
 event.preventDefault();
 const type=document.getElementById("committeeType").value;
 const f={id:"CMF-"+Date.now(),studentId:currentUser.studentId,studentName:currentUser.name,department:currentUser.department||"",className:"II B.Sc Data Analytics",type,subject:type==="subject"?document.getElementById("committeeSubject").value:"General",rating:Number(document.getElementById("committeeRating").value),message:document.getElementById("committeeMessage").value.trim(),status:"Submitted",createdAt:new Date().toLocaleString()};
 db.classMeetings.push(f);
 addNotice("Class Committee Feedback",`${currentUser.name} submitted ${type==="subject"?"subject-wise":"general"} feedback.`,`adviser`);
 addNotice("Class Committee Feedback",`${currentUser.name} submitted committee feedback for review.`,`hod`);
 save(); event.target.reset(); renderCommitteeHistory(); toast("Feedback sent to Class Adviser and HOD.");
}
function renderCommitteeHistory(){
 const e=document.getElementById("committeeHistory"); if(!e)return;
 const rows=db.classMeetings.filter(x=>x.studentId===currentUser.studentId);
 e.innerHTML=rows.map(x=>`<div class="item"><div class="item-top"><b>${esc(x.subject)}</b><span class="badge blue">${esc(x.status)}</span></div><p>Rating: ${x.rating}/5 • ${esc(x.createdAt)}</p><p>${esc(x.message)}</p></div>`).join("")||`<div class="empty">No committee feedback submitted.</div>`;
}
function renderHodFeedback(){
 const e=document.getElementById("hodFeedbackList");if(!e)return;
 e.innerHTML=db.classMeetings.map(x=>`<div class="item"><div class="item-top"><b>${esc(x.studentName)} • ${esc(x.subject)}</b><span class="badge blue">${esc(x.status)}</span></div><p>${esc(x.message)}</p><small>${esc(x.createdAt)}</small></div>`).join("")||`<div class="empty">No committee feedback.</div>`;
}

/* ---------- Leave half-day + table ---------- */
function enhanceLeaveForm(){
 const form=document.querySelector('#student-leave form'); if(!form||document.getElementById("leaveHours"))return;
 const type=document.getElementById("leaveType");
 const wrap=document.createElement("div"); wrap.className="form-group";
 wrap.innerHTML='<label>Leave Duration</label><select id="leaveDuration" class="control" onchange="toggleLeaveHours()"><option value="full">Full Day</option><option value="half">Half Day</option></select>';
 const first=form.querySelector(".form-grid"); if(first) first.insertBefore(wrap,first.children[1]||null);
 const hours=document.createElement("div"); hours.className="form-group"; hours.id="leaveHoursWrap"; hours.style.display="none"; hours.innerHTML='<label>Hours (Half Day — maximum 6 hours)</label><input id="leaveHours" type="number" min="1" max="6" step="1" class="control" value="6">';
 if(first) first.insertBefore(hours,first.children[2]||null);
}
function toggleLeaveHours(){
 const half=document.getElementById("leaveDuration")?.value==="half";
 const wrap=document.getElementById("leaveHoursWrap"); if(wrap)wrap.style.display=half?"block":"none";
}
function renderLeaveRequestTable(){
 const e=document.getElementById("leaveRequestTable");if(!e||!currentUser)return;
 const rows=db.leaves.filter(x=>x.studentId===currentUser.studentId);
 e.innerHTML=rows.map(x=>`<tr><td>${esc(x.from||"-")}</td><td>${esc(x.type)}</td><td>${esc(x.durationType||"Full Day")}</td><td>${esc(x.hours||"6+")}</td><td>${esc(x.reason)}</td><td><span class="badge ${x.status==="Approved"?"green":x.status==="Rejected"?"red":"yellow"}">${esc(x.status)}</span></td><td>${esc(x.reviewedBy||"-")}</td></tr>`).join("")||`<tr><td colspan="7" class="empty">No leave requests.</td></tr>`;
}

/* ---------- Student records ---------- */
function saveStudentRecord(event){
 event.preventDefault();
 const id=document.getElementById("srStudentId").value.trim();
 const record={studentId:id,name:document.getElementById("srName").value.trim(),age:document.getElementById("srAge").value,sex:document.getElementById("srSex").value,caste:document.getElementById("srCaste").value.trim(),region:document.getElementById("srRegion").value.trim(),address:document.getElementById("srAddress").value.trim(),fatherName:document.getElementById("srFather").value.trim(),motherName:document.getElementById("srMother").value.trim(),guardianName:document.getElementById("srGuardian").value.trim(),studentContact:document.getElementById("srContact").value.trim(),email:document.getElementById("srEmail").value.trim(),parentContact:document.getElementById("srParentContact").value.trim(),bloodGroup:document.getElementById("srBlood").value.trim(),school:document.getElementById("srSchool").value.trim(),mark10:document.getElementById("sr10").value,mark12:document.getElementById("sr12").value,department:document.getElementById("srDepartment").value.trim(),className:document.getElementById("srClass").value.trim(),extra:document.getElementById("srExtra").value.trim(),updatedBy:currentUser.name,updatedAt:new Date().toLocaleString()};
 const i=db.studentProfiles.findIndex(x=>x.studentId===id); if(i>=0)db.studentProfiles[i]=record;else db.studentProfiles.push(record);
 save(); event.target.reset(); renderStudentRecords(); toast("Student record saved.");
}
function renderStudentRecords(){
 const e=document.getElementById("facultyStudentRecords");if(!e)return;
 e.innerHTML=db.studentProfiles.map(x=>`<div class="item"><div class="item-top"><b>${esc(x.name)} (${esc(x.studentId)})</b><span class="badge blue">${esc(x.className||"-")}</span></div><p>${esc(x.department||"-")} • Age ${esc(x.age||"-")} • ${esc(x.sex||"-")} • Blood ${esc(x.bloodGroup||"-")}</p><p>Father: ${esc(x.fatherName||"-")} • Mother: ${esc(x.motherName||"-")} • Guardian: ${esc(x.guardianName||"-")}</p><p>10th: ${esc(x.mark10||"-")} • 12th: ${esc(x.mark12||"-")} • School: ${esc(x.school||"-")}</p></div>`).join("")||`<div class="empty">No student records.</div>`;
}

/* ---------- Mark change period / HOD approval ---------- */
function markPeriodExpired(){ return new Date() > new Date((db.markEditPeriodEnd||enhancementToday())+"T23:59:59"); }
function requestMarkChange(studentId, values){
 const existing=db.markChangeRequests.find(x=>x.studentId===studentId&&x.facultyId===currentUser.facultyId&&x.status==="Pending");
 if(existing){toast("A pending request already exists.");return;}
 const r={id:"MCR-"+Date.now(),studentId,facultyId:currentUser.facultyId||currentUser.email,facultyName:currentUser.name,department:currentUser.department||"",requested:{ca1:values.ca1,ca2:values.ca2,model:values.model},requestedAt:new Date().toLocaleString(),periodEnd:db.markEditPeriodEnd,status:"Pending"};
 db.markChangeRequests.push(r); addNotice("Mark change request",`${currentUser.name} requested mark correction for ${studentId}.`,"hod"); save(); renderFacultyMarkRequests(); toast("Request sent to HOD.");
}
function renderFacultyMarkRequests(){
 const e=document.getElementById("facultyMarkRequestList");if(!e)return;
 const rows=db.markChangeRequests.filter(x=>x.facultyId===currentUser.facultyId||x.facultyId===currentUser.email);
 e.innerHTML=rows.map(x=>`<div class="item"><div class="item-top"><b>${esc(x.studentId)}</b><span class="badge ${x.status==="Approved"?"green":x.status==="Rejected"?"red":"yellow"}">${esc(x.status)}</span></div><p>Requested: CA1 ${x.requested.ca1}, CA2 ${x.requested.ca2}, Model ${x.requested.model}</p><p>Period ended: ${esc(x.periodEnd)} • ${esc(x.requestedAt)}</p></div>`).join("")||`<div class="empty">No mark change requests.</div>`;
 const s=document.getElementById("markPeriodStatus");if(s)s.textContent=markPeriodExpired()?`Expired on ${db.markEditPeriodEnd} — HOD approval required.`:`Open until ${db.markEditPeriodEnd}.`;
}
function renderHodMarkRequests(){
 const e=document.getElementById("hodMarkRequests");if(!e)return;
 e.innerHTML=db.markChangeRequests.map(x=>`<div class="item"><div class="item-top"><b>${esc(x.studentId)} • ${esc(x.facultyName)}</b><span class="badge ${x.status==="Approved"?"green":x.status==="Rejected"?"red":"yellow"}">${esc(x.status)}</span></div><p>CA1 ${x.requested.ca1} • CA2 ${x.requested.ca2} • Model ${x.requested.model}</p><p>Period: ${esc(x.periodEnd)} • ${esc(x.requestedAt)}</p>${x.status==="Pending"?`<div class="actions"><button class="btn success" onclick="reviewMarkRequest('${esc(x.id)}','Approved')">Approve</button><button class="btn danger" onclick="reviewMarkRequest('${esc(x.id)}','Rejected')">Reject</button></div>`:""}</div>`).join("")||`<div class="empty">No requests.</div>`;
}
function reviewMarkRequest(id,status){
 const r=db.markChangeRequests.find(x=>x.id===id);if(!r)return;
 r.status=status;r.reviewedBy=currentUser.name;r.reviewedAt=new Date().toLocaleString();
 if(status==="Approved"){r.approvedUntil=new Date(Date.now()+24*60*60*1000).toISOString();addNotice("Mark change approved",`HOD approved the mark correction for ${r.studentId}. Faculty can edit for 24 hours.`,r.facultyId);}
 else addNotice("Mark change rejected",`HOD rejected the mark correction for ${r.studentId}.`,r.facultyId);
 save();renderHodMarkRequests();toast(`Request ${status.toLowerCase()}.`);
}

/* ---------- HOD / Management ---------- */
function renderHodData(){
 const dept=currentUser.department||"";
 const fac=db.users.filter(x=>x.role==="faculty"&&(!dept||x.department===dept));
 const students=db.users.filter(x=>x.role==="student"&&(!dept||x.department===dept));
 const f=document.getElementById("hodFacultyList");if(f)f.innerHTML=fac.map(x=>`<div class="item"><b>${esc(x.name)}</b><p>${esc(x.facultyId||"-")} • ${esc(x.position||x.designation||"Faculty")} • Adviser: ${x.classAdviser?"Yes":"No"} • Mentor: ${x.mentor?"Yes":"No"}</p><p>${esc((x.classesHandled||[]).join(", "))} • Subjects: ${esc((x.basicSubjects||[]).join(", "))}</p></div>`).join("")||`<div class="empty">No faculty records.</div>`;
 const s=document.getElementById("hodStudentList");if(s)s.innerHTML=students.map(x=>{const r=db.studentProfiles.find(y=>y.studentId===x.studentId);return `<div class="item"><b>${esc(x.name)} (${esc(x.studentId)})</b><p>${esc(x.department||"-")} • ${esc(x.batch||"-")} • Attendance ${esc(x.attendance||0)}%</p>${r?`<p>Father: ${esc(r.fatherName||"-")} • Mother: ${esc(r.motherName||"-")} • School: ${esc(r.school||"-")}</p>`:""}</div>`}).join("")||`<div class="empty">No students.</div>`;
 const c=document.getElementById("hodClassDetails");if(c)c.innerHTML=(db.departments||[]).filter(x=>!dept||x.name===dept).map(x=>`<div class="item"><b>${esc(x.name)}</b><p>HOD: ${esc(x.hod)} • Faculty: ${esc(x.facultyCount)}</p><p>Classes: ${esc(x.classes.join(", "))}</p></div>`).join("");
 renderTimetable("hodTimetables");
 const ft=document.getElementById("hodFacultyTimetable");if(ft)ft.innerHTML=db.facultyTimetables.map(x=>`<div class="item"><b>${esc(x.facultyName||"-")}</b><p>${esc(x.day||"-")} • ${esc(x.time||"-")} • ${esc(x.subject||"-")} • ${esc(x.className||"-")}</p></div>`).join("")||`<div class="empty">Faculty timetable not entered yet.</div>`;
 const fa=document.getElementById("hodFacultyAttendance");if(fa)fa.innerHTML=db.facultyAttendance.map(x=>`<div class="item"><b>${esc(x.facultyName||"-")}</b><p>${esc(x.date||"-")} • ${esc(x.status||"-")} • ${esc(x.remarks||"")}</p></div>`).join("")||`<div class="empty">Faculty attendance not entered yet.</div>`;
 const he=document.getElementById("hodExtraView");if(he)he.innerHTML=currentUser.hodExtra?`<div class="notice">${esc(currentUser.hodExtra)}</div>`:"";
}
function saveHodExtra(event){event.preventDefault();currentUser.hodExtra=document.getElementById("hodExtraText").value.trim();const u=db.users.find(x=>x.email===currentUser.email);if(u)u.hodExtra=currentUser.hodExtra;save();renderHodData();toast("HOD extra details saved.");}
function renderManagementEnhancements(){
 const h=document.getElementById("managementHodList");if(h)h.innerHTML=db.users.filter(x=>x.role==="hod").map(x=>`<div class="item"><b>${esc(x.name)}</b><p>${esc(x.hodId||"-")} • ${esc(x.department||"-")} • ${esc(x.designation||"HOD")} • ${esc(x.phone||"-")}</p></div>`).join("")||`<div class="empty">No HOD details.</div>`;
 const d=document.getElementById("managementDepartmentList");if(d)d.innerHTML=db.departments.map(x=>`<div class="item"><div class="item-top"><b>${esc(x.name)}</b><span class="badge blue">${esc(x.facultyCount)} Faculty</span></div><p>HOD: ${esc(x.hod)}</p><p>${esc(x.classes.join(" • "))}</p></div>`).join("");
 const e=document.getElementById("managementExtraView");if(e){const x=db.managementExtra;e.innerHTML=`<div class="item"><p>Principal: ${esc(x.principal||"-")} • Academic Director: ${esc(x.director||"-")}</p><p>Year: ${esc(x.year||"-")} • Accreditation: ${esc(x.accreditation||"-")} • Status: ${esc(x.status||"-")}</p><p>Contact: ${esc(x.contact||"-")}</p><p>${esc(x.extra||"")}</p></div>`;}
}
function saveManagementExtra(event){event.preventDefault();db.managementExtra={principal:document.getElementById("mgPrincipal").value.trim(),director:document.getElementById("mgDirector").value.trim(),year:document.getElementById("mgYear").value.trim(),accreditation:document.getElementById("mgAccreditation").value.trim(),status:document.getElementById("mgStatus").value.trim(),contact:document.getElementById("mgContact").value.trim(),extra:document.getElementById("mgExtra").value.trim()};save();renderManagementEnhancements();toast("Management details saved.");}

/* ---------- Rendering hooks ---------- */
function renderEnhancementPage(pageId){
 if(pageId==="student-professional")renderProfessionalRecords();
 if(pageId==="student-timetable")renderTimetable("studentTimetable",currentUser.className||"II B.Sc Data Analytics");
 if(pageId==="student-committee"){renderCommitteeHistory();toggleCommitteeSubject();}
 if(pageId==="student-leave-requests")renderLeaveRequestTable();
 if(pageId==="faculty-student-management")renderStudentRecords();
 if(pageId==="adviser-timetable")renderTimetable("adviserTimetableList");
 if(pageId==="adviser-mark-requests")renderFacultyMarkRequests();
 if(pageId.startsWith("hod-")){renderHodData();renderHodMarkRequests();renderHodFeedback();}
 if(pageId.startsWith("management-"))renderManagementEnhancements();
}
function refreshEnhancements(){
 if(currentUser?.role==="student"){
   enhanceLeaveForm(); renderLeaveRequestTable(); renderCommitteeHistory();
 }
 if(currentUser?.role==="faculty"){renderStudentRecords();renderFacultyMarkRequests();}
 if(currentUser?.role==="hod"){renderHodData();renderHodMarkRequests();renderHodFeedback();}
 if(currentUser?.role==="management"){renderManagementEnhancements();}
}

/* ---------- Faculty assessment question/reference file upload ---------- */
function injectFacultyAssessmentUploads(){
 const tf=document.querySelector('form[onsubmit="createTest(event)"]');
 if(tf&&!document.getElementById("facultyTestFile")){
  const div=document.createElement("div");div.className="form-group full";div.innerHTML='<label>Question File (PDF / DOC / DOCX / XLS / XLSX)</label><input id="facultyTestFile" type="file" class="control" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt">';
  const grid=tf.querySelector(".form-grid");if(grid)grid.appendChild(div);
 }
 const af=document.querySelector('form[onsubmit="createAssignment(event)"]');
 if(af&&!document.getElementById("facultyAssignmentFile")){
  const div=document.createElement("div");div.className="form-group full";div.innerHTML='<label>Question / Reference File</label><input id="facultyAssignmentFile" type="file" class="control" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt">';
  const grid=af.querySelector(".form-grid");if(grid)grid.appendChild(div);
 }
}
(function wrapFacultyAssessmentCreators(){
 const oldTest=window.createTest, oldAssignment=window.createAssignment;
 if(typeof oldTest==="function"){
  window.createTest=function(event){const file=document.getElementById("facultyTestFile")?.files[0];oldTest(event);if(file){const latest=db.tests[db.tests.length-1];readFileAsData(file,data=>{if(latest){latest.questionFile=data;save();}});}};
 }
 if(typeof oldAssignment==="function"){
  window.createAssignment=function(event){const file=document.getElementById("facultyAssignmentFile")?.files[0];oldAssignment(event);if(file){const latest=db.assignments[db.assignments.length-1];readFileAsData(file,data=>{if(latest){latest.questionFile=data;save();}});}};
 }
})();

/* ---------- Wrap existing test submission to add file ---------- */
(function wrapStudentTestSubmit(){
 const old=window.submitTest;
 if(typeof old!=="function")return;
 window.submitTest=function(event,id){
   const file=document.getElementById("studentTestFile")?.files[0];
   window.__studentTestFile=file;
   old(event,id);
   if(window.__studentTestFile){
     const sub=db.submissions.find(x=>x.type==="test"&&x.itemId===id&&x.studentId===currentUser.studentId);
     if(sub){readFileAsData(window.__studentTestFile,data=>{sub.file=data;save();});}
   }
 };
})();

/* ---------- Wrap assignment submission ---------- */
(function wrapStudentAssignmentSubmit(){
 const old=window.finishAssignment;
 if(typeof old!=="function")return;
 window.finishAssignment=function(event,id){
   const file=document.getElementById("studentAssignmentFile")?.files[0];
   window.__studentAssignmentFile=file;
   old(event,id);
   if(window.__studentAssignmentFile){
     const sub=db.submissions.find(x=>x.type==="assignment"&&x.itemId===id&&x.studentId===currentUser.studentId);
     if(sub){readFileAsData(window.__studentAssignmentFile,data=>{sub.file=data;save();});}
   }
 };
})();

/* ---------- Mark save protection ---------- */
(function wrapMarkSave(){
 const old=window.saveMark;
 if(typeof old!=="function")return;
 window.saveMark=function(studentId){
   const values={ca1:Number(document.getElementById(`m1-${studentId}`)?.value),ca2:Number(document.getElementById(`m2-${studentId}`)?.value),model:Number(document.getElementById(`m3-${studentId}`)?.value)};
   if(markPeriodExpired()){
     const approved=db.markChangeRequests.find(x=>x.studentId===studentId&&(x.facultyId===currentUser.facultyId||x.facultyId===currentUser.email)&&x.status==="Approved"&&new Date(x.approvedUntil)>new Date());
     if(!approved){requestMarkChange(studentId,values);return;}
   }
   old(studentId);
 };
})();

/* ---------- Add upload controls to existing assessment modals ---------- */
document.addEventListener("change",function(e){});
