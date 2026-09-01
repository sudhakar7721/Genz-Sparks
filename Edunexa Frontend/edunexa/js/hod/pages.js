/* =========================================================
   HOD PAGES
========================================================= */

function hodPages(){

    if(currentUser.role !== "hod"){

        // Keep the template available for anyone logged in, but
        // the HOD detail card below reads currentUser fields, so
        // only build real content when a HOD is signed in.
        return `

            <div class="page" id="hod-dashboard"></div>
            <div class="page" id="hod-mark-requests"></div>
            <div class="page" id="hod-faculty"></div>

        `;

    }

    return `

    <!-- HOD DASHBOARD -->

    <div
        class="page"
        id="hod-dashboard"
    >

        <div class="welcome">

            <div>

                <h1>
                    HOD Dashboard 🧑‍💼
                </h1>

                <p>
                    Department overview and faculty
                    mark-correction approvals.
                </p>

            </div>

            <button
                class="btn primary"
                onclick="go('hod-mark-requests')"
            >
                Review Requests
            </button>

        </div>


        <div
            id="hodDashboardStats"
            class="stats"
        ></div>


        <div class="grid2">

            <div class="card">

                <div class="card-head">

                    <div>

                        <h3>
                            HOD Details
                        </h3>

                        <p>
                            Department & profile information.
                        </p>

                    </div>

                </div>

                <div class="list">

                    <div class="item">
                        <b>${esc(currentUser.name)}</b>
                        <p>
                            HOD ID: ${esc(currentUser.hodId || "-")}
                            <br>
                            Designation: ${esc(currentUser.designation || "Head of Department")}
                            <br>
                            Department: ${esc(currentUser.department || "-")}
                            <br>
                            Qualification: ${esc(currentUser.qualification || "-")}
                            <br>
                            Experience: ${esc(currentUser.experience || "-")}
                            <br>
                            Office: ${esc(currentUser.office || "-")}
                            <br>
                            Phone: ${esc(currentUser.phone || "-")}
                            <br>
                            Email: ${esc(currentUser.email || "-")}
                        </p>
                    </div>

                    ${
                        currentUser.extraInfo
                        ?
                        `
                        <div class="item">
                            <p>${esc(currentUser.extraInfo)}</p>
                        </div>
                        `
                        :
                        ""
                    }

                </div>

            </div>


            <div class="card">

                <div class="card-head">

                    <div>

                        <h3>
                            Quick Links
                        </h3>

                        <p>
                            Common HOD actions.
                        </p>

                    </div>

                </div>

                <div class="grid3">

                    <button
                        class="card"
                        onclick="go('hod-mark-requests')"
                    >
                        <h3>✅ Approvals</h3>
                        <p class="muted">
                            Review pending mark change requests.
                        </p>
                    </button>

                    <button
                        class="card"
                        onclick="go('hod-faculty')"
                    >
                        <h3>👨‍🏫 Faculty</h3>
                        <p class="muted">
                            View department faculty directory.
                        </p>
                    </button>

                    <button
                        class="card"
                        onclick="go('notifications')"
                    >
                        <h3>🔔 Notifications</h3>
                        <p class="muted">
                            View recent department activity.
                        </p>
                    </button>

                </div>

            </div>

        </div>

    </div>


    <!-- HOD MARK REQUESTS -->

    <div
        class="page"
        id="hod-mark-requests"
    >

        <div class="page-title">

            <h1>
                Mark Change Approval Requests
            </h1>

            <p>
                Approve or reject faculty requests to change a
                student's C1 / C2 / Model Exam mark. Approved
                changes are applied to the student's record
                immediately.
            </p>

        </div>

        <div class="card">

            <div class="card-head">

                <div>

                    <h3>
                        Requests
                    </h3>

                    <p>
                        Filter by status.
                    </p>

                </div>

                <select
                    id="hodRequestFilter"
                    class="control"
                    style="width:180px"
                    onchange="renderHodMarkRequests()"
                >

                    <option value="Pending" selected>Pending</option>

                    <option value="Approved">Approved</option>

                    <option value="Rejected">Rejected</option>

                    <option value="All">All</option>

                </select>

            </div>

            <div
                id="hodMarkRequestsList"
                class="list"
            ></div>

        </div>

    </div>


    <!-- HOD FACULTY DIRECTORY -->

    <div
        class="page"
        id="hod-faculty"
    >

        <div class="page-title">

            <h1>
                Faculty Directory
            </h1>

            <p>
                Faculty members and the subjects they handle.
            </p>

        </div>

        <div class="card">

            <div
                id="hodFacultyList"
            ></div>

        </div>

    </div>

    `;

}



/* =========================================================
   DASHBOARD STATS
========================================================= */

function renderHodDashboardStats(){

    const element =
        document.getElementById("hodDashboardStats");

    if(!element){

        return;

    }

    const pending =
        db.markRequests.filter(
            request => request.status === "Pending"
        ).length;

    const approved =
        db.markRequests.filter(
            request => request.status === "Approved"
        ).length;

    const rejected =
        db.markRequests.filter(
            request => request.status === "Rejected"
        ).length;

    const facultyCount =
        db.users.filter(
            user =>
                user.role === "faculty" &&
                user.department === currentUser.department
        ).length;

    element.innerHTML = `

        ${stat("Pending Approvals",pending,"Needs your review")}

        ${stat("Approved Requests",approved,"Mark changes applied")}

        ${stat("Rejected Requests",rejected,"Declined by HOD")}

        ${stat("Department Faculty",facultyCount,currentUser.department || "")}

    `;

}


function renderHodDashboard(){

    renderHodDashboardStats();

}



/* =========================================================
   FACULTY DIRECTORY
========================================================= */

function renderHodFacultyList(){

    const container =
        document.getElementById("hodFacultyList");

    if(!container){

        return;

    }

    const facultyList =
        db.users.filter(
            user => user.role === "faculty"
        );

    container.innerHTML = `

        <div class="table-wrap">

            <table>

                <thead>

                    <tr>

                        <th>Name</th>
                        <th>Faculty ID</th>
                        <th>Designation</th>
                        <th>Basic Subjects</th>
                        <th>Extra Subjects</th>
                        <th>Roles</th>

                    </tr>

                </thead>

                <tbody>

                    ${
                        facultyList
                        .map(
                            faculty => `

                            <tr>

                                <td>${esc(faculty.name)}</td>

                                <td>${esc(faculty.facultyId)}</td>

                                <td>${esc(faculty.designation || faculty.position || "-")}</td>

                                <td>${esc((faculty.basicSubjects || []).join(", ") || "-")}</td>

                                <td>${esc((faculty.extraSubjects || []).join(", ") || "-")}</td>

                                <td>
                                    ${faculty.classAdviser ? "Class Adviser " : ""}
                                    ${faculty.mentor ? "Mentor" : ""}
                                </td>

                            </tr>

                            `
                        )
                        .join("")
                        ||
                        `
                            <tr>
                                <td colspan="6" class="empty">
                                    No faculty found.
                                </td>
                            </tr>
                        `
                    }

                </tbody>

            </table>

        </div>

    `;

}
