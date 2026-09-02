/* =========================================================
   INITIALIZE
========================================================= */

seedDatabase();

const savedToken = localStorage.getItem("edunexa_token");
const savedUser = localStorage.getItem("edunexa_user");

if(savedToken && savedUser){
    try{
        currentUser = JSON.parse(savedUser);
        openApp();
    }catch(error){
        console.error("Session error:", error);
        localStorage.removeItem("edunexa_token");
        localStorage.removeItem("edunexa_user");
        localStorage.removeItem("edunexa_session");
    }
}
