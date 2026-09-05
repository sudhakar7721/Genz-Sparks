/* =========================================================
   REFRESH
========================================================= */

function refreshAll(){
    renderManagementMarks();
    renderManagementFaculty();

    if(!currentUser){

        return;

    }


    if(currentUser.role === "student"){

        renderStudentFeedback();

        renderStudentTests();

        renderStudentAssignments();

        renderStudentLeaves();

        if(typeof refreshEnhancements === "function"){
            refreshEnhancements();
        }

        const dash =
            document.getElementById(
                "dashNotices"
            );


        if(dash){

            const notices =
                getVisibleNotifications()
                    .slice(-3)
                    .reverse();


            dash.innerHTML =
                notices.length
                ?
                notices
                    .map(
                        notice => `

                        <div class="notice">

                            <b>
                                ${esc(notice.title)}
                            </b>

                            <br>

                            ${esc(notice.message)}

                        </div>

                        `
                    )
                    .join("")
                :
                `
                    <div class="empty">
                        No notifications.
                    </div>
                `;

        }

    }


    if(currentUser.role === "faculty"){

        renderAdviserFeedback();

        renderFacultyTests();

        renderFacultyAssignments();

        renderFacultyLeaves();

        renderAdviserFees();

        if(typeof refreshEnhancements === "function"){
            refreshEnhancements();
        }

    }

    if(currentUser.role === "hod" && typeof refreshEnhancements === "function"){
        refreshEnhancements();
    }

    if(currentUser.role === "management" && typeof refreshEnhancements === "function"){
        refreshEnhancements();
    }

    if(typeof injectFacultyAssessmentUploads === "function"){
        injectFacultyAssessmentUploads();
    }

    renderNotifications();

}


