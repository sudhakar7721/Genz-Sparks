/* =========================================================
   HOD MARK REQUEST APPROVALS
========================================================= */

function renderHodMarkRequests(){

    const container =
        document.getElementById("hodMarkRequestsList");

    if(!container){

        return;

    }

    const filterElement =
        document.getElementById("hodRequestFilter");

    const filterValue =
        filterElement ? filterElement.value : "Pending";

    const list =
        db.markRequests
            .filter(
                request =>
                    filterValue === "All" ||
                    request.status === filterValue
            )
            .slice()
            .reverse();

    container.innerHTML =
        list
        .map(
            request => `

            <div class="item">

                <div class="item-top">

                    <b>
                        ${esc(request.studentName)}
                        —
                        ${esc(request.subjectCategory)}
                        (${esc(request.examLabel)})
                    </b>

                    <span
                        class="badge ${
                            request.status === "Pending"
                            ? "yellow"
                            : request.status === "Approved"
                            ? "green"
                            : "red"
                        }"
                    >
                        ${esc(request.status)}
                    </span>

                </div>

                <p>
                    Requested by <b>${esc(request.facultyName)}</b>
                    <br>
                    Current: <b>${esc(request.currentMark)}</b>
                    →
                    Requested: <b>${esc(request.requestedMark)}</b>
                    <br>
                    Reason: ${esc(request.reason)}
                    <br>
                    <small class="muted">
                        Submitted: ${esc(request.createdAt)}
                    </small>
                    ${
                        request.hodRemarks
                        ? `<br><small class="muted">HOD remarks: ${esc(request.hodRemarks)}</small>`
                        : ""
                    }
                </p>

                ${
                    request.status === "Pending"
                    ?
                    `
                    <div class="actions">

                        <button
                            class="btn success"
                            onclick="respondMarkRequest('${esc(request.id)}','Approved')"
                        >
                            ✔ Approve
                        </button>

                        <button
                            class="btn danger"
                            onclick="respondMarkRequest('${esc(request.id)}','Rejected')"
                        >
                            ✕ Reject
                        </button>

                    </div>
                    `
                    :
                    ""
                }

            </div>

            `
        )
        .join("")
        ||
        `
            <div class="empty">
                No ${filterValue !== "All" ? filterValue.toLowerCase() + " " : ""}mark change requests.
            </div>
        `;

}


function respondMarkRequest(requestId,decision){

    const request =
        db.markRequests.find(
            item => item.id === requestId
        );

    if(!request){

        toast("Request not found.");

        return;

    }

    if(request.status !== "Pending"){

        toast("This request has already been reviewed.");

        return;

    }

    let remarks = "";

    if(decision === "Rejected"){

        remarks =
            prompt(
                "Optional: add a reason for rejecting this request."
            ) || "";

    }

    request.status = decision;

    request.respondedAt = new Date().toLocaleString();

    request.hodRemarks = remarks;


    if(decision === "Approved"){

        let markRecord =
            db.marks.find(
                mark => mark.studentId === request.studentId
            );

        if(!markRecord){

            markRecord = {
                studentId:request.studentId,
                ca1:0,
                ca2:0,
                model:0,
                average:0
            };

            db.marks.push(markRecord);

        }

        markRecord[request.exam] = request.requestedMark;

        markRecord.average =
            Math.round(
                (
                    (markRecord.ca1 || 0) +
                    (markRecord.ca2 || 0) +
                    (markRecord.model || 0)
                ) / 3
            );

    }


    const facultyUser =
        db.users.find(
            user => user.facultyId === request.facultyId
        );

    addNotice(
        decision === "Approved"
        ? "Mark change approved"
        : "Mark change rejected",
        `${currentUser.name} ${decision.toLowerCase()} the mark change request for ${request.studentName} (${request.examLabel} — ${request.subjectCategory}).${remarks ? " Remarks: " + remarks : ""}`,
        facultyUser ? facultyUser.email : "faculty"
    );

    addNotice(
        decision === "Approved"
        ? "Your mark was updated"
        : "Mark change request update",
        decision === "Approved"
        ? `Your ${request.examLabel} mark for ${request.subjectCategory} has been updated to ${request.requestedMark}.`
        : `A requested change to your ${request.examLabel} mark for ${request.subjectCategory} was not approved.`,
        request.studentId
    );


    save();

    renderHodMarkRequests();

    renderHodDashboardStats();

    toast(`Request ${decision.toLowerCase()}.`);

}
