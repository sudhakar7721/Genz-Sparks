/* =========================================================
   LEAVE
========================================================= */

function submitLeave(event){

    event.preventDefault();


    const from =
        document
            .getElementById("leaveFrom")
            .value;

    const to =
        document
            .getElementById("leaveTo")
            .value;

    const reason =
        document
            .getElementById("leaveReason")
            .value.trim();

    const durationType =
        document.getElementById("leaveDuration")?.value || "full";

    const hoursValue =
        durationType === "half"
        ? Number(document.getElementById("leaveHours")?.value || 0)
        : 0;

    if(durationType === "half" && (!Number.isInteger(hoursValue) || hoursValue < 1 || hoursValue > 6)){
        toast("Half-day leave must be between 1 and 6 hours.");
        return;
    }


    if(new Date(to) < new Date(from)){

        toast("To date cannot be before from date.");

        return;

    }


    const leave = {

        id:Date.now(),

        studentId:currentUser.studentId,

        studentName:currentUser.name,

        parentName:currentUser.parentName,

        parentPhone:currentUser.parentPhone,

        type:
            document
                .getElementById("leaveType")
                .value,

        from,

        to,

        reason,

        durationType:durationType === "half" ? "Half Day" : "Full Day",

        hours:durationType === "half" ? hoursValue : "Full Day",

        status:"Pending"

    };


    db.leaves.push(leave);


    addNotice(
        "Leave request submitted",
        `${currentUser.name} submitted a ${leave.type}.`,
        "faculty"
    );


    addNotice(
        "Leave request submitted",
        `${currentUser.name} submitted a ${leave.type}.`,
        "adviser"
    );


    save();

    refreshAll();

    event.target.reset();

    toast(
        "Leave request sent to faculty/class adviser."
    );

}


function renderFacultyLeaves(){

    const element =
        document.getElementById(
            "facultyLeaves"
        );


    if(!element){

        return;

    }


    if(db.leaves.length === 0){

        element.innerHTML = `
            <div class="card empty">
                No leave requests.
            </div>
        `;

        return;

    }


    element.innerHTML =
        db.leaves
        .map(
            leave => `

            <div class="card">

                <div class="item-top">

                    <div>

                        <h3>
                            ${esc(leave.studentName)}
                        </h3>

                        <p>
                            ${esc(leave.type)}
                            •
                            ${esc(leave.from)}
                            →
                            ${esc(leave.to)}
                        </p>

                    </div>


                    <span
                        class="badge ${
                            leave.status === "Approved"
                            ? "green"
                            :
                            leave.status === "Rejected"
                            ? "red"
                            :
                            "yellow"
                        }"
                    >
                        ${esc(leave.status)}
                    </span>

                </div>


                <p>
                    ${esc(leave.reason)}
                </p>


                ${
                    leave.status === "Pending"
                    ?
                    `
                    <div class="actions">

                        <button
                            class="btn success"
                            onclick="reviewLeave(${leave.id},'Approved')"
                        >
                            Approve
                        </button>

                        <button
                            class="btn danger"
                            onclick="reviewLeave(${leave.id},'Rejected')"
                        >
                            Reject
                        </button>

                    </div>
                    `
                    :
                    `
                    <p style="margin-top:8px">
                        Reviewed by:
                        ${esc(leave.reviewedBy || "-")}
                    </p>
                    `
                }

            </div>

            `
        )
        .join("");

}


function reviewLeave(id,status){

    const leave =
        db.leaves.find(
            item => item.id === id
        );


    if(!leave){

        toast("Leave request not found.");

        return;

    }


    leave.status = status;

    leave.reviewedBy =
        currentUser.name;

    leave.reviewedAt =
        new Date().toLocaleString();


    addNotice(
        status === "Approved"
            ? "Leave approved"
            : "Leave rejected",

        `${leave.type} from ${leave.from} to ${leave.to} has been ${status.toLowerCase()} by ${currentUser.name}.`,

        leave.studentId
    );


    if(status === "Approved"){

        addNotice(
            "Parent notification",
            `Leave approved for ${leave.studentName}. Parent notification prepared for ${leave.parentName} (${leave.parentPhone || "phone not provided"}).`,
            leave.parentPhone || "parent"
        );

    }


    addNotice(
        "Adviser update",
        `Leave status for ${leave.studentName}: ${status}.`,
        "adviser"
    );


    save();

    refreshAll();

    toast(
        status === "Approved"
        ? "Student and parent notified."
        : "Student notified."
    );

}


function renderStudentLeaves(){

    const element =
        document.getElementById(
            "studentLeaves"
        );


    if(!element){

        return;

    }


    const leaves =
        db.leaves.filter(
            leave =>
                leave.studentId ===
                currentUser.studentId
        );


    element.innerHTML =
        leaves
        .map(
            leave => `

            <div class="item">

                <div class="item-top">

                    <b>
                        ${esc(leave.type)}
                    </b>

                    <span
                        class="badge ${
                            leave.status === "Approved"
                            ? "green"
                            :
                            leave.status === "Rejected"
                            ? "red"
                            :
                            "yellow"
                        }"
                    >
                        ${esc(leave.status)}
                    </span>

                </div>

                <p>
                    ${esc(leave.from)}
                    →
                    ${esc(leave.to)}
                    •
                    ${esc(leave.reason)}
                </p>

            </div>

            `
        )
        .join("")
        ||
        `
            <div class="empty">
                No leave requests.
            </div>
        `;

}


