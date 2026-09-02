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


async function register(){

    const name = document.getElementById("suName").value.trim();
    const email = document.getElementById("suEmail").value.trim().toLowerCase();
    const password = document.getElementById("suPass").value.trim();

    if(!name || !email || !password){
        toast("Please complete all required fields.");
        return;
    }

    if(password.length < 6){
        toast("Password must contain at least 6 characters.");
        return;
    }

    if(!EDUNEXA_BACKEND_ENABLED){
        toast("Backend mode is required for registration.");
        return;
    }

    const payload = {
        name,
        email,
        password,
        role: signupRole,
        student_id: signupRole === "student"
            ? (document.getElementById("suStudentId")?.value.trim() || null)
            : null,
        parent_name: signupRole === "student"
            ? (document.getElementById("suParent")?.value.trim() || "Parent / Guardian")
            : null,
        parent_phone: signupRole === "student"
            ? (document.getElementById("suParentPhone")?.value.trim() || null)
            : null,
        batch: signupRole === "student" ? "2025-2028" : null,
        class_name: signupRole === "student" ? "II B.Sc Data Analytics" : null,
        department: "Data Analytics"
    };

    try{
        const data = await api("/auth/signup", {
            method:"POST",
            body:JSON.stringify(payload)
        });

        localStorage.setItem("edunexa_token", data.access_token);
        localStorage.setItem("edunexa_user", JSON.stringify(data.user));
        currentUser = data.user;

        toast("Account created successfully.");
        await openApp();
    }catch(error){
        toast(error.message);
    }
}

/* =========================================================
   LOGIN
========================================================= */

async function login(){

    const id = document.getElementById("loginId").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    if(!id || !password){
        toast("Enter login ID and password.");
        return;
    }

    if(!EDUNEXA_BACKEND_ENABLED){
        toast("Backend mode is disabled.");
        return;
    }

    try{
        const data = await api("/auth/login", {
            method:"POST",
            body:JSON.stringify({
                identifier:id,
                email:id.includes("@") ? id : undefined,
                password,
                role:loginRole
            })
        });

        localStorage.setItem("edunexa_token", data.access_token);
        localStorage.setItem("edunexa_user", JSON.stringify(data.user));
        localStorage.setItem("edunexa_session", JSON.stringify(data.user));

        currentUser = data.user;
        await openApp();
    }catch(error){
        toast(error.message);
    }
}



function logout(){

    currentUser = null;

    localStorage.removeItem("edunexa_session");
    localStorage.removeItem("edunexa_token");
    localStorage.removeItem("edunexa_user");

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

async function openApp(){

    document
        .getElementById("auth")
        .classList.add("hidden");

    document
        .getElementById("app")
        .classList.remove("hidden");

    if(EDUNEXA_BACKEND_ENABLED && localStorage.getItem("edunexa_token")){
        await syncBackendState();
    }

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


