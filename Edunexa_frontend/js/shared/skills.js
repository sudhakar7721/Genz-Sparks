/* =========================================================
   SKILLS
========================================================= */

function skillsHTML(student){

    const skillNames = [
        "Python",
        "SQL",
        "Power BI",
        "Excel",
        "Communication"
    ];


    return skillNames
        .map(
            skill => {

                const value =
                    student.skills?.[skill] ?? 0;


                return `

                <div class="skill">

                    <div class="skill-top">

                        <b>
                            ${skill}
                        </b>

                        <span>
                            ${value}%
                        </span>

                    </div>

                    <div class="progress">

                        <i
                            style="width:${Math.max(
                                0,
                                Math.min(100,value)
                            )}%"
                        ></i>

                    </div>

                </div>

                `;

            }
        )
        .join("");

}



/* =========================================================
   SKILL DONUT CHART
========================================================= */

function skillLevelColor(value){

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


function skillLevelTag(value){

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


function donutSVG(value,color){

    const size = 96;

    const stroke = 10;

    const radius = (size - stroke) / 2;

    const circumference = 2 * Math.PI * radius;

    const clamped = Math.max(0,Math.min(100,value));

    const offset =
        circumference -
        (clamped / 100) * circumference;


    return `

        <svg
            width="${size}"
            height="${size}"
            viewBox="0 0 ${size} ${size}"
        >

            <circle
                cx="${size / 2}"
                cy="${size / 2}"
                r="${radius}"
                fill="none"
                stroke="#edf0f6"
                stroke-width="${stroke}"
            ></circle>

            <circle
                cx="${size / 2}"
                cy="${size / 2}"
                r="${radius}"
                fill="none"
                stroke="${color}"
                stroke-width="${stroke}"
                stroke-linecap="round"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
            ></circle>

            <text
                x="${size / 2}"
                y="${size / 2}"
                text-anchor="middle"
                dominant-baseline="middle"
                class="donut-value"
            >
                ${clamped}%
            </text>

        </svg>

    `;

}


function skillsDonutHTML(student){

    const skillNames = [
        "Python",
        "SQL",
        "Power BI",
        "Excel",
        "Communication"
    ];


    return `

        <div class="donut-grid">

            ${
                skillNames
                .map(
                    skill => {

                        const value =
                            student.skills?.[skill] ?? 0;

                        const color =
                            skillLevelColor(value);

                        const [tagLabel,tagClass] =
                            skillLevelTag(value);


                        return `

                        <div class="donut-item">

                            ${donutSVG(value,color)}

                            <div class="donut-name">
                                ${esc(skill)}
                            </div>

                            <span
                                class="donut-tag badge ${tagClass}"
                            >
                                ${tagLabel}
                            </span>

                        </div>

                        `;

                    }
                )
                .join("")
            }

        </div>

    `;

}



/* =========================================================
   ROLE MATCHING
========================================================= */

const ROLE_PROFILES = {

    "Data Analyst":{
        Python:15,
        SQL:30,
        "Power BI":25,
        Excel:20,
        Communication:10
    },

    "Business Intelligence (BI) Developer":{
        Python:10,
        SQL:30,
        "Power BI":35,
        Excel:15,
        Communication:10
    },

    "Data Scientist":{
        Python:35,
        SQL:25,
        "Power BI":10,
        Excel:10,
        Communication:20
    },

    "Database / SQL Developer":{
        Python:15,
        SQL:45,
        "Power BI":10,
        Excel:10,
        Communication:20
    },

    "Business Analyst":{
        Python:5,
        SQL:20,
        "Power BI":20,
        Excel:30,
        Communication:25
    }

};


const ROLE_TIPS = {

    "Data Analyst":
        "Strong all-round fit: cleaning data, building dashboards and reporting insights to teams.",

    "Business Intelligence (BI) Developer":
        "Focused on building interactive Power BI reports and reliable data models for decision-makers.",

    "Data Scientist":
        "Uses Python and statistics to build predictive models — needs the deepest programming skill.",

    "Database / SQL Developer":
        "Designs, queries and optimizes databases that power every other application.",

    "Business Analyst":
        "Bridges business needs and data using Excel, communication and light SQL/reporting skill."

};


function computeRoleMatches(student){

    const skills =
        student.skills || {};


    return Object.entries(ROLE_PROFILES)
        .map(
            ([role,weights]) => {

                let weightedTotal = 0;

                let weightSum = 0;


                Object.entries(weights).forEach(
                    ([skill,weight]) => {

                        const value =
                            skills[skill] ?? 0;

                        weightedTotal +=
                            value * weight;

                        weightSum += weight;

                    }
                );


                const score =
                    weightSum > 0
                    ?
                    Math.round(
                        weightedTotal / weightSum
                    )
                    :
                    0;


                return {
                    role,
                    score,
                    weights
                };

            }
        )
        .sort(
            (a,b) => b.score - a.score
        );

}


function roleSuggestionHTML(student){

    const matches =
        computeRoleMatches(student);

    const top =
        matches[0];

    const others =
        matches.slice(1,3);


    function weakestSkillsFor(weights,skills){

        return Object.keys(weights)
            .sort(
                (a,b) =>
                    weights[b] - weights[a]
            )
            .filter(
                skill => (skills[skill] ?? 0) < 75
            )
            .slice(0,3);

    }


    const gapSkills =
        weakestSkillsFor(
            top.weights,
            student.skills || {}
        );


    return `

        <div class="role-card top">

            <div class="role-top">

                <div>

                    <b style="font-size:15px">
                        🏆 ${esc(top.role)}
                    </b>

                    <p class="muted" style="margin-top:5px">
                        ${esc(ROLE_TIPS[top.role])}
                    </p>

                </div>

                <div class="role-match">
                    ${top.score}%
                    match
                </div>

            </div>

            <div class="role-bar">

                <i style="width:${top.score}%"></i>

            </div>

            ${
                gapSkills.length
                ?
                `
                <p style="font-size:11px;margin-top:8px">
                    <b>Learn next:</b>
                    ${
                        gapSkills
                            .map(esc)
                            .join(", ")
                    }
                    — these skills matter most for this role
                    and currently need improvement.
                </p>
                `
                :
                `
                <p style="font-size:11px;margin-top:8px">
                    You already meet the key skill bar for
                    this role. Keep practicing real projects
                    to build a portfolio.
                </p>
                `
            }

        </div>


        <p class="muted" style="font-size:11px;margin:14px 0 8px">
            Other close-fit roles
        </p>

        ${
            others
            .map(
                item => `

                <div class="role-card">

                    <div class="role-top">

                        <b>${esc(item.role)}</b>

                        <span class="muted">
                            ${item.score}% match
                        </span>

                    </div>

                    <div class="role-bar">

                        <i style="width:${item.score}%;background:linear-gradient(90deg,#c7c4ff,var(--primary))"></i>

                    </div>

                </div>

                `
            )
            .join("")
        }

    `;

}



/* =========================================================
   SKILL IMPROVEMENT SUGGESTIONS
========================================================= */

const SKILL_ADVICE = {

    Python:
        "Practice small daily coding problems and build one end-to-end mini-project (data cleaning + analysis script).",

    SQL:
        "Rewrite your assignment queries using JOINs, GROUP BY and window functions on a sample database.",

    "Power BI":
        "Recreate one real dashboard (attendance, fees, or sales sample data) using DAX measures and slicers.",

    Excel:
        "Practice pivot tables, VLOOKUP/XLOOKUP and basic formulas on a real dataset each week.",

    Communication:
        "Present your project findings out loud to a friend or record a 2-minute summary video weekly."

};


function skillSuggestionsHTML(student){

    const skills =
        student.skills || {};


    const ranked =
        Object.entries(skills)
            .sort(
                (a,b) => a[1] - b[1]
            );


    if(ranked.length === 0){

        return `
            <div class="empty">
                No skill data yet.
            </div>
        `;

    }


    return ranked
        .map(
            ([skill,value]) => {

                const [tagLabel,tagClass] =
                    skillLevelTag(value);


                return `

                <div class="gap-row">

                    <div>

                        <b>${esc(skill)}</b>
                        <span class="muted">(${value}%)</span>

                        <div class="muted" style="margin-top:3px">
                            ${esc(SKILL_ADVICE[skill] || "")}
                        </div>

                    </div>

                    <span class="badge ${tagClass}">
                        ${tagLabel}
                    </span>

                </div>

                `;

            }
        )
        .join("");

}


