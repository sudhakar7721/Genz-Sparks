/* =========================================================
   FACULTY PAGES
========================================================= */

function facultyPages(){

    return `

    <!-- FACULTY DASHBOARD -->

    <div
        class="page"
        id="faculty-dashboard"
    >

        <div class="welcome">

            <div>

                <h1>
                    Faculty Dashboard 👨‍🏫
                </h1>

                <p>
                    Class, assessment, attendance
                    and student monitoring.
                </p>

            </div>

            <button
                class="btn primary"
                onclick="go('faculty-tests')"
            >
                Create Test
            </button>

        </div>


        <div class="stats">

            ${stat(
                "Assigned Students",
                "52",
                "Class strength"
            )}

            ${stat(
                "Average Attendance",
                "84%",
                "Department"
            )}

            ${stat(
                "Pending Leaves",
                db.leaves.filter(
                    l => l.status === "Pending"
                ).length,
                "Requires review"
            )}

            ${stat(
                "Assessments",
                db.tests.length + db.assignments.length,
                "Published"
            )}

        </div>


        <div class="grid2">

            <div class="card">

                <div class="card-head">

                    <div>

                        <h3>
                            Assessment Center
                        </h3>

                        <p>
                            Tests and assignments
                            created by faculty.
                        </p>

                    </div>

                </div>


                <div class="grid3">

                    <div class="item">

                        <b>
                            ${db.tests.length}
                        </b>

                        <p>
                            Tests
                        </p>

                    </div>


                    <div class="item">

                        <b>
                            ${db.assignments.length}
                        </b>

                        <p>
                            Assignments
                        </p>

                    </div>


                    <div class="item">

                        <b>
                            ${db.submissions.length}
                        </b>

                        <p>
                            Submissions
                        </p>

                    </div>

                </div>

            </div>


            <div class="card">

                <div class="card-head">

                    <div>

                        <h3>
                            Mentor Access
                        </h3>

                        <p>
                            View student skills and progress.
                        </p>

                    </div>

                </div>

                ${
                    currentUser.mentor
                    ?
                    `
                    <button
                        class="btn primary"
                        onclick="go('mentor-skills')"
                    >
                        Open Skill Dashboard
                    </button>
                    `
                    :
                    `
                    <div class="notice">
                        Mentor access is not enabled
                        for this account.
                    </div>
                    `
                }

            </div>

        </div>


        ${
            currentUser.classAdviser
            ?
            `
            <div class="card">

                <div class="card-head">

                    <div>

                        <h3>
                            Class Adviser Full Access
                        </h3>

                        <p>
                            Manage marks, attendance,
                            leaves, tests, assignments,
                            fees and notifications.
                        </p>

                    </div>

                    <button
                        class="btn primary"
                        onclick="go('adviser-dashboard')"
                    >
                        Open Adviser Console
                    </button>

                </div>

            </div>
            `
            :
            ""
        }

    </div>


    <!-- FACULTY TESTS -->

    <div
        class="page"
        id="faculty-tests"
    >

        <div class="page-title">

            <h1>
                Test Portal — Faculty
            </h1>

            <p>
                Create tests, set dates and
                notify students.
            </p>

        </div>


        <div class="card">

            <form onsubmit="createTest(event)">

                <div class="form-grid">

                    <div class="form-group">

                        <label>
                            Test Title
                        </label>

                        <input
                            id="testTitle"
                            class="control"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Subject
                        </label>

                        <input
                            id="testSubject"
                            class="control"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Start Date
                        </label>

                        <input
                            id="testStart"
                            type="date"
                            class="control"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Due Date
                        </label>

                        <input
                            id="testDue"
                            type="date"
                            class="control"
                            required
                        >

                    </div>


                    <div class="form-group full">

                        <label>
                            Question 1
                        </label>

                        <input
                            id="q1"
                            class="control"
                            placeholder="Question | A | B | C | D | Correct number"
                            required
                        >

                    </div>


                    <div class="form-group full">

                        <label>
                            Question 2
                        </label>

                        <input
                            id="q2"
                            class="control"
                            placeholder="Question | A | B | C | D | Correct number"
                            required
                        >

                    </div>


                    <div class="full">

                        <button
                            class="btn primary"
                            type="submit"
                        >
                            Publish Test & Notify Students
                        </button>

                    </div>

                </div>

            </form>

        </div>


        <div class="card">

            <h3>
                Published Tests
            </h3>

            <div
                id="facultyTestList"
                class="list"
                style="margin-top:15px"
            ></div>

        </div>

    </div>


    <!-- FACULTY ASSIGNMENTS -->

    <div
        class="page"
        id="faculty-assignments"
    >

        <div class="page-title">

            <h1>
                Assignment Portal — Faculty
            </h1>

            <p>
                Create assignment, deadline
                and notify students.
            </p>

        </div>


        <div class="card">

            <form onsubmit="createAssignment(event)">

                <div class="form-grid">

                    <div class="form-group">

                        <label>
                            Assignment Title
                        </label>

                        <input
                            id="asTitle"
                            class="control"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Subject
                        </label>

                        <input
                            id="asSubject"
                            class="control"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Assigned Date
                        </label>

                        <input
                            id="asAssigned"
                            type="date"
                            class="control"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            Due Date
                        </label>

                        <input
                            id="asDue"
                            type="date"
                            class="control"
                            required
                        >

                    </div>


                    <div class="form-group full">

                        <label>
                            Description
                        </label>

                        <textarea
                            id="asDesc"
                            class="control"
                            rows="4"
                            required
                        ></textarea>

                    </div>


                    <div class="full">

                        <button
                            class="btn primary"
                            type="submit"
                        >
                            Publish Assignment & Notify
                        </button>

                    </div>

                </div>

            </form>

        </div>


        <div class="card">

            <h3>
                Published Assignments
            </h3>

            <div
                id="facultyAssignmentList"
                class="list"
                style="margin-top:15px"
            ></div>

        </div>

    </div>


    <!-- ATTENDANCE -->

    <div
        class="page"
        id="faculty-attendance"
    >

        <div class="page-title">

            <h1>
                Attendance Management
            </h1>

            <p>
                Faculty/class adviser can mark
                and review attendance.
            </p>

        </div>


        <div class="card">

            <div class="card-head">

                <h3>
                    Data Analytics — II Year
                </h3>

                <button
                    class="btn primary"
                    onclick="saveAttendance()"
                >
                    Save Attendance
                </button>

            </div>


            <div class="table-wrap">

                <table>

                    <thead>

                        <tr>

                            <th>Student</th>
                            <th>ID</th>
                            <th>Attendance</th>
                            <th>Today</th>
                            <th>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${
                            students()
                            .map(
                                student => `

                                <tr>

                                    <td>
                                        ${esc(student.name)}
                                    </td>

                                    <td>
                                        ${esc(student.studentId)}
                                    </td>

                                    <td>
                                        ${student.attendance || 0}%
                                    </td>

                                    <td>

                                        <select
                                            class="control attendance-select"
                                            data-id="${esc(student.studentId)}"
                                            style="padding:6px"
                                        >

                                            <option>
                                                Present
                                            </option>

                                            <option>
                                                Absent
                                            </option>

                                        </select>

                                    </td>

                                    <td>

                                        <button
                                            class="btn secondary"
                                            onclick="updateAttendance('${esc(student.studentId)}')"
                                        >
                                            Update
                                        </button>

                                    </td>

                                </tr>

                            `
                            )
                            .join("")
                        }

                    </tbody>

                </table>

            </div>

        </div>

    </div>


    <!-- LEAVES -->

    <div
        class="page"
        id="faculty-leaves"
    >

        <div class="page-title">

            <h1>
                Leave Requests
            </h1>

            <p>
                Approve/reject student leave.
                Approval notifies student and parent.
            </p>

        </div>


        <div
            id="facultyLeaves"
            class="list"
        ></div>

    </div>


    <!-- MARKS -->

    <div
        class="page"
        id="faculty-marks"
    >

        <div class="page-title">

            <h1>
                Marks & Results — Full Access
            </h1>

            <p>
                Faculty can update marks directly, or send
                a correction to the HOD for approval.
            </p>

        </div>


        <div class="card">

            <div class="table-wrap">

                <table>

                    <thead>

                        <tr>

                            <th>Student</th>
                            <th>ID</th>
                            <th>CA 1</th>
                            <th>CA 2</th>
                            <th>Model</th>
                            <th>Average</th>
                            <th>Action</th>
                            <th>Approval</th>

                        </tr>

                    </thead>


                    <tbody>

                        ${
                            students()
                            .map(
                                student => `

                                <tr>

                                    <td>
                                        ${esc(student.name)}
                                    </td>

                                    <td>
                                        ${esc(student.studentId)}
                                    </td>

                                    <td>

                                        <input
                                            class="control"
                                            id="m1-${esc(student.studentId)}"
                                            value="82"
                                            style="width:70px"
                                        >

                                    </td>

                                    <td>

                                        <input
                                            class="control"
                                            id="m2-${esc(student.studentId)}"
                                            value="86"
                                            style="width:70px"
                                        >

                                    </td>

                                    <td>

                                        <input
                                            class="control"
                                            id="m3-${esc(student.studentId)}"
                                            value="90"
                                            style="width:70px"
                                        >

                                    </td>

                                    <td>
                                        86%
                                    </td>

                                    <td>

                                        <button
                                            class="btn primary"
                                            onclick="saveMark('${esc(student.studentId)}')"
                                        >
                                            Save
                                        </button>

                                    </td>

                                    <td>

                                        <button
                                            class="btn secondary"
                                            onclick="openMarkRequestModal('${esc(student.studentId)}')"
                                        >
                                            Request Change
                                        </button>

                                    </td>

                                </tr>

                            `
                            )
                            .join("")
                        }

                    </tbody>

                </table>

            </div>

        </div>

    </div>


    <!-- FACULTY MARK CHANGE REQUESTS -->

    <div
        class="page"
        id="faculty-mark-requests"
    >

        <div class="page-title">

            <h1>
                Mark Change Requests
            </h1>

            <p>
                Track the status of the mark correction
                requests you have sent to the HOD.
            </p>

        </div>

        <div class="card">

            <div class="card-head">

                <div>

                    <h3>
                        My Requests
                    </h3>

                    <p>
                        Pending requests are awaiting HOD review.
                        Approved changes are applied automatically.
                    </p>

                </div>

                <button
                    class="btn secondary"
                    onclick="renderFacultyMarkRequests()"
                >
                    ↻ Refresh
                </button>

            </div>

            <div
                id="facultyMarkRequestsList"
                class="list"
            ></div>

        </div>

    </div>


    <!-- MENTOR -->

    <div
        class="page"
        id="mentor-skills"
    >

        <div class="page-title">

            <h1>
                Mentor — Student Skill Dashboard 🧭
            </h1>

            <p>
                Mentor access: view student skill
                progress and identify support areas.
            </p>

        </div>

        ${mentorOverviewHTML()}

        <div class="card">

            <div class="card-head">

                <div>

                    <h3>
                        Student Skill Table
                    </h3>

                    <p>
                        Ranked by overall skill average,
                        highest first.
                    </p>

                </div>

            </div>

            <div class="table-wrap">

                <table>

                    <thead>

                        <tr>

                            <th>Student</th>
                            <th>Attendance</th>
                            <th>Python</th>
                            <th>SQL</th>
                            <th>Power BI</th>
                            <th>Excel</th>
                            <th>Communication</th>
                            <th>Avg</th>
                            <th>Performance</th>
                            <th>Action</th>

                        </tr>

                    </thead>


                    <tbody>

                        ${
                            mentorRankedStudents()
                            .map(
                                ({student,avg}) => `

                                <tr>

                                    <td>
                                        <b>
                                            ${esc(student.name)}
                                        </b>
                                    </td>

                                    <td>
                                        ${student.attendance || 0}%
                                    </td>

                                    ${
                                        [
                                            "Python",
                                            "SQL",
                                            "Power BI",
                                            "Excel",
                                            "Communication"
                                        ]
                                        .map(
                                            skill => `
                                                <td>
                                                    ${
                                                        student.skills?.[skill] ?? 0
                                                    }%
                                                </td>
                                            `
                                        )
                                        .join("")
                                    }

                                    <td>
                                        <b>${avg}%</b>
                                    </td>

                                    <td>

                                        <span
                                            class="badge ${mentorSkillLevelTag(avg)[1]}"
                                        >
                                            ${mentorSkillLevelTag(avg)[0]}
                                        </span>

                                    </td>

                                    <td>

                                        <button
                                            class="btn secondary"
                                            onclick="mentorView('${esc(student.studentId)}')"
                                        >
                                            View
                                        </button>

                                    </td>

                                </tr>

                            `
                            )
                            .join("")
                            ||
                            `
                                <tr>
                                    <td
                                        colspan="9"
                                        class="empty"
                                    >
                                        No assigned students yet.
                                    </td>
                                </tr>
                            `
                        }

                    </tbody>

                </table>

            </div>

        </div>

    </div>


    <!-- ADVISER DASHBOARD -->

    <div
        class="page"
        id="adviser-dashboard"
    >

        <div class="page-title">

            <h1>
                Class Adviser Console ⭐
            </h1>

            <p>
                Full access to assigned class:
                marks, attendance, leave, tests,
                assignments, fees and notifications.
            </p>

        </div>


        <div class="stats">

            ${stat(
                "Students",
                students().length,
                "Assigned class"
            )}

            ${stat(
                "Pending Leaves",
                db.leaves.filter(
                    l => l.status === "Pending"
                ).length,
                "Review now"
            )}

            ${stat(
                "Pending Fees",
                "₹22,000",
                "Class fee alerts"
            )}

            ${stat(
                "Assessments",
                db.tests.length + db.assignments.length,
                "Published"
            )}

        </div>


        <div class="grid3">

            <button
                class="card"
                onclick="go('faculty-marks')"
            >

                <h3>
                    🎯 Marks
                </h3>

                <p class="muted">
                    View and update full student marks.
                </p>

            </button>


            <button
                class="card"
                onclick="go('faculty-attendance')"
            >

                <h3>
                    📅 Attendance
                </h3>

                <p class="muted">
                    Monitor class attendance.
                </p>

            </button>


            <button
                class="card"
                onclick="go('faculty-leaves')"
            >

                <h3>
                    🗓️ Leave
                </h3>

                <p class="muted">
                    Approve/reject requests.
                </p>

            </button>


            <button
                class="card"
                onclick="go('faculty-tests')"
            >

                <h3>
                    📝 Tests
                </h3>

                <p class="muted">
                    Create and publish tests.
                </p>

            </button>


            <button
                class="card"
                onclick="go('faculty-assignments')"
            >

                <h3>
                    📋 Assignments
                </h3>

                <p class="muted">
                    Create and track assignments.
                </p>

            </button>


            <button
                class="card"
                onclick="go('adviser-fees')"
            >

                <h3>
                    💳 Fees
                </h3>

                <p class="muted">
                    View student fee details.
                </p>

            </button>
            <button class="card" onclick="go('adviser-feedback')">
                <h3>💬 Feedback</h3>
                <p class="muted">Review student feedback and respond.</p>
            </button>

        </div>

    </div>


    <!-- ADVISER FEEDBACK -->
    <div class="page" id="adviser-feedback">
        <div class="page-title">
            <h1>Student Feedback Console 💬</h1>
            <p>Class Adviser review center for infrastructure, academic/lab and event/function feedback.</p>
        </div>
        <div class="stats">
            ${stat("Total Feedback", db.feedbacks.length, "All submitted")}
            ${stat("Submitted", db.feedbacks.filter(f=>f.status==="Submitted").length, "Needs review")}
            ${stat("Action Taken", db.feedbacks.filter(f=>f.status==="Action Taken").length, "Resolved workflow")}
            ${stat("Average Rating", feedbackAverageRating()+" / 5", "Class feedback")}
        </div>
        <div class="card">
            <div class="card-head">
                <div><h3>Feedback Inbox</h3><p>Filter, review, respond and update the feedback status.</p></div>
                <button class="btn secondary" onclick="renderAdviserFeedback()">↻ Refresh</button>
            </div>
            <div class="feedback-filter">
                <input id="adviserFeedbackSearch" class="control" oninput="renderAdviserFeedback()" placeholder="Search student / feedback / ID">
                <select id="adviserFeedbackType" class="control" onchange="renderAdviserFeedback()">
                    <option value="">All Types</option><option value="infrastructure">Class & College Infrastructure</option><option value="academic">Subjects, Faculty & Labs</option><option value="event">Events & Functions</option>
                </select>
                <select id="adviserFeedbackStatus" class="control" onchange="renderAdviserFeedback()">
                    <option value="">All Status</option><option value="Submitted">Submitted</option><option value="Reviewed">Reviewed</option><option value="Action Taken">Action Taken</option><option value="Closed">Closed</option>
                </select>
                <select id="adviserFeedbackPriority" class="control" onchange="renderAdviserFeedback()">
                    <option value="">All Priority</option><option value="Urgent">Urgent</option><option value="Important">Important</option><option value="Normal">Normal</option>
                </select>
            </div>
            <div id="adviserFeedbackList"></div>
        </div>
        <div class="card">
            <div class="card-head"><div><h3>Feedback Analytics</h3><p>Quick summary to identify areas that need attention.</p></div></div>
            <div class="grid3" id="adviserFeedbackAnalytics"></div>
        </div>
    </div>


    <!-- ADVISER FEES -->

    <div
        class="page"
        id="adviser-fees"
    >

        <div class="page-title">

            <h1>
                Student Fees — Class Adviser
            </h1>

            <p>
                Full fee visibility for assigned students.
            </p>

        </div>


        <div id="adviserFees"></div>

    </div>


    <!-- PARENT NOTIFICATION -->

    <div
        class="page"
        id="adviser-notify"
    >

        <div class="page-title">

            <h1>
                Parent Notifications
            </h1>

            <p>
                Send academic, attendance and fee
                notifications to students and parents.
            </p>

        </div>


        <div class="card">

            <form onsubmit="sendParentNotice(event)">

                <div class="form-grid">

                    <div class="form-group">

                        <label>
                            Student
                        </label>

                        <select
                            id="noticeStudent"
                            class="control"
                        >

                            ${
                                students()
                                .map(
                                    student => `
                                    <option
                                        value="${esc(student.studentId)}"
                                    >
                                        ${esc(student.name)}
                                        —
                                        ${esc(student.studentId)}
                                    </option>
                                    `
                                )
                                .join("")
                            }

                        </select>

                    </div>


                    <div class="form-group">

                        <label>
                            Type
                        </label>

                        <select
                            id="noticeType"
                            class="control"
                        >

                            <option>
                                Fee Reminder
                            </option>

                            <option>
                                Attendance Alert
                            </option>

                            <option>
                                Academic Update
                            </option>

                            <option>
                                General
                            </option>

                        </select>

                    </div>


                    <div class="form-group full">

                        <label>
                            Message
                        </label>

                        <textarea
                            id="noticeMessage"
                            class="control"
                            rows="4"
                            required
                        ></textarea>

                    </div>


                    <div class="full">

                        <button
                            class="btn primary"
                            type="submit"
                        >
                            Notify Student + Parent + Adviser
                        </button>

                    </div>

                </div>

            </form>

        </div>

    </div>

    `;

}
