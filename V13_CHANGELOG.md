# EduNexa V13 Changes

This version adds the requested Faculty and Student enhancements without intentionally removing existing modules.

### Faculty
- Test/Assignment View, full details, Edit, seen/completed counts and student activity.
- History for Tests and Assignments; Published lists display only latest 3.
- Target-class-only assessment notifications.
- Handled-class attendance overview with percentage and per-student daily View.
- Class Adviser Leave Console with Accept/Decline, persistent history, All Requests and Student/Status/Date/Month filters.
- Student notification after leave decision.

### Student
- Class Details renamed/extended with class timetable table, year/batch, department, adviser, subject faculty, mentor and HOD.

### Backend
- SQLite migration for assessment view tracking.
- New assessment detail/edit/history/view endpoints.
- Targeted notification logic.
- Faculty attendance summary endpoint.
- All-leave filtering endpoint.
- Student class-details endpoint.

### Existing behavior
The original localStorage/offline fallback and existing backend bridge are retained. The new feature pack is loaded after the existing scripts so older modules remain available.
