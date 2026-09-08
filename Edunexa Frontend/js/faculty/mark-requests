/* =========================================================
   FACULTY -> HOD MARK CHANGE REQUESTS
========================================================= */

const MARK_EXAM_LABELS = {
    ca1:"C1 (CA 1)",
    ca2:"C2 (CA 2)",
    model:"Model Exam"
};


function currentMarkFor(studentId,examKey){

    const record =
        db.marks.find(
            mark => mark.studentId === studentId
        );

    if(!record){

        return 0;

    }

    return record[examKey] ?? 0;

}


function facultySubjectOptions(){

    const subjects =
        [
            ...(currentUser.basicSubjects || []),
            ...(currentUser.extraSubjects || [])
        ];

    if(subjects.length === 0){

        subjects.push("General");

    }

    return subjects
        .map(
            subject => `
                <option value="${esc(subject)}">
                    ${esc(subject)}
                </option>
            `
        )
        .join("");

}



/* =========================================================
   MODAL
========================================================= */

function openMarkRequestModal(studentId){

    const student = getStudent(studentId);

    if(!student){

        toast("Student not found.");

        return;

    }

    openModal(
        `Request Mark Change — ${student.name}`,
        markRequestModalBody(studentId)
    );

    updateMarkRequestPreview(studentId);

}


function markRequestModalBody(studentId){

    return `

        <form onsubmit="submitMarkRequest(event,'${esc(studentId)}')">

            <div class="form-grid">

                <div class="form-group">

                    <label>
                        Exam
                    </label>

                    <select
                        id="mrExam"
                        class="control"
                        required
                        onchange="updateMarkRequestPreview('${esc(studentId)}')"
                    >

                        <option value="ca1">C1 (CA 1)</option>

                        <option value="ca2" selected>C2 (CA 2)</option>

                        <option value="model">Model Exam</option>

                    </select>

                </div>


                <div class="form-group">

                    <label>
                        Subject / Category
                    </label>

                    <select
                        id="mrSubject"
                        class="control"
                        required
                    >

                        ${facultySubjectOptions()}

                    </select>

                </div>


                <div class="form-group">

                    <label>
                        Current Mark
                    </label>

                    <input
                        id="mrCurrent"
                        class="control"
                        readonly
                    >

                </div>


                <div class="form-group">

                    <label>
                        Requested Mark
                    </label>

                    <input
                        id="mrRequested"
                        type="number"
                        min="0"
                        max="100"
                        class="control"
                        required
                    >

                </div>


                <div class="form-group full">

                    <label>
                        Reason for Change
                    </label>

                    <textarea
                        id="mrReason"
                        class="control"
                        rows="4"
                        required
                        placeholder="Explain why this mark needs correction (revaluation, entry error, missed answer, etc.)"
                    ></textarea>

                </div>


                <div class="full">

                    <button
                        class="btn primary"
                        type="submit"
                    >
                        Submit for HOD Approval
                    </button>

                </div>

            </div>

        </form>

    `;

}


function updateMarkRequestPreview(studentId){

    const examKey =
        document.getElementById("mrExam").value;

    document
        .getElementById("mrCurrent")
        .value = currentMarkFor(studentId,examKey);

}



/* =========================================================
   SUBMIT REQUEST
========================================================= */

function submitMarkRequest(event,studentId){

    event.preventDefault();

    const student = getStudent(studentId);

    if(!student){

        toast("Student not found.");

        return;

    }

    const examKey =
        document.getElementById("mrExam").value;

    const subjectCategory =
        document.getElementById("mrSubject").value;

    const currentMark =
        Number(
            document.getElementById("mrCurrent").value
        ) || 0;

    const requestedMark =
        Number(
            document.getElementById("mrRequested").value
        );

    const reason =
        document
            .getElementById("mrReason")
            .value.trim();


    if(
        Number.isNaN(requestedMark) ||
        requestedMark < 0 ||
        requestedMark > 100
    ){

        toast("Requested mark must be between 0 and 100.");

        return;

    }

    if(requestedMark === currentMark){

        toast("Requested mark is the same as the current mark.");

        return;

    }

    if(!reason){

        toast("Please provide a reason for the mark change.");

        return;

    }


    db.markRequests.push({

        id:"MR-" + Date.now(),

        studentId:student.studentId,

        studentName:student.name,

        facultyId:currentUser.facultyId,

        facultyName:currentUser.name,

        exam:examKey,

        examLabel:MARK_EXAM_LABELS[examKey],

        subjectCategory,

        currentMark,

        requestedMark,

        reason,

        status:"Pending",

        createdAt:new Date().toLocaleString(),

        respondedAt:"",

        hodRemarks:""

    });


    addNotice(
        "Mark change request submitted",
        `${currentUser.name} requested a mark change for ${student.name} (${MARK_EXAM_LABELS[examKey]} — ${subjectCategory}). Awaiting HOD approval.`,
        "hod"
    );


    save();

    closeModal();

    toast("Mark change request sent to HOD for approval.");


    const requestsPage =
        document.getElementById("faculty-mark-requests");

    if(requestsPage && requestsPage.classList.contains("active")){

        renderFacultyMarkRequests();

    }

}



/* =========================================================
   FACULTY REQUEST HISTORY
========================================================= */

function renderFacultyMarkRequests(){

    const container =
        document.getElementById("facultyMarkRequestsList");

    if(!container){

        return;

    }

    const list =
        db.markRequests
            .filter(
                request => request.facultyId === currentUser.facultyId
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

            </div>

            `
        )
        .join("")
        ||
        `
            <div class="empty">
                No mark change requests submitted yet.
            </div>
        `;

}
