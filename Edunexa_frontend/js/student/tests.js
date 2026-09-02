/* =========================================================
   STUDENT TESTS
========================================================= */

function renderStudentTests(){

    const element =
        document.getElementById(
            "studentTests"
        );


    if(!element){

        return;

    }


    if(db.tests.length === 0){

        element.innerHTML = `
            <div class="card empty">
                No tests available.
            </div>
        `;

        return;

    }


    element.innerHTML =
        db.tests
        .filter(test => !test.className || test.className === (currentUser.className || currentUser.class || currentUser.classesHandled?.[0] || "II B.Sc Data Analytics"))
        .map(
            test => {

                const submission =
                    db.submissions.find(
                        item =>
                            item.itemId === test.id &&
                            item.studentId ===
                                currentUser.studentId &&
                            item.type === "test"
                    );


                return `

                <div class="card">

                    <div class="item-top">

                        <div>

                            <h3>
                                ${esc(test.title)}
                            </h3>

                            <p>
                                ${esc(test.subject)}
                                • Faculty:
                                ${esc(test.faculty)}
                                • Due:
                                ${esc(test.due)}
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


                    <div class="actions">

                        ${
                            submission
                            ?
                            `
                            <button
                                class="btn secondary"
                                disabled
                            >
                                Completed
                            </button>
                            `
                            :
                            `
                            <button
                                class="btn primary"
                                onclick="takeTest(${test.id})"
                            >
                                Start Test
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



/* =========================================================
   TAKE TEST
========================================================= */

function takeTest(id){

    const test =
        db.tests.find(
            item => item.id === id
        );


    if(!test){

        toast("Test not found.");

        return;

    }


    const body =
        test.questions
        .map(
            (question,index) => `

            <div class="form-group">

                <label>
                    ${index + 1}.
                    ${esc(question.q)}
                </label>


                ${
                    question.opts
                    .map(
                        (option,optionIndex) => `

                        <label
                            style="display:block;margin:6px 0"
                        >

                            <input
                                type="radio"
                                name="testQuestion${index}"
                                value="${optionIndex}"
                                required
                            >

                            ${esc(option)}

                        </label>

                        `
                    )
                    .join("")
                }

            </div>

            `
        )
        .join("");


    openModal(

        test.title,


        `
        <form
            onsubmit="submitTest(event,${id})"
        >

            ${body}

            <div class="form-group">
                <label>Upload Answer / Supporting File (optional)</label>
                <input id="studentTestFile" type="file" class="control" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.txt">
            </div>

            <button
                class="btn primary"
                type="submit"
            >
                Submit Test
            </button>

        </form>
        `

    );

}



/* =========================================================
   DEADLINE MARKS
========================================================= */

function deadlineMarks(due,submitted){

    const difference =
        Math.floor(
            (
                new Date(submitted) -
                new Date(due)
            )
            /
            (1000 * 60 * 60 * 24)
        );


    if(difference <= 0){

        return 5;

    }

    if(difference <= 2){

        return 4;

    }

    if(difference <= 5){

        return 3;

    }

    return 2;

}



/* =========================================================
   SUBMIT TEST
========================================================= */

function submitTest(event,id){

    event.preventDefault();


    const test =
        db.tests.find(
            item => item.id === id
        );


    if(!test){

        toast("Test not found.");

        return;

    }


    let correct = 0;


    test.questions.forEach(
        (question,index) => {

            const selected =
                document.querySelector(
                    `input[name="testQuestion${index}"]:checked`
                );


            if(
                selected &&
                Number(selected.value) === question.ans
            ){

                correct++;

            }

        }
    );


    const maximum =
        test.questions.length;


    const score =
        maximum > 0
        ?
        Math.round(
            correct / maximum * 100
        )
        :
        0;


    const submissionDate =
        today();


    const deadline =
        deadlineMarks(
            test.due,
            submissionDate
        );


    const finalMarks =
        Math.round(
            score * deadline / 5
        );


    db.submissions.push({

        type:"test",

        itemId:test.id,

        studentId:currentUser.studentId,

        title:test.title,

        subject:test.subject,

        baseMarks:score,

        deadlineMarks:deadline,

        finalMarks:finalMarks,

        status:"Submitted",

        submittedAt:submissionDate

    });


    addNotice(
        "Test submitted",
        `${test.title}: ${score}% base score; deadline mark ${deadline}/5.`,
        currentUser.studentId
    );


    save();

    closeModal();

    refreshAll();

    toast("Test submitted successfully.");

}


