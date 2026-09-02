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


function students(){

    return db.users.filter(
        user => user.role === "student"
    );

}


function getStudent(studentId){

    return db.users.find(
        user => user.studentId === studentId
    );

}


