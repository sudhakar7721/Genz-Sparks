/* =========================================================
   INITIALIZE
========================================================= */

seedDatabase();


const savedSession =
    localStorage.getItem(
        "edunexa_session"
    );


if(savedSession){

    try{

        const session =
            JSON.parse(
                savedSession
            );


        const existingUser =
            db.users.find(
                user =>
                    user.email ===
                    session.email
            );


        if(existingUser){

            currentUser = existingUser;

            openApp();

        }else{

            localStorage.removeItem(
                "edunexa_session"
            );

        }

    }catch(error){

        console.error(
            "Session error:",
            error
        );

        localStorage.removeItem(
            "edunexa_session"
        );

    }

}
