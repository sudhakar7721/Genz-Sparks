# EduNexa V13 – Requested Faculty & Student Enhancements

Existing features are preserved. V13 adds the requested prototype features on top of the existing frontend/backend.

## Faculty
- Published Tests and Assignments: latest 3 shown in the main module.
- View: full details, questions/description, seen count, completed count and submissions.
- Edit: publisher faculty can edit title, subject, class, due date and description.
- History: all older records remain in SQLite and are available through History.
- New assessments create notifications for students targeted by the selected class.
- Attendance: all department handled classes, each student's attendance percentage and View action.
- Attendance View: complete day/subject attendance table for the selected student.
- Class Adviser Leave Console: pending requests are shown; accepted/declined requests disappear from the pending list but remain in SQLite.
- All Requests: complete leave history with student, status, date and month filters.
- Accept/Decline creates a notification for the requested student.

## Student
- Class Details shows class, section, academic year/batch, department, class adviser, mentor and HOD.
- Class timetable is displayed as a table with day, period, time, subject, subject faculty and room.

## Backend API additions
- `/api/faculty/assessments/{item_type}`
- `/api/faculty/assessments/{item_type}/{item_id}`
- `/api/faculty/attendance/overview`
- `/api/faculty/attendance/student/{sid}`
- `/api/faculty/leaves/all`
- `/api/assessments/{item_type}/{item_id}/view`
- `/api/student/class-details`

Run backend from `Edunexa_backend` with:
`python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000`

Run frontend from `Edunexa_frontend` with:
`python -m http.server 5500`
