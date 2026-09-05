/* =========================================================
   FACULTY TESTS
========================================================= */

function createTest(event){

    event.preventDefault();


    const title =
        document
            .getElementById("testTitle")
            .value.trim();

    const subject =
        document
            .getElementById("testSubject")
            .value.trim();

    const start =
        document
            .getElementById("testStart")
            .value;

    const due =
        document
            .getElementById("testDue")
            .value;


    if(new Date(due) < new Date(start)){

        toast("Due date cannot be before start date.");

        return;

    }


    function parseQuestion(value){

        const parts =
            value
                .split("|")
                .map(item => item.trim());


        if(parts.length < 6){

            throw new Error(
                "Question format is invalid."
            );

        }


        const answer =
            Number(parts[5]);


        if(
            !Number.isInteger(answer) ||
            answer < 1 ||
            answer > 4
        ){

            throw new Error(
                "Correct option must be 1 to 4."
            );

        }


        return {

            q:parts[0],

            opts:[
                parts[1],
                parts[2],
                parts[3],
                parts[4]
            ],

            ans:answer - 1

        };

    }


    let questions;


    try{

        questions = [

            parseQuestion(
                document
                    .getElementById("q1")
                    .value
            ),

            parseQuestion(
                document
                    .getElementById("q2")
                    .value
            )

        ];

    }catch(error){

        toast(error.message);

        return;

    }


    const test = {

        id:Date.now(),

        title,

        subject,

        className:document.getElementById("testClass")?.value || currentUser.className || currentUser.classesHandled?.[0] || "II B.Sc Data Analytics",

        faculty:currentUser.name,

        start,

        due,

        questions

    };


    db.tests.push(test);


    addNotice(
        "New test published",
        `${title} is available from ${start} to ${due}.`,
        "all"
    );


    save();

    refreshAll();

    event.target.reset();

    toast("Test published and students notified.");

}


function renderFacultyTests(){

    const element =
        document.getElementById(
            "facultyTestList"
        );


    if(!element){

        return;

    }


    element.innerHTML =
        db.tests
        .map(
            test => `

            <div class="item">

                <b>
                    ${esc(test.title)}
                </b>

                <p>
                    ${esc(test.subject)}
                    • Class: ${esc(test.className || "All")}
                    • ${esc(test.start)}
                    →
                    ${esc(test.due)}
                    • ${test.questions.length}
                    questions
                </p>

            </div>

            `
        )
        .join("")
        ||
        `
            <div class="empty">
                No tests published.
            </div>
        `;

}


