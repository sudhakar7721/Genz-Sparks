# EduNexa Modular Frontend

This package reorganizes the uploaded EduNexa frontend into smaller files **without changing the existing feature logic**.

## Run
1. Open this folder in VS Code.
2. Use Live Server (recommended) or another local HTTP server.
3. Open `index.html`.

## Main structure
- `index.html` — application shell and authentication shell.
- `css/` — CSS split into base, auth, layout, components, skills, modal, responsive, feedback, and management.
- `js/core/` — database, helpers, authentication, navigation, refresh, UI, initialization.
- `js/student/` — student pages, tests, assignments.
- `js/faculty/` — faculty pages, tests, assignments, attendance, leave, marks, mentor, adviser fees.
- `js/management/` — management pages.
- `js/shared/` — skills, work, fees, feedback, notifications.
- `modules/` — module documentation/integration notes.

## Important
Your current EduNexa app generates most page HTML from JavaScript template functions. Therefore, the safest first split is to keep each module's HTML template beside its JavaScript render logic rather than forcing a fetch-based HTML system that could break your existing login/navigation/data flow.

<<<<<<< Updated upstream
The original files are preserved in `original/` for comparison.
=======

## V2 additions
All original modules are retained. Added `js/updates_v2.js` for the requested non-destructive enhancements: HOD login/registration, class-targeted tests and assignments, timetable tables, Class Adviser leave console, feedback View actions, HOD department console/analytics, and Management HOD/department View + feedback analytics. Clear browser localStorage only if you intentionally want a fresh demo database.


## V3 Requested Changes
- Student leave is consolidated into one Class Adviser Leave Console with a My Leave Requests table.
- Student, Faculty and Class timetables use weekly row/column grids.
- Faculty has separate Faculty Timetable and Class Timetable modules.
- Management HOD and Department modules support View/Edit/Add New actions.
- Department feedback analytics is embedded in Department Details.
- The old Management Views group is removed.
>>>>>>> Stashed changes
