/* =========================================================
   DEFAULT PAGE
========================================================= */

function defaultPage(){

    if(currentUser.role === "student"){

        return "student-dashboard";

    }

    if(currentUser.role === "faculty"){

        return "faculty-dashboard";

    }

    if(currentUser.role === "hod"){

        return "hod-dashboard";

    }

    return "management-dashboard";

}



/* =========================================================
   NAVIGATION
========================================================= */

function buildNav(){

    let html = "";


    function addSection(title,items){

        html += `
            <div class="menu-title">
                ${title}
            </div>
        `;


        items.forEach(item => {

            html += `
                <button
                    class="nav"
                    data-page="${item[0]}"
                    onclick="go('${item[0]}')"
                >

                    <span>${item[1]}</span>

                    <b>${item[2]}</b>

                </button>
            `;

        });

    }


    if(currentUser.role === "student"){

        addSection(
            "Student",
            [

                ["student-dashboard","🏠","Dashboard"],

                ["student-academics","📚","Marks & Academics"],

                ["student-tests","📝","Tests"],

                ["student-assignments","📋","Assignments"],

                ["student-attendance","📅","Attendance"],

                ["student-fees","💳","Fees"],

                ["student-leave","🗓️","Leave"],

                ["student-skills","🧠","Skill Dashboard"],

                ["student-feedback","💬","Feedback"],
                ["student-professional","🎓","Certificates & Career"],
                ["student-timetable","🕐","Class Timetable"],
                ["student-committee","👥","Class Committee"],
                ["student-leave-requests","📋","My Leave Requests"],
                ["student-class-leave-v2","🗓️","Class Adviser Leave"],

                ["notifications","🔔","Notifications"]

            ]
        );

    }


    if(currentUser.role === "faculty"){

        addSection(
            "Faculty",
            [

                ["faculty-dashboard","🏠","Dashboard"],

                ["faculty-tests","📝","Tests"],

                ["faculty-assignments","📋","Assignments"],

                ["faculty-attendance","📅","Attendance"],

                ["faculty-marks","🎯","Marks & Results"]

            ]
        );


        if(currentUser.mentor){

            addSection(
                "Mentor",
                [
                    [
                        "mentor-skills",
                        "🧭",
                        "Student Skill Dashboard"
                    ]
                ]
            );

        }


        if(currentUser.classAdviser){

            addSection(
                "Class Adviser",
                [

                    [
                        "adviser-dashboard",
                        "⭐",
                        "Full Class Access"
                    ],
                    [
                        "adviser-leaves",
                        "🗓️",
                        "Class Leave Requests"
                    ],

                    [
                        "adviser-fees",
                        "💳",
                        "Student Fees"
                    ],

                    [
                        "adviser-notify",
                        "📢",
                        "Parent Notifications"
                    ],
                    [
                        "adviser-feedback",
                        "💬",
                        "Student Feedback"
                    ],
                    [
                        "adviser-timetable",
                        "🕐",
                        "Class Timetable"
                    ],
                    [
                        "adviser-mark-requests",
                        "⏳",
                        "Mark Change Requests"
                    ]

                ]
            );

        }


        addSection(
            "Services",
            [
                [
                    "notifications",
                    "🔔",
                    "Notifications"
                ]
            ]
        );

    }


    if(currentUser.role === "hod"){

        addSection(
            "HOD",
            [
                ["hod-dashboard","🏛️","HOD Dashboard"],
                ["hod-faculty","👨‍🏫","Faculty Details"],
                ["hod-students","👨‍🎓","Student Records"],
                ["hod-mark-requests","🎯","Mark Change Requests"],
                ["hod-class-details","🏫","Class Details"],
                ["hod-timetable","🕐","Class Timetables"],
                ["hod-faculty-timetable","📅","Faculty Timetable"],
                ["hod-faculty-attendance","🧾","Faculty Attendance"],
                ["hod-extra","⚙️","HOD Extra Details"],
                ["hod-feedback","💬","Class Committee Feedback"],
                ["hod-achievements","📊","Department Achievements"],
                ["notifications","🔔","Notifications"]
            ]
        );

    }


    if(currentUser.role === "management"){
        addSection(
            "Management",
            [
                ["management-dashboard","🏢","Dashboard"],
                ["management-faculty","👨‍🏫","Faculty Details"],
                ["management-fees","💳","Department Fees"],
                ["management-marks","🎯","Student Marks"],
                ["management-placements","🏢","Placements"],
                ["management-feedback","💬","Feedback Analytics"],
                ["management-hod","🏛️","HOD Details"],
                ["management-departments","🏫","Department Details"],
                ["management-extra","⚙️","Extra Institution Details"]
            ]
        );
    }

    document
        .getElementById("nav")
        .innerHTML = html;

}


function go(pageId){

    document
        .querySelectorAll(".page")
        .forEach(page => {

            page.classList.toggle(
                "active",
                page.id === pageId
            );

        });


    document
        .querySelectorAll(".nav")
        .forEach(nav => {

            nav.classList.toggle(
                "active",
                nav.dataset.page === pageId
            );

        });


    window.scrollTo({
        top:0,
        behavior:"smooth"
    });


    if(pageId === "notifications"){

        renderNotifications();

    }

    if(pageId === "student-feedback"){
        renderStudentFeedback();
    }

    if(pageId === "adviser-feedback"){
        renderAdviserFeedback();
    }

    if(typeof renderEnhancementPage === "function"){
        renderEnhancementPage(pageId);
    }

}



/* =========================================================
   PAGE RENDERING
========================================================= */

function renderPages(){

    document
        .getElementById("pages")
        .innerHTML = `

            ${studentPages()}

            ${facultyPages()}

            ${managementPages()}

            ${enhancementPages()}

            <div
                class="page"
                id="notifications"
            >

                <div class="page-title">

                    <h1>
                        Notifications 🔔
                    </h1>

                    <p>
                        Role-aware academic and fee updates.
                    </p>

                </div>

                <div class="card">

                    <div
                        id="notificationList"
                        class="list"
                    ></div>

                </div>

            </div>

        `;


    refreshAll();

}



/* =========================================================
   STAT CARD
========================================================= */

function stat(title,number,change=""){

    return `

        <div class="stat">

            <div class="stat-title">
                ${esc(title)}
            </div>

            <div class="stat-number">
                ${esc(number)}
            </div>

            <div class="stat-change">
                ${esc(change)}
            </div>

        </div>

    `;

}


