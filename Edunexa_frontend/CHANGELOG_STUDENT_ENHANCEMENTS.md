# EduNexa Student Enhancement Pack – Change Log

## Added
1. Interactive student dashboard with default attendance of 85% when attendance is missing.
2. Leave form protection against duplicate Leave Duration controls.
3. From Date -> To Date minimum-date validation.
4. Skill Dashboard role recommendation scoring and resume upload/view.
5. Persistent certificate view area with View Certificate action.
6. Notifications expanded to include Faculty, Class Adviser, Mentor, HOD and Admin targets.
7. Student Class Details view: class, year/batch, adviser, mentor, subject faculty and shared timetable.
8. Class Adviser timetable edit/delete support; updates are shared through the existing database.

## Preserved
- Registration/login
- Leave requests
- Tests
- Assignments
- Marks
- Fees
- Feedback
- Notifications
- Faculty/HOD/Management modules
- Existing database/API bridge
- Existing UI modules

## Persistence
The existing EduNexa localStorage database remains unchanged. Logout removes only the active session, so stored application records remain available on the next login in the same browser profile.

## Backend integration fix
- Class Details now loads `/api/timetables/class` from FastAPI/SQLite.
- Class Adviser timetable Add/Edit uses the backend upsert endpoint.
- Students in the same class receive the same saved timetable.
- Login no longer clears the local application database before backend synchronization.
- New students receive a default attendance value of 85% when no real attendance records exist.
- Added 25 initial timetable rows (5 per department) so the Class Details screen is populated on the supplied database.
