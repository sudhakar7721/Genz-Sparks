/* =========================================================
   EDUNEXA BACKEND API BRIDGE
   Connects the modular frontend to the FastAPI backend.
========================================================= */

const API_BASE = localStorage.getItem("edunexa_api_base") ||
    "http://127.0.0.1:8000/api";

async function api(path, options = {}) {
    const token = localStorage.getItem("edunexa_token");
    const headers = {
        ...(options.body !== undefined ? {"Content-Type":"application/json"} : {}),
        ...(token ? {"Authorization": `Bearer ${token}`} : {}),
        ...(options.headers || {})
    };

    const response = await fetch(API_BASE + path, {...options, headers});
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }

    if (!response.ok) {
        const detail = data && typeof data === "object" ? data.detail : null;
        throw new Error(detail || `API request failed (${response.status})`);
    }
    return data;
}

function backendDate(value) {
    if (!value) return "";
    return String(value).slice(0,10);
}

function backendDateTime(value) {
    if (!value) return "";
    try { return new Date(value).toLocaleString(); } catch (_) { return String(value); }
}

function mapTest(t) {
    return {
        id: t.id,
        title: t.title,
        subject: t.subject,
        faculty: "",
        start: backendDate(t.test_date),
        due: backendDate(t.test_date),
        questions: Array.isArray(t.questions) ? t.questions :
            (db?.tests?.find(x => x.title === t.title)?.questions || []),
        maxMarks: t.max_marks,
        description: t.description || ""
    };
}

function mapAssignment(a) {
    return {
        id: a.id,
        title: a.title,
        subject: a.subject,
        faculty: "",
        assigned: backendDate(a.assigned_date || a.created_at || a.due_date),
        due: backendDate(a.due_date),
        description: a.description || ""
    };
}

function mapFeedback(f) {
    return {
        id: "FDB-" + f.id,
        backendId: f.id,
        studentId: f.student_id,
        studentName: "",
        department: "",
        batch: "",
        type: f.feedback_type,
        typeLabel: feedbackTypeLabelSafe(f.feedback_type),
        area: f.feedback_type,
        subject: f.subject || "",
        faculty: "",
        lab: "",
        event: "",
        session: "",
        rating: f.rating,
        priority: "Normal",
        message: f.message,
        status: f.status || "Submitted",
        adviserResponse: f.response || "",
        createdAt: backendDateTime(f.created_at),
        updatedAt: backendDateTime(f.created_at)
    };
}

function feedbackTypeLabelSafe(type) {
    return {
        infrastructure: "Class & College Infrastructure",
        academic: "Subjects, Faculty & Labs",
        event: "Events & Functions"
    }[type] || type || "Feedback";
}

function mapNotification(n) {
    return {
        id: n.id,
        backendId: n.id,
        title: n.title,
        message: n.message,
        target: n.recipient_role || (n.student_id ? String(n.student_id) : "all"),
        createdAt: backendDateTime(n.created_at),
        isRead: n.is_read
    };
}

function mapFee(f) {
    const tuition = Number(f.tuition_total || 0);
    const bus = Number(f.bus_total || 0);
    const hostel = Number(f.hostel_total || 0);
    const paid = Number(f.tuition_paid || 0) + Number(f.bus_paid || 0) + Number(f.hostel_paid || 0);
    const total = tuition + bus + hostel;
    return {
        id: f.id,
        studentId: String(f.student_id),
        tuition, bus, hostel, paid,
        paymentMethod: f.payment_method || "-",
        pending: Math.max(0, total - paid)
    };
}

function mapLeave(l) {
    return {
        id: l.id,
        backendId: l.id,
        studentId: String(l.student_id),
        studentName: "",
        parentName: "",
        parentPhone: "",
        type: l.leave_type,
        from: backendDate(l.from_date),
        to: backendDate(l.to_date),
        reason: l.reason,
        status: l.status,
        reviewedBy: l.reviewed_by ? String(l.reviewed_by) : "",
        reviewerComment: l.reviewer_comment || ""
    };
}

function mapSkillList(list) {
    const result = {};
    (list || []).forEach(s => result[s.skill_name] = Number(s.score || 0));
    return result;
}

async function fetchSafe(path, fallback = []) {
    try { return await api(path); }
    catch (error) {
        console.warn("EduNexa API:", path, error.message);
        return fallback;
    }
}

async function syncBackendState() {
    if (!localStorage.getItem("edunexa_token") || !currentUser) return;

    try {
        const me = await api("/me");
        currentUser = {...currentUser, ...me};

        if (currentUser.role === "student") {
            const profile = await api("/students/me");
            currentUser.id = profile.user?.id ?? currentUser.id;
            currentUser.studentBackendId = profile.id;
            currentUser.studentId = profile.student_id;
            currentUser.name = profile.user?.name || currentUser.name;
            currentUser.email = profile.user?.email || currentUser.email;
            currentUser.parentName = profile.parent_name || "Parent / Guardian";
            currentUser.parentPhone = profile.parent_phone || "";
            currentUser.batch = profile.batch || "";
            currentUser.className = profile.class_name || "";
            currentUser.attendance = Number(profile.attendance || 0);
            currentUser.department = profile.department?.name || "Data Analytics";

            const [marks, attendance, fees, tests, assignments, submissions, leaves, skills, feedbacks, notifications, placements] =
                await Promise.all([
                    fetchSafe(`/marks/${profile.id}`),
                    fetchSafe(`/attendance/${profile.id}`),
                    fetchSafe(`/fees/student/${profile.id}`),
                    fetchSafe("/tests"),
                    fetchSafe("/assignments"),
                    fetchSafe(`/submissions/${profile.id}`),
                    fetchSafe("/leaves/my"),
                    fetchSafe(`/skills/${profile.id}`),
                    fetchSafe("/feedback/my"),
                    fetchSafe("/notifications/my"),
                    fetchSafe("/placements")
                ]);

            db.marks = (marks || []).map(m => ({
                id:m.id, studentId:String(profile.student_id), backendStudentId:profile.id,
                subject:m.subject, m1:m.m1, m2:m.m2, m3:m.m3, m4:m.m4,
                ca1:m.m1, ca2:m.m2, model:m.m3, average:m.average
            }));
            db.attendanceRecords = attendance || [];
            db.fees = (fees || []).map(mapFee);
            db.tests = (tests || []).map(mapTest);
            db.assignments = (assignments || []).map(mapAssignment);
            db.backendSubmissions = submissions || [];
            db.leaves = (leaves || []).map(x => ({...mapLeave(x), studentId:String(profile.student_id)}));
            currentUser.skills = mapSkillList(skills);
            db.feedbacks = (feedbacks || []).map(x => ({...mapFeedback(x), studentId:String(profile.student_id), studentName:currentUser.name, department:currentUser.department, batch:currentUser.batch}));
            db.notifications = (notifications || []).map(mapNotification);
            db.placements = placements || [];
        } else if (currentUser.role === "faculty") {
            const profile = await api("/faculty/me");
            currentUser.id = profile.user?.id ?? currentUser.id;
            currentUser.facultyBackendId = profile.id;
            currentUser.facultyId = profile.faculty_id;
            currentUser.name = profile.user?.name || currentUser.name;
            currentUser.email = profile.user?.email || currentUser.email;
            currentUser.department = profile.department || "";
            currentUser.position = profile.position || "";
            currentUser.designation = profile.designation || "";
            currentUser.mentor = !!profile.mentor;
            currentUser.classAdviser = !!profile.class_adviser;
            currentUser.classesHandled = profile.classes_handled ? profile.classes_handled.split(",").map(x=>x.trim()) : [];
            currentUser.basicSubjects = profile.basic_subjects ? profile.basic_subjects.split(",").map(x=>x.trim()) : [];
            currentUser.extraSubjects = profile.extra_subjects ? profile.extra_subjects.split(",").map(x=>x.trim()) : [];

            const [students, tests, assignments, leaves, feedbacks, notifications, placements] =
                await Promise.all([
                    fetchSafe("/students"),
                    fetchSafe("/tests"),
                    fetchSafe("/assignments"),
                    fetchSafe("/leaves/pending"),
                    fetchSafe("/feedback"),
                    fetchSafe("/notifications/my"),
                    fetchSafe("/placements")
                ]);

            db.users = (students || []).map(s => ({
                id:s.user?.id, backendStudentId:s.id, name:s.user?.name || "",
                email:s.user?.email || "", role:"student", studentId:s.student_id,
                parentName:s.parent_name || "", parentPhone:s.parent_phone || "",
                department:s.department?.name || "", batch:s.batch || "",
                className:s.class_name || "", attendance:Number(s.attendance || 0)
            }));
            db.tests = (tests || []).map(mapTest);
            db.assignments = (assignments || []).map(mapAssignment);
            const studentById = new Map((students || []).map(s => [s.id, s]));
            db.leaves = (leaves || []).map(x => ({
                ...mapLeave(x),
                studentId: studentById.get(x.student_id)?.student_id || String(x.student_id),
                studentName: studentById.get(x.student_id)?.user?.name || "",
                parentName: studentById.get(x.student_id)?.parent_name || "",
                parentPhone: studentById.get(x.student_id)?.parent_phone || ""
            }));
            db.feedbacks = (feedbacks || []).map(x => ({
                ...mapFeedback(x),
                studentId: studentById.get(x.student_id)?.student_id || String(x.student_id),
                studentName: studentById.get(x.student_id)?.user?.name || ""
            }));
            db.notifications = (notifications || []).map(x => {
                const n = mapNotification(x);
                if(x.student_id && studentById.has(x.student_id)) n.target = studentById.get(x.student_id).student_id;
                return n;
            });
            db.placements = placements || [];
            db.fees = [];
            for (const st of students || []) {
                const fees = await fetchSafe(`/fees/student/${st.id}`);
                db.fees.push(...(fees || []).map(f => ({...mapFee(f), studentId:st.student_id})));
            }
            db.marks = [];
            for (const s of students || []) {
                const marks = await fetchSafe(`/marks/${s.id}`);
                (marks || []).forEach(m => db.marks.push({
                    id:m.id, studentId:(s.student_id || ""), backendStudentId:s.id,
                    subject:m.subject, m1:m.m1, m2:m.m2, m3:m.m3, m4:m.m4,
                    ca1:m.m1, ca2:m.m2, model:m.m3, average:m.average
                }));
            }
        } else if (currentUser.role === "management") {
            const [students, faculty, tests, assignments, feedbacks, notifications, placements] =
                await Promise.all([
                    fetchSafe("/students"),
                    fetchSafe("/faculty"),
                    fetchSafe("/tests"),
                    fetchSafe("/assignments"),
                    fetchSafe("/feedback"),
                    fetchSafe("/notifications/my"),
                    fetchSafe("/placements")
                ]);
            db.users = (students || []).map(s => ({
                id:s.user?.id, backendStudentId:s.id, name:s.user?.name || "",
                email:s.user?.email || "", role:"student", studentId:s.student_id,
                parentName:s.parent_name || "", parentPhone:s.parent_phone || "",
                department:s.department?.name || "", batch:s.batch || "",
                className:s.class_name || "", attendance:Number(s.attendance || 0)
            }));
            db.faculty = faculty || [];
            db.tests = (tests || []).map(mapTest);
            db.assignments = (assignments || []).map(mapAssignment);
            const studentById = new Map((students || []).map(s => [s.id, s]));
            db.feedbacks = (feedbacks || []).map(x => ({
                ...mapFeedback(x),
                studentId: studentById.get(x.student_id)?.student_id || String(x.student_id),
                studentName: studentById.get(x.student_id)?.user?.name || ""
            }));
            db.notifications = (notifications || []).map(x => {
                const n = mapNotification(x);
                if(x.student_id && studentById.has(x.student_id)) n.target = studentById.get(x.student_id).student_id;
                return n;
            });
            db.placements = placements || [];
        }

        localStorage.setItem("edunexa_user", JSON.stringify(currentUser));
        save();
    } catch (error) {
        console.error("EduNexa backend sync failed:", error);
        toast("Backend connection failed. Check that the FastAPI server is running.");
    }
}

/* Change this to false only if you intentionally want offline/localStorage mode. */
const EDUNEXA_BACKEND_ENABLED = true;
