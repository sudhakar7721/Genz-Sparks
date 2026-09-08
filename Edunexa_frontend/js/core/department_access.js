/* =========================================================
   EDUNEXA DEPARTMENT ACCESS CONTROL
   - Faculty/HOD: same department only
   - Student: own record only
   - Management: all departments
   Keeps existing features; narrows data visibility/actions.
========================================================= */
(function(){
  "use strict";

  window.departmentAccess = {
    normalize: v => normalizedDepartment(v),
    same: (a,b) => sameDepartment(a,b),
    students: () => students(),
    canAccessStudent: s => canAccessStudent(s)
  };

  function recordDepartment(record){
    if(!record) return "";
    if(record.department) return record.department;
    if(record.departmentId){
      const d = (db.departments || []).find(x => x.id === record.departmentId || x.departmentId === record.departmentId);
      if(d) return d.name;
    }
    if(record.facultyId || record.faculty){
      const faculty = db.users.find(u =>
        u.role === "faculty" &&
        (u.facultyId === record.facultyId || u.name === record.faculty)
      );
      if(faculty) return faculty.department || "";
    }
    if(record.studentId){
      const student = db.users.find(u => u.role === "student" && u.studentId === record.studentId);
      if(student) return student.department || "";
    }
    if(record.studentName){
      const student = db.users.find(u => u.role === "student" && u.name === record.studentName);
      if(student) return student.department || "";
    }
    return "";
  }

  function canAccessDepartment(dept){
    if(!currentUser) return false;
    if(currentUser.role === "management") return true;
    return sameDepartment(dept, currentUser.department);
  }

  function scopedRecords(records){
    if(!currentUser) return [];
    if(currentUser.role === "management") return records;
    return records.filter(r => canAccessDepartment(recordDepartment(r)));
  }

  window.departmentScopedRecords = scopedRecords;
  window.departmentRecordDepartment = recordDepartment;

  // Existing faculty student-record page used db.studentProfiles directly.
  const oldRenderStudentRecords = window.renderStudentRecords;
  window.renderStudentRecords = function(){
    const e = document.getElementById("facultyStudentRecords");
    if(!e) return;
    const visible = (db.studentProfiles || []).filter(profile => {
      const student = db.users.find(u => u.role === "student" && u.studentId === profile.studentId);
      return canAccessStudent(student);
    });
    e.innerHTML = visible.map(x => `<div class="item"><div class="item-top"><b>${esc(x.name)} (${esc(x.studentId)})</b><span class="badge blue">${esc(x.className||"-")}</span></div><p>${esc(x.department||"-")} • Age ${esc(x.age||"-")} • ${esc(x.sex||"-")} • Blood ${esc(x.bloodGroup||"-")}</p><p>Father: ${esc(x.fatherName||"-")} • Mother: ${esc(x.motherName||"-")} • Guardian: ${esc(x.guardianName||"-")}</p><p>10th: ${esc(x.mark10||"-")} • 12th: ${esc(x.mark12||"-")} • School: ${esc(x.school||"-")}</p></div>`).join("") || `<div class="empty">No student records for your department.</div>`;
  };

  // Faculty/HOD collections that contain student data.
  const originalFacultyLeaves = window.renderFacultyLeaves;
  window.renderFacultyLeaves = function(){
    const e = document.getElementById("facultyLeaves");
    if(!e) return;
    const rows = (db.leaves || []).filter(l => {
      const s = db.users.find(u => u.role === "student" && u.studentId === l.studentId);
      return currentUser?.role === "management" || canAccessStudent(s);
    });
    if(!rows.length){ e.innerHTML = `<div class="card empty">No leave requests for your department.</div>`; return; }
    e.innerHTML = rows.map(leave => `
      <div class="card"><div class="item-top"><div><h3>${esc(leave.studentName)}</h3><p>${esc(leave.type)} • ${esc(leave.from)} → ${esc(leave.to)}</p></div>
      <span class="badge ${leave.status==="Approved"?"green":leave.status==="Rejected"?"red":"yellow"}">${esc(leave.status)}</span></div>
      <p>${esc(leave.reason)}</p>
      ${leave.status==="Pending" ? `<div class="actions"><button class="btn success" onclick="reviewLeave(${leave.id},'Approved')">Approve</button><button class="btn danger" onclick="reviewLeave(${leave.id},'Rejected')">Reject</button></div>` : `<p style="margin-top:8px">Reviewed by: ${esc(leave.reviewedBy||"-")}</p>`}</div>
    `).join("");
  };

  // Department-scope assessment lists and add department metadata to new records.
  const oldRenderFacultyTests = window.renderFacultyTests;
  window.renderFacultyTests = function(){
    const e = document.getElementById("facultyTestList"); if(!e) return;
    const rows = scopedRecords(db.tests || []);
    e.innerHTML = rows.map(test => `<div class="item"><b>${esc(test.title)}</b><p>${esc(test.subject)} • Class: ${esc(test.className||"All")} • ${esc(test.start)} → ${esc(test.due)} • ${test.questions.length} questions</p></div>`).join("") || `<div class="empty">No tests published for your department.</div>`;
  };

  const oldRenderFacultyAssignments = window.renderFacultyAssignments;
  window.renderFacultyAssignments = function(){
    const e = document.getElementById("facultyAssignmentList"); if(!e) return;
    const rows = scopedRecords(db.assignments || []);
    e.innerHTML = rows.map(a => `<div class="item"><b>${esc(a.title)}</b><p>${esc(a.subject)} • Class: ${esc(a.className||"All")} • ${esc(a.assigned)} → ${esc(a.due)}</p><p>${esc(a.description)}</p></div>`).join("") || `<div class="empty">No assignments published for your department.</div>`;
  };

  const oldCreateTest = window.createTest;
  if(typeof oldCreateTest === "function"){
    window.createTest = function(event){
      const before = db.tests.length;
      oldCreateTest(event);
      if(db.tests.length > before){
        db.tests[db.tests.length-1].department = currentUser.department || "";
        save();
      }
    };
  }

  const oldCreateAssignment = window.createAssignment;
  if(typeof oldCreateAssignment === "function"){
    window.createAssignment = function(event){
      const before = db.assignments.length;
      oldCreateAssignment(event);
      if(db.assignments.length > before){
        db.assignments[db.assignments.length-1].department = currentUser.department || "";
        save();
      }
    };
  }

  // Student test/assignment visibility is department + class scoped.
  function visibleAcademicRecord(record){
    const dept = recordDepartment(record);
    if(currentUser?.role === "management") return true;
    if(!sameDepartment(dept, currentUser?.department)) return false;
    const studentClass = currentUser?.className || currentUser?.class || currentUser?.classesHandled?.[0] || "";
    return !record.className || !studentClass || record.className === studentClass;
  }

  const oldStudentTests = window.renderStudentTests;
  window.renderStudentTests = function(){
    const e = document.getElementById("studentTests"); if(!e) return;
    // Re-run the existing renderer against only authorized records without changing its UI.
    const original = db.tests;
    db.tests = original.filter(visibleAcademicRecord);
    try { oldStudentTests(); } finally { db.tests = original; }
  };

  const oldStudentAssignments = window.renderStudentAssignments;
  window.renderStudentAssignments = function(){
    const e = document.getElementById("studentAssignments"); if(!e) return;
    const original = db.assignments;
    db.assignments = original.filter(visibleAcademicRecord);
    try { oldStudentAssignments(); } finally { db.assignments = original; }
  };

  // HOD mark requests and feedback are department-only.
  const oldHodMarkRequests = window.renderHodMarkRequests;
  window.renderHodMarkRequests = function(){
    const e = document.getElementById("hodMarkRequests"); if(!e) return;
    const rows = scopedRecords(db.markChangeRequests || []);
    e.innerHTML = rows.map(x => `<div class="item"><div class="item-top"><b>${esc(x.studentId)} • ${esc(x.facultyName)}</b><span class="badge ${x.status==="Approved"?"green":x.status==="Rejected"?"red":"yellow"}">${esc(x.status)}</span></div><p>CA1 ${esc(x.requested.ca1)} • CA2 ${esc(x.requested.ca2)} • Model ${esc(x.requested.model)}</p><p>Period: ${esc(x.periodEnd)} • ${esc(x.requestedAt)}</p>${x.status==="Pending"?`<div class="actions"><button class="btn success" onclick="reviewMarkRequest('${esc(x.id)}','Approved')">Approve</button><button class="btn danger" onclick="reviewMarkRequest('${esc(x.id)}','Rejected')">Reject</button></div>`:""}</div>`).join("") || `<div class="empty">No requests for your department.</div>`;
  };

  const oldHodFeedback = window.renderHodFeedback;
  window.renderHodFeedback = function(){
    const e = document.getElementById("hodFeedbackList"); if(!e) return;
    const rows = scopedRecords(db.classMeetings || []);
    e.innerHTML = rows.map(x => `<div class="item"><div class="item-top"><b>${esc(x.studentName)} • ${esc(x.subject)}</b><span class="badge blue">${esc(x.status)}</span></div><p>Rating: ${esc(x.rating)}/5 • ${esc(x.type||"general")}</p><p>${esc(x.message)}</p><small>${esc(x.createdAt)}</small></div>`).join("") || `<div class="empty">No feedback for your department.</div>`;
  };

  // Ensure leave records carry department and review cannot cross departments.
  const oldSubmitLeave = window.submitLeave;
  if(typeof oldSubmitLeave === "function"){
    window.submitLeave = function(event){
      const before = db.leaves.length;
      oldSubmitLeave(event);
      if(db.leaves.length > before){ db.leaves[db.leaves.length-1].department = currentUser.department || ""; save(); }
    };
  }

  const oldReviewLeave = window.reviewLeave;
  window.reviewLeave = function(id,status){
    const leave = db.leaves.find(x => x.id === id);
    const student = leave && db.users.find(u => u.role === "student" && u.studentId === leave.studentId);
    if(!leave || !student || !canAccessStudent(student)){
      toast("Access denied: student belongs to another department.");
      return;
    }
    oldReviewLeave(id,status);
  };

  const oldSaveMark = window.saveMark;
  window.saveMark = function(studentId){
    const student = db.users.find(u => u.role === "student" && u.studentId === studentId);
    if(!student || !canAccessStudent(student)){
      toast("Access denied: student belongs to another department.");
      return;
    }
    oldSaveMark(studentId);
  };

  // Mark-change approval cannot cross departments.
  const oldReviewMarkRequest = window.reviewMarkRequest;
  window.reviewMarkRequest = function(id,status){
    const r = db.markChangeRequests.find(x => x.id === id);
    const student = r && db.users.find(u => u.role === "student" && u.studentId === r.studentId);
    if(!r || !student || !canAccessStudent(student)){
      toast("Access denied: request belongs to another department.");
      return;
    }
    oldReviewMarkRequest(id,status);
  };

  // Parent notification must resolve only an authorized student.
  const oldSendParentNotice = window.sendParentNotice;
  window.sendParentNotice = function(event){
    const sid = document.getElementById("noticeStudent")?.value;
    const student = db.users.find(u => u.role === "student" && u.studentId === sid);
    if(!student || !canAccessStudent(student)){
      event.preventDefault();
      toast("Access denied: student belongs to another department.");
      return;
    }
    oldSendParentNotice(event);
  };

  // Existing management pages remain college-wide.
  window.managementStudents = window.managementStudents || function(){
    return db.users.filter(u => u.role === "student");
  };

  // Department-aware notifications. Existing "all" notifications remain for backward compatibility,
  // while new academic notices can target a department.
  const oldGetVisibleNotifications = window.getVisibleNotifications;
  window.getVisibleNotifications = function(){
    if(!currentUser) return [];
    const base = oldGetVisibleNotifications();
    return base.filter(n => {
      if(!String(n.target||"").startsWith("department:")) return true;
      return currentUser.role === "management" || sameDepartment(String(n.target).slice(11), currentUser.department);
    });
  };

  // Safety cleanup: if the active session is faculty/HOD, make sure the visible
  // user profile department is present before rendering any page.
  if(currentUser && (currentUser.role === "faculty" || currentUser.role === "hod") && !currentUser.department){
    currentUser.department = "Data Analytics";
  }

})();

/* Department metadata for future mark requests */
(function(){
  const oldRequest = window.requestMarkChange;
  if(typeof oldRequest !== "function") return;
  window.requestMarkChange = function(studentId, values){
    const student = db.users.find(u => u.role === "student" && u.studentId === studentId);
    if(!student || !canAccessStudent(student)){
      toast("Access denied: student belongs to another department.");
      return;
    }
    oldRequest(studentId, values);
    const latest = db.markChangeRequests[db.markChangeRequests.length-1];
    if(latest && latest.studentId === studentId){ latest.department = student.department || currentUser.department || ""; save(); }
  };
})();
