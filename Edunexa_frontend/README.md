# EduNexa Modular Frontend — Enhanced

This package is the complete split, uploadable frontend for EduNexa. Existing modules are retained and the requested enhancements are added as separate files.

## Run
1. Extract the ZIP.
2. Open the extracted folder in VS Code.
3. Open `index.html` with Live Server (recommended).
4. No build step is required.

## File structure
- `index.html` — application shell
- `css/` — all styles, including `enhancements.css`
- `js/core/` — database, authentication, navigation, UI, refresh and initialization
- `js/student/` — existing student pages/tests/assignments
- `js/faculty/` — existing faculty pages/tests/assignments/attendance/leave/marks/mentor/adviser fees
- `js/management/` — existing management pages
- `js/shared/` — existing shared features + `enhancements.js`
- `modules/` — module documentation
- `original/` — original reference files from the uploaded package
- `FLOWCHART.md` — complete feature flow

## New features
Student: assessment file upload, half-day leave up to 6 hours, leave table, certificates/courses/internships, timetable + subject faculty, class committee feedback to adviser + HOD.

Faculty: complete student record, question/reference file upload, class-adviser timetable entry, mark-change workflow, parent notifications.

HOD: separate HOD login, faculty/student/class details, timetables, faculty attendance, committee feedback, mark-change approval, extra details.

Management: HOD details, department details, existing management features, extra institution details.

## Demo accounts
- Student: `alexa@example.com` / `123456`
- Faculty: `faculty@edunexa.com` / `123456`
- HOD: `HOD-1001` or `hod@edunexa.com` / `123456`
- Management: `admin@edunexa.com` / `123456`

## Important
This is a frontend/localStorage implementation. Uploaded files are stored as Data URLs in browser localStorage. For production, move file storage, authentication, authorization and personal student records to the Python/SQLite backend.
