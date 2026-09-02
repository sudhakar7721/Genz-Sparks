/* =========================================================
   MENTOR — CLASS PERFORMANCE ANALYTICS
========================================================= */

const MENTOR_SKILL_NAMES = [
    "Python",
    "SQL",
    "Power BI",
    "Excel",
    "Communication"
];


function mentorSkillLevelColor(value){

    if(value >= 85){

        return "var(--green)";

    }

    if(value >= 70){

        return "var(--primary)";

    }

    if(value >= 50){

        return "var(--yellow)";

    }

    return "var(--red)";

}


function mentorSkillLevelTag(value){

    if(value >= 85){

        return ["Strong","green"];

    }

    if(value >= 70){

        return ["Good","blue"];

    }

    if(value >= 50){

        return ["Growing","yellow"];

    }

    return ["Needs Work","red"];

}


function mentorRankedStudents(){

    return students()
        .map(
            student => {

                const skills =
                    student.skills || {};

                const sum =
                    MENTOR_SKILL_NAMES.reduce(
                        (total,skill) =>
                            total + (skills[skill] ?? 0),
                        0
                    );

                const avg =
                    Math.round(
                        sum / MENTOR_SKILL_NAMES.length
                    );

                return {
                    student,
                    avg
                };

            }
        )
        .sort(
            (a,b) => b.avg - a.avg
        );

}


function mentorOverviewHTML(){

    const ranked =
        mentorRankedStudents();


    if(ranked.length === 0){

        return `
            <div class="card empty">
                No assigned students yet.
            </div>
        `;

    }


    const classAvg =
        Math.round(
            ranked.reduce(
                (total,item) => total + item.avg,
                0
            )
            / ranked.length
        );


    const top =
        ranked[0];


    const weak =
        ranked.filter(
            item => item.avg < 60
        );


    const perSkillAvg = {};


    MENTOR_SKILL_NAMES.forEach(
        skill => {

            const total =
                students().reduce(
                    (sum,student) =>
                        sum + (student.skills?.[skill] ?? 0),
                    0
                );

            perSkillAvg[skill] =
                Math.round(
                    total / ranked.length
                );

        }
    );


    return `

        <div class="stats">

            ${stat(
                "Assigned Students",
                ranked.length,
                "Under mentorship"
            )}

            ${stat(
                "Class Skill Average",
                classAvg + "%",
                "Across 5 tracked skills"
            )}

            ${stat(
                "Top Performer",
                top.student.name,
                top.avg + "% average"
            )}

            ${stat(
                "Needs Attention",
                weak.length,
                "Below 60% average"
            )}

        </div>


        <div class="card">

            <div class="card-head">

                <div>

                    <h3>
                        Class Skill Averages
                    </h3>

                    <p>
                        Where the whole class is strong
                        vs where to focus mentoring.
                    </p>

                </div>

            </div>

            <div class="chart">

                ${
                    MENTOR_SKILL_NAMES
                    .map(
                        skill => `

                        <div class="bar-wrap">

                            <div
                                class="bar"
                                style="height:${perSkillAvg[skill]}%;background:linear-gradient(180deg,${mentorSkillLevelColor(perSkillAvg[skill])},#9e99ff)"
                            ></div>

                            <label>
                                ${esc(skill)}
                                <br>
                                ${perSkillAvg[skill]}%
                            </label>

                        </div>

                        `
                    )
                    .join("")
                }

            </div>

        </div>


        ${
            weak.length
            ?
            `
            <div class="card">

                <div class="card-head">

                    <div>

                        <h3>
                            🔎 Students Needing Attention
                        </h3>

                        <p>
                            Overall skill average below 60% —
                            prioritize mentoring here.
                        </p>

                    </div>

                </div>

                <div class="list">

                    ${
                        weak
                        .map(
                            item => `

                            <div class="item">

                                <div class="item-top">

                                    <b>
                                        ${esc(item.student.name)}
                                    </b>

                                    <span class="badge red">
                                        ${item.avg}% avg
                                    </span>

                                </div>

                                <p>
                                    ${esc(item.student.studentId)}
                                    • Attendance
                                    ${item.student.attendance || 0}%
                                </p>

                            </div>

                            `
                        )
                        .join("")
                    }

                </div>

            </div>
            `
            :
            ""
        }

    `;

}



/* =========================================================
   MENTOR
========================================================= */

function mentorView(studentId){

    const student =
        getStudent(studentId);


    if(!student){

        toast("Student not found.");

        return;

    }


    openModal(

        "Mentor Skill View",


        `

        <h3>
            ${esc(student.name)}
        </h3>

        <p class="muted">
            ${esc(student.studentId)}
            • Attendance
            ${student.attendance || 0}%
        </p>

        <div style="margin-top:15px">

            ${skillsHTML(student)}

        </div>

        `

    );

}


