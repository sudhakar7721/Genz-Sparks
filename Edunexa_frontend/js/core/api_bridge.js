/* =========================================================
   EDUNEXA FRONTEND <-> BACKEND BRIDGE
   =========================================================
   Loaded LAST (after all frontend scripts).

   What this file does
   -------------------
   1. Overrides login / register / logout so authentication runs
      against the real FastAPI backend (JWT stored in
      localStorage["edunexa_token"]).
   2. Restores a saved session through GET /api/auth/me.
   3. Loads real backend data into the existing in-memory `db`
      object (db.users, db.marks, db.fees, db.feedbacks, db.leaves,
      db.tests, db.assignments, db.submissions, db.notifications...)
      so every page shows server data.
   4. Wraps save() so that changes made in the UI are written back
      to the backend (feedback, leaves, tests, assignments,
      submissions, student records, marks, achievements...).
   5. Shows a small backend connection status chip on the login screen.

   Offline / demo fallback
   -----------------------
   If the backend is not running the app keeps working with the
   original localStorage demo data (this is intentional).
   ========================================================= */

(function () {
    "use strict";

    if (!window.EduNexaAPI) return; // API client not loaded -> nothing to bridge

    var API = window.EduNexaAPI;
    var DB_KEY = "edunexa_v4";
    var originalSave = window.save && window.save.bind(window);

    /* ---------------------------------------------------------
       Small utilities
       --------------------------------------------------------- */
    function hasToken() {
        return !!localStorage.getItem("edunexa_token");
    }

    function toNumber(v, d) { var n = Number(v); return isNaN(n) ? (d || 0) : n; }

    function parseList(s) {
        if (Array.isArray(s)) return s;
        if (!s) return [];
        try { var x = JSON.parse(s); return Array.isArray(x) ? x : []; } catch (e) { return []; }
    }

    function defaultSkills() {
        return { Python: 0, SQL: 0, "Power BI": 0, Excel: 0, Communication: 0 };
    }

    function feedbackTypeLabelOf(type) {
        if (typeof window.feedbackTypeLabel === "function") return window.feedbackTypeLabel(type);
        return { infrastructure: "Class & College Infrastructure", academic: "Subjects, Faculty & Labs", event: "Events & Functions" }[type] || type;
    }

    /* Map a backend user row (snake_case) to the frontend user shape. */
    function mapUser(u) {
        if (!u) return null;
        var classes = parseList(u.classes_handled);
        var subjects = parseList(u.subjects_handled);
        var isAdviser = u.is_class_adviser ? true : !!u.is_class_adviser;
        var isMentor = u.is_mentor ? true : !!u.is_mentor;
        return {
            id: u.id,
            name: u.name || "",
            email: (u.email || "").toLowerCase(),
            password: "",
            role: u.role || "student",
            studentId: u.student_id || "",
            facultyId: u.faculty_id || "",
            hodId: u.hod_id || "",
            adminId: u.role === "management" ? "ADM-" + u.id : "",
            department: u.department || "Data Analytics",
            batch: u.batch || "",
            attendance: toNumber(u.attendance, 0),
            phone: u.phone || "",
            parentName: u.parent_name || "",
            parentPhone: u.parent_phone || "",
            designation: u.designation || "",
            qualification: u.qualification || "",
            experience: u.experience || "",
            specialization: u.specialization || "",
            office: u.office || "",
            position: u.designation || "Faculty",
            classAdviser: isAdviser,
            mentor: isMentor,
            isClassAdviser: isAdviser,
            classesHandled: classes,
            basicSubjects: subjects,
            extraSubjects: subjects,
            subjectsHandled: subjects,
            extraInfo: u.extra_info || "",
            classAdviserName: u.class_adviser_name || "",
            mentorName: u.mentor_name || "",
            assignedClassName: u.assigned_class_name || "",
            skills: defaultSkills()
        };
    }

    /* Map an internal integer user id to the frontend string id used by the UI. */
    function uidToStringId(intId) {
        intId = Number(intId);
        var u = (db.users || []).find(function (x) { return Number(x.id) === intId; });
        if (u && u.studentId) return u.studentId;
        return currentUser && Number(currentUser.id) === intId ? (currentUser.studentId || currentUser.facultyId || currentUser.hodId || currentUser.email) : String(intId);
    }

    /* Look up the backend integer id for a frontend string student id. */
    function backendStudentId(sid) {
        var u = (db.users || []).find(function (x) { return x.studentId === sid; });
        if (u && u.id) return u.id;
        if (currentUser && currentUser.studentId === sid && currentUser.id) return currentUser.id;
        return null;
    }

    function normalizeStatus(s) {
        if (!s) return "Submitted";
        var low = String(s).toLowerCase();
        if (low === "open") return "Submitted";
        if (low === "declined" || low === "rejected") return "Rejected";
        if (low === "approved") return "Approved";
        if (low === "pending") return "Pending";
        if (low === "action taken" || low === "action_taken") return "Action Taken";
        return s.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    }

    function norm(v) { return String(v == null ? "" : v).trim().toLowerCase(); }

    function backendLeaveType(t) {
        var s = String(t || "").toLowerCase();
        if (s.indexOf("half") >= 0) return "half_day";
        return "full_day";
    }

    function feedbackCategory(f) {
        return f.type === "academic" ? "subject" : "non_subject";
    }

    /* ---------------------------------------------------------
       Merging helpers (keep demo content + overlay server data)
       --------------------------------------------------------- */
    function mergeUsers(list) {
        if (!Array.isArray(list)) return;
        list.forEach(function (u) {
            if (!u) return;
            var existing = db.users.find(function (x) {
                return (u.email && x.email === u.email) ||
                    (u.student_id && x.studentId === u.student_id) ||
                    (u.faculty_id && x.facultyId === u.faculty_id) ||
                    (u.hod_id && x.hodId === u.hod_id);
            });
            var mapped = mapUser(u);
            if (existing) {
                var oldAttendance = existing.attendance;
                Object.keys(mapped).forEach(function (k) {
                    existing[k] = mapped[k];
                });
                if (!mapped.attendance && oldAttendance) existing.attendance = oldAttendance;
                if (!existing.password) existing.password = "";
            } else {
                db.users.push(mapped);
            }
        });
    }

    function refreshCurrentUserFromDb() {
        if (!currentUser) return;
        var fresh = (db.users || []).find(function (x) {
            return Number(x.id) === Number(currentUser.id) ||
                (x.email && currentUser.email && x.email.toLowerCase() === String(currentUser.email).toLowerCase());
        });
        if (fresh) {
            Object.assign(currentUser, fresh);
            try { localStorage.setItem("edunexa_session", JSON.stringify(currentUser)); } catch (e) {}
        }
    }

    function mergeById(collection, items, keyFn) {
        if (!Array.isArray(items)) return;
        items.forEach(function (item) {
            var key = keyFn(item);
            var existing = db[collection].find(function (x) { return keyFn(x) === key; });
            if (existing) {
                Object.assign(existing, item);
            } else {
                db[collection].push(item);
            }
        });
    }

    function replaceCollection(collection, items) {
        db[collection] = Array.isArray(items) ? items : db[collection];
    }

    /* ---------------------------------------------------------
       Backend connectivity helpers
       --------------------------------------------------------- */
    var backendReachable = false;
    window.EduNexaBackend = { reachable: false, checked: false };

    function ping() {
        return fetch(API.baseURL + "/health", { method: "GET" })
            .then(function (r) { return r.ok; })
            .catch(function () { return false; });
    }

    function showStatusChip(state, message) {
        var chip = document.getElementById("apiStatusChip");
        if (!chip) {
            chip = document.createElement("div");
            chip.id = "apiStatusChip";
            chip.style.cssText = "position:fixed;left:14px;bottom:14px;z-index:9999;padding:8px 14px;border-radius:20px;font:600 12px/1.4 system-ui,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.18);cursor:pointer;";
            chip.addEventListener("click", function () { location.reload(); });
            document.body.appendChild(chip);
        }
        var colors = { online: "#1a9c58", offline: "#c0392b", api: "#8e44ad", checking: "#b98a00" };
        chip.style.background = colors[state] || "#666";
        chip.style.color = "#fff";
        chip.textContent = message || "Backend: " + state;
    }

    function updateStatus() {
        ping().then(function (ok) {
            backendReachable = ok;
            window.EduNexaBackend.reachable = ok;
            window.EduNexaBackend.checked = true;
            if (ok) {
                showStatusChip("online", "Backend: ONLINE — " + API.baseURL);
                console.log("%c✔ EduNexa backend connected", "color:#1a9c58;font-weight:bold");
            } else {
                showStatusChip("offline", "Backend: OFFLINE — demo mode (click to retry)");
                console.warn("ℹ EduNexa backend not reachable at " + API.baseURL + ". The app runs on demo data.");
            }
        });
    }

    /* ---------------------------------------------------------
       Data loaders (read backend -> populate db)
       --------------------------------------------------------- */
    function get(path) { return API.request(path); }

    function summarizeMarks(rows) {
        var map = {};
        (rows || []).forEach(function (r) {
            var sid = uidToStringId(r.student_id);
            if (!map[sid]) map[sid] = { a: [], b: [], c: [], other: [] };
            var exam = (r.exam || "").toLowerCase();
            if (/ca1|internal.?1|internal.?i|test.?1|i-?1/i.test(exam)) map[sid].a.push(toNumber(r.mark));
            else if (/ca2|internal.?2|test.?2|i-?2/i.test(exam)) map[sid].b.push(toNumber(r.mark));
            else if (/model|semester|final/i.test(exam)) map[sid].c.push(toNumber(r.mark));
            else map[sid].other.push(toNumber(r.mark));
        });
        return Object.keys(map).map(function (sid) {
            var m = map[sid];
            var all = m.a.concat(m.b).concat(m.c).concat(m.other);
            var avg = all.length ? Math.round(all.reduce(function (x, y) { return x + y; }, 0) / all.length) : 0;
            return {
                studentId: sid,
                ca1: m.a.length ? Math.round(m.a.reduce(function (x, y) { return x + y; }, 0) / m.a.length) : 0,
                ca2: m.b.length ? Math.round(m.b.reduce(function (x, y) { return x + y; }, 0) / m.b.length) : 0,
                model: m.c.length ? Math.round(m.c.reduce(function (x, y) { return x + y; }, 0) / m.c.length) : 0,
                average: avg,
                __synced: true,
                __backendMarks: true
            };
        });
    }

    async function loadStudentMarks() {
        if (!currentUser) return;
        var rows = null;
        try {
            if (currentUser.role === "student") {
                rows = await get("/marks");
            } else {
                var studentsList = (db.users || []).filter(function (u) { return u.role === "student"; });
                var all = [];
                for (var i = 0; i < Math.min(studentsList.length, 20); i++) {
                    var sid = studentsList[i].id;
                    if (!sid) continue;
                    try { all = all.concat(await get("/marks?student_id=" + sid)); } catch (e) { /* skip */ }
                }
                rows = all;
            }
        } catch (e) { rows = null; }
        var marks = summarizeMarks(rows || []);
        if (marks.length) {
            mergeById("marks", marks, function (m) { return m.studentId; });
        }
    }

    async function loadFees() {
        if (!currentUser) return;
        var load = async function (sid) {
            try {
                var f = await get("/fees/student/" + sid);
                if (!f || !f.student_id) return null;
                var total = toNumber(f.tuition_total) + toNumber(f.bus_total) + toNumber(f.hostel_total) + toNumber(f.placement_total);
                var paid = toNumber(f.tuition_paid) + toNumber(f.bus_paid) + toNumber(f.hostel_paid) + toNumber(f.placement_paid);
                var s = uidToStringId(f.student_id);
                return {
                    studentId: s,
                    tuition: toNumber(f.tuition_total),
                    bus: toNumber(f.bus_total),
                    hostel: toNumber(f.hostel_total),
                    paid: paid,
                    paymentMethod: paid > 0 ? "Online / UPI" : "—",
                    pending: total - paid,
                    __synced: true,
                    __backendId: sid
                };
            } catch (e) { return null; }
        };
        var fees = [];
        if (currentUser.role === "student") {
            var f = await load(currentUser.id);
            if (f) fees.push(f);
        } else {
            var studentsList = (db.users || []).filter(function (u) { return u.role === "student"; });
            for (var i = 0; i < Math.min(studentsList.length, 20); i++) {
                var f2 = await load(studentsList[i].id);
                if (f2) fees.push(f2);
            }
        }
        if (fees.length) mergeById("fees", fees, function (x) { return x.studentId; });
    }

    async function loadFeedback() {
        try {
            var rows = await get("/feedback");
            var items = (rows || []).map(function (r) {
                var type = (r.category || "non_subject") === "subject" ? "academic" : "infrastructure";
                return {
                    id: "FDB-" + r.id,
                    studentId: uidToStringId(r.student_id),
                    studentName: r.student_name || (currentUser ? currentUser.name : "Student"),
                    department: r.department || (currentUser && currentUser.department) || "Data Analytics",
                    batch: (currentUser && currentUser.batch) || "2025-2028",
                    type: type,
                    typeLabel: feedbackTypeLabelOf(type),
                    area: type === "infrastructure" ? "College" : "Academic",
                    subject: r.subject || "",
                    faculty: "",
                    lab: "",
                    event: "",
                    session: "",
                    rating: toNumber(r.rating, 0),
                    priority: "Normal",
                    message: r.message || "",
                    status: normalizeStatus(r.status),
                    adviserResponse: r.response || "",
                    createdAt: r.created_at || "",
                    updatedAt: r.responded_at || r.created_at || "",
                    __synced: true,
                    __lastStatus: normalizeStatus(r.status),
                    __backendId: r.id
                };
            });
            if (items.length) mergeById("feedbacks", items, function (x) { return x.id; });
        } catch (e) { /* keep demo */ }
    }

    async function loadLeaves() {
        try {
            var rows = await get("/leaves");
            var items = (rows || []).map(function (r) {
                var sid = uidToStringId(r.student_id);
                return {
                    id: toNumber(r.id),
                    studentId: sid,
                    studentName: r.student_name || (currentUser ? currentUser.name : "Student"),
                    parentName: r.parent_name || "",
                    parentPhone: r.parent_phone || "",
                    type: r.leave_type === "half_day" ? "Half-Day Leave" : "Full-Day Leave",
                    from: (r.from_date || "").slice(0, 10),
                    to: (r.to_date || "").slice(0, 10),
                    reason: r.reason || "",
                    durationType: r.leave_type === "half_day" ? "Half Day" : "Full Day",
                    hours: toNumber(r.hours, 6),
                    status: normalizeStatus(r.status),
                    reviewedBy: r.reviewed_by || "",
                    reviewedAt: r.reviewed_at || "",
                    __synced: true,
                    __lastStatus: normalizeStatus(r.status),
                    __backendId: toNumber(r.id)
                };
            });
            if (items.length) mergeById("leaves", items, function (x) { return "L" + x.id; });
        } catch (e) {/* keep demo */}
    }

    async function loadTestsAndAssignments() {
        try {
            var tests = await get("/academics/tests");
            var assignments = await get("/academics/assignments");
            var tItems = (tests || []).map(function (r) {
                var cn = r.class_name || (currentUser && currentUser.batch) || "II B.Sc Data Analytics";
                return {
                    id: Number(r.id),
                    title: r.title || "Test",
                    subject: r.subject || "",
                    className: cn,
                    faculty: r.faculty_id ? (function () {
                        var f = (db.users || []).find(function (u) { return Number(u.id) === Number(r.faculty_id); });
                        return f ? f.name : "Faculty";
                    })() : "Faculty",
                    start: (r.due_date || "").slice(0, 10),
                    due: (r.due_date || "").slice(0, 10),
                    description: r.description || "",
                    questions: [],
                    __synced: true,
                    __backendId: Number(r.id),
                    __noQuestions: true
                };
            });
            var aItems = (assignments || []).map(function (r) {
                return {
                    id: Number(r.id),
                    title: r.title || "Assignment",
                    subject: r.subject || "",
                    className: r.class_name || (currentUser && currentUser.batch) || "II B.Sc Data Analytics",
                    faculty: "Faculty",
                    assigned: (r.due_date || "").slice(0, 10),
                    due: (r.due_date || "").slice(0, 10),
                    description: r.description || "",
                    __synced: true,
                    __backendId: Number(r.id)
                };
            });
            if (tItems.length) mergeById("tests", tItems, function (x) { return "T" + x.id; });
            if (aItems.length) mergeById("assignments", aItems, function (x) { return "A" + x.id; });
        } catch (e) {/* keep demo */}
    }

    async function loadSubmissions() {
        try {
            var rows = await get("/submissions");
            var items = (rows || []).map(function (r) {
                return {
                    type: r.item_type || "test",
                    itemId: Number(r.item_id || 0),
                    studentId: uidToStringId(r.student_id),
                    title: "",
                    subject: "",
                    baseMarks: toNumber(r.mark, 0),
                    deadlineMarks: 0,
                    finalMarks: toNumber(r.mark, 0),
                    status: r.status === "evaluated" ? "Submitted" : normalizeStatus(r.status),
                    submittedAt: (r.submitted_at || "").slice(0, 10),
                    __synced: true,
                    __backendId: Number(r.id)
                };
            });
            if (items.length) {
                var seen = {};
                var merged = [];
                items.forEach(function (it) {
                    var k = it.type + "|" + it.itemId + "|" + it.studentId;
                    if (!seen[k]) { seen[k] = 1; merged.push(it); }
                });
                mergeById("submissions", merged, function (x) { return x.type + "|" + x.itemId + "|" + x.studentId; });
            }
        } catch (e) {/* keep demo */}
    }

    async function loadNotifications() {
        try {
            var rows = await get("/notifications");
            var items = (rows || []).map(function (r) {
                return {
                    id: Number(r.id) + 100000,
                    title: r.title || "Notification",
                    message: r.message || "",
                    target: currentUser ? (currentUser.studentId || currentUser.email || currentUser.role) : "all",
                    createdAt: r.created_at || "",
                    __synced: true,
                    __backendId: Number(r.id)
                };
            });
            if (items.length) mergeById("notifications", items, function (x) { return "N" + x.id; });
        } catch (e) {/* keep demo */}
    }

    async function loadClassesAndDepartments() {
        try {
            var depts = await get("/departments");
            if (Array.isArray(depts) && depts.length) {
                var dItems = depts.map(function (d) {
                    var existing = db.departments.find(function (x) { return x.name === d.name; }) || {};
                    return {
                        id: d.id,
                        name: d.name,
                        hod: d.hod_name || existing.hod || "—",
                        description: d.description || "",
                        classes: existing.classes || [],
                        facultyCount: toNumber(existing.facultyCount, 0),
                        __synced: true,
                        __backendId: d.id
                    };
                });
                replaceCollection("departments", dItems);
            }
        } catch (e) { /* keep demo */ }
        try {
            var classes = await get("/classes");
            if (Array.isArray(classes) && classes.length) {
                db.classList = classes.map(function (c) {
                    return {
                        id: c.id,
                        name: c.name,
                        batch: c.batch || "",
                        semester: c.semester || "",
                        section: c.section || "",
                        classAdviser: c.class_adviser_name || "",
                        department: c.department_name || "Data Analytics",
                        __synced: true,
                        __backendId: c.id
                    };
                });
            }
        } catch (e) { /* keep demo */ }
    }

    async function loadHodExtra() {
        if (!currentUser || currentUser.role !== "hod") return;
        try {
            var all = await get("/hod/all");
            var rows = all.mark_requests || [];
            if (rows.length) {
                rows.forEach(function (r) {
                    var id = "MCR-" + r.id;
                    if (db.markChangeRequests.some(function (x) { return x.id === id; })) return;
                    db.markChangeRequests.push({
                        id: id,
                        studentId: uidToStringId(r.student_id),
                        facultyId: "",
                        facultyName: r.student_name || "Student",
                        department: currentUser.department || "",
                        requested: { ca1: toNumber(r.old_mark, 0), ca2: toNumber(r.new_mark, 0), model: 0 },
                        requestedAt: r.created_at || "",
                        periodEnd: "Open",
                        status: normalizeStatus(r.status),
                        __synced: true,
                        __backendId: r.id
                    });
                });
            }
        } catch (e) { /* keep demo */ }
    }

    async function loadAchievements() {
        try {
            var rows = await get("/hod/achievements");
            if (Array.isArray(rows) && rows.length) {
                db.achievements = rows.map(function (r) {
                    return {
                        id: r.id,
                        department: r.department || "Data Analytics",
                        title: r.title || "Achievement",
                        description: r.description || "",
                        achievement_date: r.achievement_date || "",
                        metric: toNumber(r.metric, 0),
                        __synced: true,
                        __backendId: r.id
                    };
                });
                if (!db.hodAchievements || !db.hodAchievements.length) {
                    db.hodAchievements = rows.map(function (r) {
                        return {
                            title: r.title || "Achievement",
                            year: (r.achievement_date || "").slice(0, 4) || "—",
                            detail: r.description || ""
                        };
                    });
                }
            }
        } catch (e) { /* keep demo */ }
    }

    async function loadPlacements() {
        try {
            var companies = await get("/placements/companies");
            if (Array.isArray(companies) && companies.length) {
                db.placementCompanies = companies.map(function (c) {
                    return {
                        id: "PC-" + c.id,
                        company_name: c.company_name,
                        industry: c.industry || "",
                        location: c.location || "",
                        visited: !!c.visited,
                        visit_date: c.visit_date || "",
                        package_min: toNumber(c.package_min, 0),
                        package_max: toNumber(c.package_max, 0),
                        description: c.description || "",
                        __synced: true,
                        __backendId: c.id
                    };
                });
            }
        } catch (e) { /* keep demo */ }
        try {
            var ranking = await get("/placements/ranking");
            if (Array.isArray(ranking) && ranking.length) {
                db.placements = ranking.map(function (r) {
                    return {
                        studentName: r.name || "",
                        studentId: r.student_id || "",
                        company_name: r.company_name || "",
                        package: toNumber(r.package, 0),
                        offer_status: r.offer_status || "placed",
                        __synced: true
                    };
                });
            }
        } catch (e) { /* keep demo */ }
    }

    /* ---------------------------------------------------------
       Aggregate loader, dispatched by role
       --------------------------------------------------------- */
    async function loadAllData() {
        if (!currentUser) return;
        try { toast("Syncing with backend server…"); } catch (e) {}

        if (currentUser.role === "student") {
            await Promise.all([
                loadStudentMarks(),
                loadFees(),
                loadFeedback(),
                loadLeaves(),
                loadTestsAndAssignments(),
                loadSubmissions(),
                loadNotifications(),
                loadClassesAndDepartments()
            ]);
        } else if (currentUser.role === "faculty") {
            var studentsList = [];
            try { studentsList = await get("/students"); } catch (e) {}
            mergeUsers(studentsList);
            var facultyList = [];
            try { facultyList = await get("/faculty"); } catch (e) {}
            mergeUsers(facultyList);
            refreshCurrentUserFromDb();
            await Promise.all([
                loadStudentMarks(),
                loadFees(),
                loadFeedback(),
                loadLeaves(),
                loadTestsAndAssignments(),
                loadSubmissions(),
                loadNotifications(),
                loadClassesAndDepartments()
            ]);
        } else if (currentUser.role === "hod") {
            var hodStudents = [], hodFaculty = [];
            try { hodStudents = await get("/hod/students"); } catch (e) {}
            try { hodFaculty = await get("/hod/faculty"); } catch (e) {}
            mergeUsers(hodStudents);
            mergeUsers(hodFaculty);
            await Promise.all([
                loadStudentMarks(),
                loadFees(),
                loadFeedback(),
                loadLeaves(),
                loadTestsAndAssignments(),
                loadSubmissions(),
                loadNotifications(),
                loadClassesAndDepartments(),
                loadHodExtra(),
                loadAchievements(),
                loadPlacements()
            ]);
        } else if (currentUser.role === "management") {
            var mgmtStudents = [], mgmtFaculty = [];
            try { mgmtStudents = await get("/management/students"); } catch (e) {}
            try { mgmtFaculty = await get("/management/faculty"); } catch (e) {}
            mergeUsers(mgmtStudents);
            mergeUsers(mgmtFaculty);
            await Promise.all([
                loadStudentMarks(),
                loadFees(),
                loadFeedback(),
                loadLeaves(),
                loadTestsAndAssignments(),
                loadSubmissions(),
                loadNotifications(),
                loadClassesAndDepartments(),
                loadAchievements(),
                loadPlacements()
            ]);
        }

        if (typeof originalSave === "function") originalSave();
        updateStatus();
    }

    /* ---------------------------------------------------------
       AUTH OVERRIDES
       --------------------------------------------------------- */
    function resetDbForNewUser() {
        try { localStorage.removeItem(DB_KEY); } catch (e) {}
        if (typeof createDefaultDatabase === "function") db = createDefaultDatabase();
        db.feedbacks = Array.isArray(db.feedbacks) ? db.feedbacks : [];
        db.studentProfiles = [];
        db.certificates = [];
        db.completedCourses = [];
        db.internships = [];
        db.classTimetables = [];
        db.classMeetings = [];
        db.markChangeRequests = [];
        db.facultyTimetables = [];
        db.facultyAttendance = [];
        db.hodDetails = [];
        db.departments = [];
        db.achievements = [];
        db.placementCompanies = [];
        db.placements = [];
        if (typeof seedDatabase === "function") seedDatabase();
    }

    function resolveEmail(identifier) {
        var id = String(identifier || "").trim().toLowerCase();
        if (id.indexOf("@") >= 0) return id;
        var u = (db.users || []).find(function (x) {
            return (x.studentId && String(x.studentId).toLowerCase() === id) ||
                (x.facultyId && String(x.facultyId).toLowerCase() === id) ||
                (x.hodId && String(x.hodId).toLowerCase() === id) ||
                (x.adminId && String(x.adminId).toLowerCase() === id) ||
                (x.name && String(x.name).toLowerCase() === id);
        });
        return u ? (u.email || "").toLowerCase() : null;
    }

    window.login = async function login() {
        var idEl = document.getElementById("loginId");
        var passEl = document.getElementById("loginPassword");
        var id = (idEl && idEl.value || "").trim();
        var password = (passEl && passEl.value || "").trim();
        if (!id || !password) {
            try { toast("Enter login ID and password."); } catch (e) {}
            return;
        }

        var topRole = typeof loginRole === "undefined" ? "student" : loginRole;
        var staffRole = typeof staffLoginRole === "undefined" || !staffLoginRole ? "faculty" : staffLoginRole;
        var effectiveRole = topRole === "staff" ? staffRole : topRole;

        var email = resolveEmail(id);
        if (!email) {
            try {
                toast("Account not found locally. Use the email ID (e.g. alexa@example.com) after registering.");
            } catch (e) {}
            return;
        }

        var btn = document.querySelector('#auth button[type="submit"], #loginPanel button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = "Signing in…"; }

        try {
            var data = await API.login(email, password);
            var user = mapUser(data.user);
            if (!user) throw new Error("Backend returned an invalid user.");
            if (norm(user.role) !== norm(effectiveRole)) {
                var expect = effectiveRole === "hod" ? "HOD" : effectiveRole === "faculty" ? "Faculty" : effectiveRole;
                throw new Error("This account is a " + user.role + ". Change the login type to " + expect + ".");
            }

            resetDbForNewUser();
            currentUser = user;
            mergeUsers([data.user]);
            try { localStorage.setItem("edunexa_session", JSON.stringify(user)); } catch (e) {}

            await loadAllData();
            openApp();
            try { toast("Welcome " + user.name + " ✔"); } catch (e) {}
        } catch (error) {
            try {
                toast(error && error.message ? error.message : "Invalid login details or user type.");
            } catch (e) {}
            console.error("EduNexa login error:", error);
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = "Sign In"; }
        }
    };

    window.register = async function register() {
        var nameEl = document.getElementById("suName");
        var emailEl = document.getElementById("suEmail");
        var passEl = document.getElementById("suPass");
        var name = (nameEl && nameEl.value || "").trim();
        var email = (emailEl && emailEl.value || "").trim().toLowerCase();
        var password = (passEl && passEl.value || "").trim();

        if (!name || !email || !password) { try { toast("Please complete all required fields."); } catch (e) {} return; }
        if (password.length < 6) { try { toast("Password must contain at least 6 characters."); } catch (e) {} return; }

        var signupRole = typeof window.signupRole === "undefined" ? "student" : window.signupRole;
        if (signupRole === "management") {
            try { toast("Management accounts are created by the administrator."); } catch (e) {}
            return;
        }

        var payload = {
            name: name,
            email: email,
            password: password,
            role: signupRole,
            department: "Data Analytics",
            batch: "2025-2028"
        };
        if (signupRole === "student") {
            payload.student_id = (document.getElementById("suStudentId") && document.getElementById("suStudentId").value.trim()) || ("EDU-" + Date.now());
            payload.parent_name = (document.getElementById("suParent") && document.getElementById("suParent").value.trim()) || "Parent / Guardian";
            payload.parent_phone = (document.getElementById("suParentPhone") && document.getElementById("suParentPhone").value.trim()) || "";
        }

        var btn = document.querySelector('#signupPanel button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = "Creating account…"; }
        try {
            await API.register(payload);
            try { toast("Account created successfully. Please sign in."); } catch (e) {}
            if (typeof showLogin === "function") showLogin();
        } catch (error) {
            try { toast(error && error.message ? error.message : "Registration failed."); } catch (e) {}
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = "Create Account"; }
        }
    };

    window.logout = function logout() {
        currentUser = null;
        try { API.logout(); } catch (e) {}
        try { localStorage.removeItem("edunexa_session"); } catch (e) {}
        try {
            var appEl = document.getElementById("app"); if (appEl) appEl.classList.add("hidden");
            var authEl = document.getElementById("auth"); if (authEl) authEl.classList.remove("hidden");
            var idEl = document.getElementById("loginId"); if (idEl) idEl.value = "";
            var passEl = document.getElementById("loginPassword"); if (passEl) passEl.value = "";
        } catch (e) {}
        if (typeof showLogin === "function") showLogin();
    };

    /* ---------------------------------------------------------
       WRITE-THROUGH SYNC (runs after every save())
       --------------------------------------------------------- */
    function debounce(fn, ms) {
        var t;
        return function () {
            clearTimeout(t);
            t = setTimeout(fn, ms || 500);
        };
    }

    function markSynced(item) {
        item.__synced = true;
    }

    async function syncFeedback() {
        var token = hasToken();
        if (!currentUser) return;
        var list = (db.feedbacks || []).slice();

        for (var i = 0; i < list.length; i++) {
            var f = list[i];
            var isNew = !f.__synced;
            var statusChanged = f.__backendId && f.__lastStatus !== f.status && !isNew;
            try {
                if (isNew && currentUser.role === "student") {
                    var res = await API.request("/feedback", {
                        method: "POST",
                        body: JSON.stringify({
                            category: feedbackCategory(f),
                            subject: f.subject || "",
                            rating: toNumber(f.rating, 0),
                            message: f.message || "",
                            recipient: "class_adviser"
                        })
                    });
                    f.__backendId = res && res.id;
                    f.__lastStatus = f.status;
                    markSynced(f);
                } else if (statusChanged && currentUser.role !== "student") {
                    await API.request("/feedback/" + f.__backendId + "/response", {
                        method: "PUT",
                        body: JSON.stringify({
                            status: (f.status || "reviewed").toLowerCase().replace(" ", "_"),
                            response: f.adviserResponse || f.message || ""
                        })
                    });
                    f.__lastStatus = f.status;
                }
            } catch (e) { /* transient failure - retried next save */ }
        }
    }

    async function syncLeaves() {
        if (!currentUser || (currentUser.role !== "student" && currentUser.role !== "faculty" && currentUser.role !== "hod")) return;
        var list = (db.leaves || []).slice();
        for (var i = 0; i < list.length; i++) {
            var lv = list[i];
            try {
                if (!lv.__synced && currentUser.role === "student") {
                    var created = await API.request("/leaves", {
                        method: "POST",
                        body: JSON.stringify({
                            leave_type: backendLeaveType(lv.durationType || lv.type),
                            from_date: lv.from,
                            to_date: lv.to,
                            hours: typeof lv.hours === "number" ? lv.hours : 6,
                            reason: lv.reason || ""
                        })
                    });
                    lv.__backendId = created && created.id;
                    lv.__lastStatus = lv.status;
                    markSynced(lv);
                } else if (lv.__backendId && lv.__lastStatus !== lv.status && currentUser.role !== "student") {
                    await API.request("/leaves/" + lv.__backendId, {
                        method: "PUT",
                        body: JSON.stringify({
                            status: lv.status === "Approved" ? "approved" : "declined",
                            review_note: "Reviewed by " + (lv.reviewedBy || currentUser.name)
                        })
                    });
                    lv.__lastStatus = lv.status;
                }
            } catch (e) { /* retry later */ }
        }
    }

    async function syncTestsAndAssignments() {
        if (!currentUser || (currentUser.role !== "faculty" && currentUser.role !== "hod")) return;
        var tests = (db.tests || []).slice();
        for (var i = 0; i < tests.length; i++) {
            var t = tests[i];
            if (t.__synced) continue;
            try {
                var form = new FormData();
                form.append("title", t.title || "Test");
                form.append("description", JSON.stringify({ questions: t.questions || [] }));
                form.append("subject", t.subject || "");
                form.append("class_name", t.className || currentUser.batch || "II B.Sc Data Analytics");
                form.append("due_date", t.due || "");
                form.append("max_mark", "100");
                var res = await API.request("/academics/tests", { method: "POST", body: form });
                t.__backendId = res && res.id;
                markSynced(t);
            } catch (e) {}
        }
        var assigns = (db.assignments || []).slice();
        for (var j = 0; j < assigns.length; j++) {
            var a = assigns[j];
            if (a.__synced) continue;
            try {
                var form2 = new FormData();
                form2.append("title", a.title || "Assignment");
                form2.append("description", a.description || "");
                form2.append("subject", a.subject || "");
                form2.append("class_name", a.className || currentUser.batch || "II B.Sc Data Analytics");
                form2.append("due_date", a.due || "");
                form2.append("max_mark", "100");
                var res2 = await API.request("/academics/assignments", { method: "POST", body: form2 });
                a.__backendId = res2 && res2.id;
                markSynced(a);
            } catch (e) {}
        }
    }

    async function syncSubmissions() {
        if (!currentUser || currentUser.role !== "student") return;
        var list = (db.submissions || []).slice();
        for (var i = 0; i < list.length; i++) {
            var sub = list[i];
            if (sub.__synced) continue;
            try {
                var form = new FormData();
                form.append("item_type", sub.type === "assignment" ? "assignment" : "test");
                form.append("item_id", String(sub.itemId));
                form.append("text_answer", JSON.stringify({
                    title: sub.title || "",
                    subject: sub.subject || "",
                    baseMarks: sub.baseMarks || 0,
                    finalMarks: sub.finalMarks || 0,
                    submittedAt: sub.submittedAt || ""
                }));
                await API.request("/academics/submissions", { method: "POST", body: form });
                markSynced(sub);
            } catch (e) {}
        }
    }

    async function syncStudentRecords() {
        if (!currentUser || currentUser.role !== "student") return;
        var kinds = [
            { col: "certificates", kind: "certificate", body: function (x) { return { title: x.name, issuer: x.organization, completion_date: x.date }; } },
            { col: "completedCourses", kind: "course", body: function (x) { return { title: x.name, provider: x.provider, completion_date: x.date }; } },
            { col: "internships", kind: "internship", body: function (x) { return { company: x.company, role: x.role, start_date: x.start, end_date: x.end, description: x.description }; } }
        ];
        for (var k = 0; k < kinds.length; k++) {
            var def = kinds[k];
            var items = (db[def.col] || []).slice();
            for (var i = 0; i < items.length; i++) {
                var item = items[i];
                if (item.__synced) continue;
                try {
                    await API.request("/student-records/" + def.kind, {
                        method: "POST",
                        body: JSON.stringify(def.body(item))
                    });
                    markSynced(item);
                } catch (e) {}
            }
        }
    }

    async function syncMarks() {
        if (!currentUser || (currentUser.role !== "faculty" && currentUser.role !== "hod" && currentUser.role !== "management")) return;
        var list = (db.marks || []).slice();
        for (var i = 0; i < list.length; i++) {
            var m = list[i];
            if (m.__synced) continue;
            var backendId = backendStudentId(m.studentId);
            if (!backendId) continue;
            var exams = [
                { exam: "CA1", mark: m.ca1 || 0 },
                { exam: "CA2", mark: m.ca2 || 0 },
                { exam: "Model", mark: m.model || 0 }
            ];
            var ok = false;
            for (var j = 0; j < exams.length; j++) {
                try {
                    await API.request("/marks", {
                        method: "POST",
                        body: JSON.stringify({ student_id: backendId, subject: "Overall", exam: exams[j].exam, mark: exams[j].mark, max_mark: 100 })
                    });
                    ok = true;
                } catch (e) { ok = false; }
            }
            if (ok) markSynced(m);
        }
    }

    async function syncPlacementsAndAchievements() {
        if (!currentUser || (currentUser.role !== "hod" && currentUser.role !== "management")) return;
        var companies = (db.placementCompanies || []).slice();
        for (var i = 0; i < companies.length; i++) {
            var c = companies[i];
            if (c.__synced) continue;
            try {
                await API.request("/placements/companies", {
                    method: "POST",
                    body: JSON.stringify({
                        company_name: c.company_name || c.name || "",
                        industry: c.industry || "",
                        location: c.location || "",
                        visited: !!c.visited,
                        visit_date: c.visit_date || "",
                        package_min: toNumber(c.package_min, 0),
                        package_max: toNumber(c.package_max, 0),
                        description: c.description || ""
                    })
                });
                markSynced(c);
            } catch (e) {}
        }
        var achievements = (db.achievements || []).slice();
        for (var j = 0; j < achievements.length; j++) {
            var a = achievements[j];
            if (a.__synced) continue;
            try {
                await API.request("/hod/achievements", {
                    method: "POST",
                    body: JSON.stringify({
                        title: a.title || "Achievement",
                        description: a.description || "",
                        achievement_date: a.achievement_date || "",
                        metric: toNumber(a.metric, 0)
                    })
                });
                markSynced(a);
            } catch (e) {}
        }
    }

    async function syncAll() {
        if (!hasToken() || !currentUser) return;
        var tasks = [
            syncFeedback(), syncLeaves(), syncTestsAndAssignments(),
            syncSubmissions(), syncStudentRecords(), syncMarks(),
            syncPlacementsAndAchievements()
        ];
        try {
            await Promise.all(tasks);
            if (typeof originalSave === "function") originalSave();
        } catch (e) {
            console.error("EduNexa sync error:", e);
        }
    }

    var scheduleSync = debounce(syncAll, 600);

    window.save = function save() {
        try { if (typeof originalSave === "function") originalSave(); } catch (e) {}
        scheduleSync();
    };

    window.edunexaSync = syncAll;

    /* Backend tests have no MCQ questions (the backend stores title/subject/due).
       Guard the test-taking modal so it never opens an empty form. */
    var originalTakeTest = window.takeTest;
    if (typeof originalTakeTest === "function") {
        window.takeTest = function (id) {
            var test = (db.tests || []).find(function (t) { return t.id === id; });
            if (test && !(test.questions && test.questions.length)) {
                try {
                    toast("This test has no online questions. Your faculty will share the paper; submit your work in class.");
                } catch (e) {}
                return;
            }
            return originalTakeTest(id);
        };
    }

    /* ---------------------------------------------------------
       BOOTSTRAP
       --------------------------------------------------------- */
    function bootstrap() {
        updateStatus();
        if (!hasToken()) return;

        API.me()
            .then(function (me) {
                if (!me || !me.id) throw new Error("invalid session");
                currentUser = mapUser(me);
                mergeUsers([me]);
                return loadAllData().then(function () {
                    openApp();
                });
            })
            .catch(function (err) {
                console.warn("Saved session invalid:", err.message);
                API.logout();
            });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bootstrap);
    } else {
        bootstrap();
    }

})();