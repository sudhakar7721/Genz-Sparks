/* =========================================================
   INITIALIZE
   Backend-aware session restore. A legacy localStorage session
   without a FastAPI token must not automatically bypass login.
========================================================= */

seedDatabase();

const backendToken = localStorage.getItem("edunexa_token");
const savedSession = localStorage.getItem("edunexa_session");

if (backendToken && savedSession) {
    try {
        const session = JSON.parse(savedSession);
        const existingUser = db.users.find(user =>
            (user.email || "").toLowerCase() ===
            String(session.email || "").toLowerCase()
        );

        if (existingUser) {
            currentUser = existingUser;
            openApp();
        }
    } catch (error) {
        console.error("Session error:", error);
        localStorage.removeItem("edunexa_session");
    }
}
