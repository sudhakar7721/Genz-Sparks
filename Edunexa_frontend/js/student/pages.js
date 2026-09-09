/* =========================================================
   STUDENT PAGES
========================================================= */

function studentPages(){

    return `

    <!-- STUDENT DASHBOARD -->

    <div
        class="page"
        id="student-dashboard"
    >

        <div class="welcome">

            <div>

                <h1>
                    Good morning,
                    ${esc(currentUser.name)} 👋
                </h1>

                <p>
                    Your academic, attendance,
                    skills and fee overview.
                </p>

            </div>

            <button
                class="btn primary"
                onclick="go('student-tests')"
            >
                View Tests
            </button>

        </div>


        <div class="stats">

            ${stat(
                "Attendance",
                (currentUser.attendance || 0) + "%",
                "Current semester"
            )}

            ${stat(
                "Current Average",
                "82%",
                "Academic performance"
            )}

            ${stat(
                "Pending Tasks",
                db.tests.length + db.assignments.length,
                "Tests + assignments"
            )}

            ${stat(
                "Pending Fees",
                "₹22,000",
                "Payable balance"
            )}

        </div>


        <div class="grid2">

            <div class="card">

                <div class="card-head">

                    <div>

                        <h3>
                            Skill Dashboard
                        </h3>

                        <p>
                            Track employability skills
                        </p>

                    </div>

                    <button
                        class="btn secondary"
                        onclick="go('student-skills')"
                    >
                        Open
                    </button>

                </div>

                ${skillsHTML(currentUser)}

            </div>


            <div class="card">

                <div class="card-head">

                    <div>

                        <h3>
                            Upcoming Work
                        </h3>

                        <p>
                            Complete before due dates
                        </p>

                    </div>

                </div>

                ${workHTML()}

            </div>

        </div>


        <div class="card">
            <div class="card-head">
                <div><h3>Feedback Center 💬</h3><p>Send class, academic/lab or event feedback to your Class Adviser.</p></div>
                <button class="btn primary" onclick="go('student-feedback')">Give Feedback</button>
            </div>
            <div class="grid3">
                <div class="item"><b>${db.feedbacks.filter(f=>f.studentId===currentUser.studentId).length}</b><p>My Feedback</p></div>
                <div class="item"><b>${db.feedbacks.filter(f=>f.studentId===currentUser.studentId && f.status==="Submitted").length}</b><p>Awaiting Review</p></div>
                <div class="item"><b>${feedbackAverageRating(db.feedbacks.filter(f=>f.studentId===currentUser.studentId))}/5</b><p>My Average Rating</p></div>
            </div>
        </div>

        <div class="card">

            <div class="card-head">

                <div>

                    <h3>
                        Recent Notifications
                    </h3>

                </div>

                <button
                    class="btn secondary"
                    onclick="go('notifications')"
                >
                    View all
                </button>

            </div>

            <div id="dashNotices"></div>

        </div>

    </div>


    <!-- ACADEMICS -->

    <div
        class="page"
        id="student-academics"
    >

        <div class="page-title">

            <h1>
                Marks & Academic Records
            </h1>

            <p>
                View marks, test scores and assignment marks.
            </p>

        </div>


        <div class="stats">

            ${stat(
                "Current Average",
                "82%",
                "Overall"
            )}

            ${stat(
                "Tests Completed",
                db.submissions.filter(
                    s =>
                        s.studentId === currentUser.studentId &&
                        s.type === "test"
                ).length,
                "Submitted"
            )}

            ${stat(
                "Assignments Completed",
                db.submissions.filter(
                    s =>
                        s.studentId === currentUser.studentId &&
                        s.type === "assignment"
                ).length,
                "Submitted"
            )}

            ${stat(
                "Teacher Access",
                "Full",
                "Marks visible"
            )}

        </div>


        <div class="card">

            <div class="card-head">

                <h3>
                    Assessment Marks
                </h3>

            </div>


            <div class="table-wrap">

                <table>

                    <thead>

                        <tr>

                            <th>Assessment</th>
                            <th>Subject</th>
                            <th>Base Marks</th>
                            <th>Deadline Score</th>
                            <th>Final</th>
                            <th>Status</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${
                            db.submissions
                            .filter(
                                s =>
                                    s.studentId ===
                                    currentUser.studentId
                            )
                            .map(
                                s => `

                                <tr>

                                    <td>
                                        ${esc(s.title)}
                                    </td>

                                    <td>
                                        ${esc(s.subject)}
                                    </td>

                                    <td>
                                        ${s.baseMarks ?? "-"}
                                    </td>

                                    <td>
                                        ${s.deadlineMarks ?? "-"}
                                    </td>

                                    <td>
                                        <b>
                                            ${s.finalMarks ?? "-"}
                                        </b>
                                    </td>

                                    <td>

                                        <span
                                            class="badge ${
                                                s.status === "Submitted"
                                                    ? "green"
                                                    : "yellow"
                                            }"
                                        >
                                            ${esc(s.status)}
                                        </span>

                                    </td>

                                </tr>

                            `
                            )
                            .join("")
                            ||
                            `
                                <tr>
                                    <td
                                        colspan="6"
                                        class="empty"
                                    >
                                        No submissions yet.
                                    </td>
                                </tr>
                            `
                        }

                    </tbody>

                </table>

            </div>

        </div>

    </div>


    <!-- TESTS -->

    <div
        class="page"
        id="student-tests"
    >

        <div class="page-title">

            <h1>
                Test Portal 📝
            </h1>

            <p>
                Complete faculty-created tests
                within the allowed date.
            </p>

        </div>

        <div
            id="studentTests"
            class="list"
        ></div>

    </div>


    <!-- ASSIGNMENTS -->

    <div
        class="page"
        id="student-assignments"
    >

        <div class="page-title">

            <h1>
                Assignment Portal 📋
            </h1>

            <p>
                Submit assignments and receive
                deadline-based marks.
            </p>

        </div>

        <div
            id="studentAssignments"
            class="list"
        ></div>

    </div>


    <!-- ATTENDANCE -->

    <div
        class="page"
        id="student-attendance"
    >

        <div class="page-title">

            <h1>
                Attendance Portal
            </h1>

            <p>
                Monitor attendance and leave.
            </p>

        </div>


        <div class="stats">

            ${stat(
                "Overall Attendance",
                (currentUser.attendance || 0) + "%",
                "Current semester"
            )}

            ${stat(
                "Present Days",
                "103",
                "Out of 120"
            )}

            ${stat(
                "Absent Days",
                "17",
                "This semester"
            )}

            ${stat(
                "Leave Requests",
                db.leaves.filter(
                    l =>
                        l.studentId ===
                        currentUser.studentId
                ).length,
                "Submitted"
            )}

        </div>


        <div class="card">

            <h3>
                Subject Attendance
            </h3>


            <div class="skill">

                <div class="skill-top">

                    <b>Python</b>

                    <span>92%</span>

                </div>

                <div class="progress">

                    <i
                        style="width:92%;background:var(--green)"
                    ></i>

                </div>

            </div>


            <div class="skill">

                <div class="skill-top">

                    <b>SQL</b>

                    <span>86%</span>

                </div>

                <div class="progress">

                    <i
                        style="width:86%"
                    ></i>

                </div>

            </div>


            <div class="skill">

                <div class="skill-top">

                    <b>Statistics</b>

                    <span>80%</span>

                </div>

                <div class="progress">

                    <i
                        style="width:80%;background:var(--yellow)"
                    ></i>

                </div>

            </div>

        </div>

    </div>


    <!-- FEES -->

    <div
        class="page"
        id="student-fees"
    >

        <div class="page-title">

            <h1>
                Student Fees 💳
            </h1>

            <p>
                Tuition, bus, hostel, payment
                and pending details.
            </p>

        </div>

        ${feeCard(currentUser.studentId,true)}

    </div>


    <!-- LEAVE -->

    <div
        class="page"
        id="student-leave"
    >

        <div class="page-title">

            <h1>
                Leave Management
            </h1>

            <p>
                Submit leave to your faculty/class adviser.
            </p>

        </div>


        <div class="card">

            <form onsubmit="submitLeave(event)">

                <div class="form-grid">

                    <div class="form-group">

                        <label>
                            Leave Type
                        </label>

                        <select
                            id="leaveType"
                            class="control"
                            required
                        >

                            <option>
                                Medical Leave
                            </option>

                            <option>
                                Personal Leave
                            </option>

                            <option>
                                On Duty
                            </option>

                            <option>
                                Emergency Leave
                            </option>

                        </select>

                    </div>


                    <div class="form-group">

                        <label>
                            From Date
                        </label>

                        <input
                            id="leaveFrom"
                            type="date"
                            class="control"
                            required
                        >

                    </div>


                    <div class="form-group">

                        <label>
                            To Date
                        </label>

                        <input
                            id="leaveTo"
                            type="date"
                            class="control"
                            required
                        >

                    </div>


                    <div class="form-group full">

                        <label>
                            Reason
                        </label>

                        <textarea
                            id="leaveReason"
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
                            Submit Leave Request
                        </button>

                    </div>

                </div>

            </form>

        </div>


        <div class="card">

            <h3>
                My Leave Requests
            </h3>

            <div
                id="studentLeaves"
                class="list"
                style="margin-top:15px"
            ></div>

        </div>

    </div>


    <!-- SKILLS -->

    <div
        class="page"
        id="student-skills"
    >

        <div class="page-title">

            <h1>
                My Skill Dashboard 🧠
            </h1>

            <p>
                Skill progress visible to you
                and your assigned mentor.
            </p>

        </div>


        <div class="card">

            <div class="card-head">

                <div>

                    <h3>
                        Skill Breakdown
                    </h3>

                    <p>
                        Each ring shows how close you are
                        to full proficiency in that skill.
                    </p>

                </div>

            </div>

            ${skillsDonutHTML(currentUser)}

        </div>


        <div class="card">

            <div class="card-head">

                <div>

                    <h3>
                        Recommended Role To Learn 🎯
                    </h3>

                    <p>
                        Based on your current skill levels,
                        here is the best-fit career path
                        and what to learn next.
                    </p>

                </div>

            </div>

            ${roleSuggestionHTML(currentUser)}

        </div>


        <div class="card">

            <div class="card-head">

                <div>

                    <h3>
                        Suggestions To Improve 💡
                    </h3>

                    <p>
                        Focus areas and quick tips,
                        weakest skill first.
                    </p>

                </div>

            </div>

            ${skillSuggestionsHTML(currentUser)}

        </div>

    </div>


    <!-- STUDENT FEEDBACK -->
    <div class="page" id="student-feedback">
        <div class="page-title">
            <h1>Student Feedback 💬</h1>
            <p>Your feedback is routed to your Class Adviser for review and action.</p>
        </div>

        <div class="card">
            <div class="card-head">
                <div>
                    <h3>Choose Feedback Type</h3>
                    <p>Submit feedback under one of the three academic categories.</p>
                </div>
                <span class="badge blue">3 Types</span>
            </div>

            <div class="feedback-type-grid">
                <button type="button" class="feedback-type-card active" data-feedback-type="infrastructure" onclick="selectFeedbackType('infrastructure',this)">
                    <span>🏫</span>
                    <b>Class & College Infrastructure</b>
                    <small>Classrooms, library, campus, cleanliness, internet, facilities and other infrastructure.</small>
                </button>
                <button type="button" class="feedback-type-card" data-feedback-type="academic" onclick="selectFeedbackType('academic',this)">
                    <span>📚</span>
                    <b>Subjects, Faculty & Labs</b>
                    <small>Give separate feedback about a subject, faculty member and laboratory experience.</small>
                </button>
                <button type="button" class="feedback-type-card" data-feedback-type="event" onclick="selectFeedbackType('event',this)">
                    <span>🎉</span>
                    <b>Events & Functions</b>
                    <small>Share feedback about college events, functions, seminars, workshops and sessions.</small>
                </button>
            </div>

            <form onsubmit="submitFeedback(event)" id="feedbackForm">
                <input type="hidden" id="feedbackType" value="infrastructure">

                <div class="feedback-meta">
                    <div class="form-group">
                        <label>Feedback Area</label>
                        <select id="feedbackArea" class="control" required>
                            <option>Classroom</option>
                            <option>Library</option>
                            <option>Campus Cleanliness</option>
                            <option>Internet / Wi-Fi</option>
                            <option>College Facilities</option>
                            <option>Other Infrastructure</option>
                        </select>
                    </div>
                    <div class="form-group hidden" id="feedbackSubjectWrap">
                        <label>Subject</label>
                        <select id="feedbackSubject" class="control">
                            <option>Python</option><option>SQL</option><option>Power BI</option><option>Excel</option><option>Data Analytics</option><option>Communication</option><option>Other Subject</option>
                        </select>
                    </div>
                    <div class="form-group hidden" id="feedbackFacultyWrap">
                        <label>Faculty</label>
                        <select id="feedbackFaculty" class="control">
                            <option>Dr. Priya</option><option>Faculty Member</option><option>Other Faculty</option>
                        </select>
                    </div>
                    <div class="form-group hidden" id="feedbackLabWrap">
                        <label>Lab</label>
                        <select id="feedbackLab" class="control">
                            <option>Computer Lab</option><option>Data Analytics Lab</option><option>Python Lab</option><option>Other Lab</option>
                        </select>
                    </div>
                    <div class="form-group hidden" id="feedbackEventWrap">
                        <label>Event / Function</label>
                        <input id="feedbackEvent" class="control" placeholder="e.g. Seminar, Workshop, College Day">
                    </div>
                    <div class="form-group hidden" id="feedbackSessionWrap">
                        <label>Session / Speaker</label>
                        <input id="feedbackSession" class="control" placeholder="Session or speaker name">
                    </div>
                </div>

                <div class="form-group">
                    <label>Rating</label>
                    <div class="rating" aria-label="5 star rating">
                        <input type="radio" id="star5" name="feedbackRating" value="5" checked><label for="star5">★</label>
                        <input type="radio" id="star4" name="feedbackRating" value="4"><label for="star4">★</label>
                        <input type="radio" id="star3" name="feedbackRating" value="3"><label for="star3">★</label>
                        <input type="radio" id="star2" name="feedbackRating" value="2"><label for="star2">★</label>
                        <input type="radio" id="star1" name="feedbackRating" value="1"><label for="star1">★</label>
                    </div>
                </div>

                <div class="form-group">
                    <label>Feedback / Suggestions</label>
                    <textarea id="feedbackMessage" class="control" rows="5" maxlength="1000" required placeholder="Write your feedback clearly..."></textarea>
                </div>

                <div class="form-group">
                    <label>Priority</label>
                    <select id="feedbackPriority" class="control">
                        <option value="Normal">Normal</option>
                        <option value="Important">Important</option>
                        <option value="Urgent">Urgent</option>
                    </select>
                </div>

                <div class="actions">
                    <button class="btn primary" type="submit">📨 Send to Class Adviser</button>
                    <button class="btn secondary" type="button" onclick="resetFeedbackForm()">Reset</button>
                </div>
            </form>
        </div>

        <div class="card">
            <div class="card-head">
                <div><h3>Feedback Workflow</h3><p>Track how your feedback reaches the Class Adviser.</p></div>
            </div>
            <div class="feedback-flow">
                <div class="flow-step">👨‍🎓 Student submits</div><div class="flow-arrow">→</div>
                <div class="flow-step">📨 Sent to Class Adviser</div><div class="flow-arrow">→</div>
                <div class="flow-step">🔎 Review → Action → Response</div>
            </div>
        </div>

        <div class="card">
            <div class="card-head">
                <div><h3>My Feedback History</h3><p>See submitted feedback, status and adviser responses.</p></div>
                <span class="badge blue" id="studentFeedbackCount">0</span>
            </div>
            <div id="studentFeedbackList"></div>
        </div>
    </div>

    `;

}


