/* =========================================================
   ASSIGNMENTS
========================================================= */

function renderStudentAssignments(){

    const element =
        document.getElementById(
            "studentAssignments"
        );


    if(!element){

        return;

    }


    if(db.assignments.length === 0){

        element.innerHTML = `
            <div class="card empty">
                No assignments available.
            </div>
        `;

        return;

    }


    element.innerHTML =
        db.assignments
        .map(
            assignment => {

                const submission =
                    db.submissions.find(
                        item =>
                            item.itemId === assignment.id &&
                            item.studentId ===
                                currentUser.studentId &&
                            item.type === "assignment"
                    );


                return `

                <div class="card">

                    <div class="item-top">

                        <div>

                            <h3>
                                ${esc(assignment.title)}
                            </h3>

                            <p>
                                ${esc(assignment.subject)}
                                • Due:
                                ${esc(assignment.due)}
                            </p>

                        </div>


                        <span
                            class="badge ${
                                submission
                                ? "green"
                                : "yellow"
                            }"
                        >
                            ${
                                submission
                                ? submission.finalMarks +
                                  " marks"
                                : "Not submitted"
                            }
                        </span>

                    </div>


                    <p style="margin-top:10px">
                        ${esc(assignment.description)}
                    </p>


                    <div class="actions">

                        ${
                            submission
                            ?
                            `
                            <button
                                class="btn secondary"
                                disabled
                            >
                                Submitted
                            </button>
                            `
                            :
                            `
                            <button
                                class="btn primary"
                                onclick="submitAssignment(${assignment.id})"
                            >
                                Submit Assignment
                            </button>
                            `
                        }

                    </div>

                </div>

                `;

            }
        )
        .join("");

}


function submitAssignment(id){

    const assignment =
        db.assignments.find(
            item => item.id === id
        );


    if(!assignment){

        toast("Assignment not found.");

        return;

    }


    openModal(

        "Submit Assignment",


        `

        <form
            onsubmit="finishAssignment(event,${id})"
        >

            <p class="muted">
                ${esc(assignment.description)}
            </p>


            <div class="form-group">

                <label>
                    Your Answer / Work
                </label>

                <textarea
                    id="assignmentAnswer"
                    class="control"
                    rows="6"
                    required
                ></textarea>

            </div>


            <div class="form-group">
                <label>Upload Assignment File (optional)</label>
                <input id="studentAssignmentFile" type="file" class="control" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt">
            </div>

            <div class="form-group">

                <label>
                    Submission Date
                </label>

                <input
                    id="assignmentDate"
                    type="date"
                    class="control"
                    value="${today()}"
                    required
                >

            </div>


            <button
                class="btn primary"
                type="submit"
            >
                Submit Assignment
            </button>

        </form>

        `

    );

}


function finishAssignment(event,id){

    event.preventDefault();


    const assignment =
        db.assignments.find(
            item => item.id === id
        );


    const date =
        document
            .getElementById("assignmentDate")
            .value;


    const answer =
        document
            .getElementById("assignmentAnswer")
            .value.trim();


    if(!answer){

        toast("Enter your assignment answer.");

        return;

    }


    const deadline =
        deadlineMarks(
            assignment.due,
            date
        );


    db.submissions.push({

        type:"assignment",

        itemId:assignment.id,

        studentId:currentUser.studentId,

        title:assignment.title,

        subject:assignment.subject,

        baseMarks:100,

        deadlineMarks:deadline,

        finalMarks:deadline,

        status:"Submitted",

        submittedAt:date,

        answer:answer

    });


    addNotice(
        "Assignment submitted",
        `${assignment.title}: ${deadline}/5 deadline marks.`,
        currentUser.studentId
    );


    save();

    closeModal();

    refreshAll();

    toast("Assignment submitted successfully.");

}


