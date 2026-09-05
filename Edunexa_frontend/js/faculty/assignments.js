/* =========================================================
   FACULTY ASSIGNMENTS
========================================================= */

function createAssignment(event){

    event.preventDefault();


    const title =
        document
            .getElementById("asTitle")
            .value.trim();

    const subject =
        document
            .getElementById("asSubject")
            .value.trim();

    const assigned =
        document
            .getElementById("asAssigned")
            .value;

    const due =
        document
            .getElementById("asDue")
            .value;

    const description =
        document
            .getElementById("asDesc")
            .value.trim();


    if(new Date(due) < new Date(assigned)){

        toast("Due date cannot be before assigned date.");

        return;

    }


    const assignment = {

        id:Date.now(),

        title,

        subject,

        className:document.getElementById("asClass")?.value || currentUser.className || currentUser.classesHandled?.[0] || "II B.Sc Data Analytics",

        faculty:currentUser.name,

        assigned,

        due,

        description

    };


    db.assignments.push(
        assignment
    );


    addNotice(
        "New assignment published",
        `${title} is due on ${due}.`,
        "all"
    );


    save();

    refreshAll();

    event.target.reset();

    toast(
        "Assignment published and students notified."
    );

}


function renderFacultyAssignments(){

    const element =
        document.getElementById(
            "facultyAssignmentList"
        );


    if(!element){

        return;

    }


    element.innerHTML =
        db.assignments
        .map(
            assignment => `

            <div class="item">

                <b>
                    ${esc(assignment.title)}
                </b>

                <p>
                    ${esc(assignment.subject)}
                    • Class: ${esc(assignment.className || "All")}
                    •
                    ${esc(assignment.assigned)}
                    →
                    ${esc(assignment.due)}
                </p>

                <p>
                    ${esc(assignment.description)}
                </p>

            </div>

            `
        )
        .join("")
        ||
        `
            <div class="empty">
                No assignments published.
            </div>
        `;

}


