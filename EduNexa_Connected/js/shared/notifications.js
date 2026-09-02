/* =========================================================
   NOTIFICATIONS
========================================================= */

async function addNotice(
    title,
    message,
    target="all"
){

    const localNotice = {
        id: Date.now() + Math.random(),
        title, message, target,
        createdAt: new Date().toLocaleString()
    };
    db.notifications.push(localNotice);

    if(EDUNEXA_BACKEND_ENABLED && localStorage.getItem("edunexa_token")){
        try{
            const student = target && target !== "all" ? getStudent(String(target)) : null;
            await api("/notifications", {
                method:"POST",
                body:JSON.stringify({
                    student_id: student?.backendStudentId || null,
                    recipient_role: student ? null : (target || "all"),
                    title, message
                })
            });
        }catch(error){
            console.warn("Notification API failed:", error.message);
        }
    }

    save();

}


function getVisibleNotifications(){

    if(!currentUser){

        return [];

    }


    let targets = [

        "all",

        currentUser.email,

        currentUser.studentId,

        currentUser.parentPhone,

        currentUser.role

    ];


    if(currentUser.classAdviser){

        targets.push("adviser");

    }


    if(currentUser.role === "faculty"){

        targets.push("faculty");

    }


    return db.notifications.filter(
        notification =>
            targets.includes(
                notification.target
            )
    );

}


function renderNotifications(){

    const element =
        document.getElementById(
            "notificationList"
        );


    if(!element || !currentUser){

        return;

    }


    const notifications =
        getVisibleNotifications()
            .slice(-30)
            .reverse();


    element.innerHTML =
        notifications
        .map(
            notification => `

            <div class="item">

                <div class="item-top">

                    <b>
                        🔔
                        ${esc(notification.title)}
                    </b>

                    <small class="muted">
                        ${esc(notification.createdAt)}
                    </small>

                </div>

                <p>
                    ${esc(notification.message)}
                </p>

            </div>

            `
        )
        .join("")
        ||
        `
            <div class="empty">
                No notifications.
            </div>
        `;

}



/* =========================================================
   PARENT NOTIFICATION
========================================================= */

function sendParentNotice(event){

    event.preventDefault();


    const studentId =
        document
            .getElementById("noticeStudent")
            .value;


    const type =
        document
            .getElementById("noticeType")
            .value;


    const message =
        document
            .getElementById("noticeMessage")
            .value.trim();


    const student =
        getStudent(studentId);


    if(!student){

        toast("Student not found.");

        return;

    }


    if(!message){

        toast("Enter a notification message.");

        return;

    }


    addNotice(
        type,
        message,
        student.studentId
    );


    addNotice(
        type,
        message,
        student.parentPhone || "parent"
    );


    addNotice(
        type,
        message,
        "adviser"
    );


    save();

    event.target.reset();

    refreshAll();

    toast(
        `Notification sent to ${student.name}, parent and adviser.`
    );

}


