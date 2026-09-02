/* =========================================================
   AUTH
========================================================= */

function showSignup(){

    document
        .getElementById("loginPanel")
        .classList.add("hidden");

    document
        .getElementById("signupPanel")
        .classList.remove("hidden");

}


function showLogin(){

    document
        .getElementById("signupPanel")
        .classList.add("hidden");

    document
        .getElementById("loginPanel")
        .classList.remove("hidden");

}


function chooseLogin(role,element){

    loginRole = role;

    document
        .querySelectorAll("#loginPanel .role")
        .forEach(button =>
            button.classList.remove("active")
        );

    element.classList.add("active");

}


function chooseSignup(role,element){

    signupRole = role;

    document
        .querySelectorAll("#signupPanel .role")
        .forEach(button =>
            button.classList.remove("active")
        );

    element.classList.add("active");

    document
        .getElementById("studentSignup")
        .classList.toggle(
            "hidden",
            role !== "student"
        );

}


function register(){

    const name =
        document.getElementById("suName")
        .value.trim();

    const email =
        document.getElementById("suEmail")
        .value.trim()
        .toLowerCase();

    const password =
        document.getElementById("suPass")
        .value.trim();


    if(!name || !email || !password){

        toast("Please complete all required fields.");

        return;

    }


    if(password.length < 6){

        toast("Password must contain at least 6 characters.");

        return;

    }


    if(
        db.users.some(
            user => user.email.toLowerCase() === email
        )
    ){

        toast("Email already registered.");

        return;

    }


    const user = {

        name:name,

        email:email,

        password:password,

        role:signupRole

    };


    if(signupRole === "student"){

        const studentId =
            document
                .getElementById("suStudentId")
                .value.trim()
            || `EDU-${Date.now()}`;


        if(
            db.users.some(
                user => user.studentId === studentId
            )
        ){

            toast("Student ID already exists.");

            return;

        }


        user.studentId = studentId;

        user.parentName =
            document
                .getElementById("suParent")
                .value.trim()
            || "Parent / Guardian";

        user.parentPhone =
            document
                .getElementById("suParentPhone")
                .value.trim();

        user.department = "Data Analytics";

        user.batch = "2025-2028";

        user.attendance = 0;

        user.skills = {

            Python:0,
            SQL:0,
            "Power BI":0,
            Excel:0,
            Communication:0

        };

    }


    if(signupRole === "faculty"){

        user.facultyId =
            "FAC-" + Date.now();

        user.mentor = false;

        user.classAdviser = false;

        user.department = "Data Analytics";

    }


    if(signupRole === "management"){

        user.adminId =
            "ADM-" + Date.now();

    }


    db.users.push(user);

    save();

    toast("Account created successfully.");

    showLogin();

}



/* =========================================================
   LOGIN
========================================================= */

function login(){

    const id =
        document
            .getElementById("loginId")
            .value.trim();

    const password =
        document
            .getElementById("loginPassword")
            .value.trim();


    if(!id || !password){

        toast("Enter login ID and password.");

        return;

    }


    const user =
        db.users.find(
            item =>

                (
                    item.email === id ||
                    item.studentId === id ||
                    item.facultyId === id ||
                    item.adminId === id
                )

                &&

                item.password === password

                &&

                item.role === loginRole
        );


    if(!user){

        toast("Invalid login details or user type.");

        return;

    }


    currentUser = user;


    localStorage.setItem(
        "edunexa_session",
        JSON.stringify(user)
    );


    openApp();

}


function logout(){

    currentUser = null;

    localStorage.removeItem(
        "edunexa_session"
    );

    document
        .getElementById("app")
        .classList.add("hidden");

    document
        .getElementById("auth")
        .classList.remove("hidden");

    document
        .getElementById("loginId")
        .value = "";

    document
        .getElementById("loginPassword")
        .value = "";

    showLogin();

}



/* =========================================================
   ROLE LABEL
========================================================= */

function labelRole(){

    if(currentUser.role === "faculty"){

        if(
            currentUser.classAdviser &&
            currentUser.mentor
        ){

            return "Faculty • Mentor • Class Adviser";

        }

        if(currentUser.classAdviser){

            return "Faculty • Class Adviser";

        }

        if(currentUser.mentor){

            return "Faculty • Mentor";

        }

        return "Faculty";

    }


    if(currentUser.role === "management"){

        return "Management";

    }


    return "Student";

}



/* =========================================================
   OPEN APPLICATION
========================================================= */

function openApp(){

    document
        .getElementById("auth")
        .classList.add("hidden");

    document
        .getElementById("app")
        .classList.remove("hidden");


    document
        .getElementById("userName")
        .textContent = currentUser.name;


    document
        .getElementById("userRole")
        .textContent = labelRole();


    document
        .getElementById("avatar")
        .textContent =
            currentUser.name
                .charAt(0)
                .toUpperCase();


    buildNav();

    renderPages();

    go(defaultPage());

}


