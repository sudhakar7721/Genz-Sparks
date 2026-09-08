/* =========================================================
   HELPERS
========================================================= */

function esc(value){

    return String(value ?? "")
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");

}


function toast(message){

    const element =
        document.getElementById("toast");

    element.textContent = message;

    element.classList.add("show");

    setTimeout(
        () => element.classList.remove("show"),
        2600
    );

}


function today(){

    return new Date()
        .toISOString()
        .slice(0,10);

}


/* =========================================================
   DEPARTMENT-WISE ACCESS
   Faculty/HOD can only work with students in their own department.
   Management keeps college-wide access. Students only see themselves.
========================================================= */
function normalizedDepartment(value){
    const v = String(value || "").trim().toLowerCase();
    const aliases = {
        "artificial intelligence & data science":"artificial intelligence",
        "artificial intelligence and data science":"artificial intelligence",
        "ai & data science":"artificial intelligence",
        "ai and data science":"artificial intelligence"
    };
    return aliases[v] || v;
}

function sameDepartment(a,b){
    return normalizedDepartment(a) !== "" && normalizedDepartment(a) === normalizedDepartment(b);
}

function studentClass(student){
    if(!student) return "";
    if(student.className) return String(student.className).trim();
    const profile = (db.studentProfiles || []).find(p => p.studentId === student.studentId);
    if(profile && profile.className) return String(profile.className).trim();
    const dept = student.department || "";
    return dept ? `II B.Sc ${dept}` : "";
}

function classAdviserHandlesStudent(student){
    if(!currentUser || currentUser.role !== "faculty" || !currentUser.classAdviser || !student) return false;
    if(!sameDepartment(student.department, currentUser.department)) return false;
    const handled = Array.isArray(currentUser.classesHandled) ? currentUser.classesHandled : [];
    if(handled.length === 0) return true; // legacy adviser account
    const cls = studentClass(student).toLowerCase();
    return handled.some(x => String(x || "").trim().toLowerCase() === cls);
}

function canAccessStudent(student){
    if(!student || student.role !== "student" || !currentUser) return false;
    if(currentUser.role === "management") return true;
    if(currentUser.role === "student") return student.studentId === currentUser.studentId;
    // Faculty/HOD: academic/department-level visibility only.
    return sameDepartment(student.department, currentUser.department);
}

function canAccessStudentPersonal(student){
    if(!student || student.role !== "student" || !currentUser) return false;
    if(currentUser.role === "management") return true;
    if(currentUser.role === "student") return student.studentId === currentUser.studentId;
    return classAdviserHandlesStudent(student);
}

function canAccessLeave(leave){
    if(!leave || !currentUser) return false;
    if(currentUser.role === "management") return true;
    if(currentUser.role === "student") return leave.studentId === currentUser.studentId;
    const student = db.users.find(u => u.role === "student" && u.studentId === leave.studentId);
    return !!student && classAdviserHandlesStudent(student);
}

function classAdviserStudents(){
    return db.users.filter(user => user.role === "student" && classAdviserHandlesStudent(user));
}

function students(){
    // A class adviser is deliberately scoped to the assigned class;
    // ordinary faculty/HOD remain scoped to their department.
    if(currentUser?.role === "faculty" && currentUser.classAdviser){
        return classAdviserStudents();
    }
    return db.users.filter(user => user.role === "student" && canAccessStudent(user));
}

function getStudent(studentId){
    const student = db.users.find(user => user.studentId === studentId && user.role === "student");
    return canAccessStudent(student) ? student : null;
}

function departmentStudents(department){
    return db.users.filter(user => user.role === "student" && sameDepartment(user.department, department));
}

function departmentFaculty(department){
    return db.users.filter(user => user.role === "faculty" && sameDepartment(user.department, department));
}


