# EduNexa V11 – Faculty/HOD Login & HOD Data Flow

## Login Flow
```text
EduNexa Login
   |
   +-- Student
   |
   +-- Faculty
   |     |
   |     +-- Faculty Login
   |     +-- HOD Login
   |
   +-- Management

Faculty selected -> choose Faculty or HOD -> enter ID/email + password -> Login

HOD selected -> HOD dashboard opens -> HOD features are shown only after login
```

## HOD Features After Login
1. Student Records & Marks
2. Faculty & Subject Details
3. Mark Change Approval
4. Class & Timetable Control
5. Feedback & Analytics
6. Department Achievements
7. Faculty Timetable
8. Faculty Attendance
9. HOD Extra Details
10. Notifications

## Sample Data
The HOD portal is seeded with at least five sample records for the main HOD feature areas so dashboards and lists are not empty on first run.

- 5+ department students
- 5 department faculty records
- 5+ mark records
- 5 mark-change requests
- 5+ timetable records
- 5 faculty timetable records
- 5 faculty attendance records
- 5 committee feedback records
- 5 department achievement records
- 5 department plan/extra-detail records

## Important UI Change
The HOD feature preview card is removed from the login page. HOD feature cards and detailed data appear only after successful HOD login.

The Demo Faculty / Demo HOD buttons are removed from the login page.

## V11.1 HOD Blank Dashboard Fix
- HOD login now opens `hod-dashboard` directly.
- Removed the legacy `hod-v2-*` navigation from the HOD sidebar.
- Legacy HOD V2 route IDs are safely redirected to the current HOD pages.
- All HOD pages are checked and rendered after login/session restore.
- Existing HOD sample data is preserved.
