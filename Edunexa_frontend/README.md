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

The original files are preserved in `original/` for comparison.
