# EduNexa V13 – Requested Feature Flowchart

```mermaid
flowchart TD
    A[Faculty Login] --> B{Faculty Module}
    B --> C[Published Tests]
    B --> D[Published Assignments]
    B --> E[Attendance Management]
    B --> F[Class Adviser Leave Console]

    C --> C1[Show latest 3]
    C --> C2[View Full Details]
    C2 --> C3[Edit Test]
    C2 --> C4[Seen Count + Completed Count]
    C2 --> C5[Student Activity Table]
    C --> C6[History - all older tests in DB]
    C --> C7[Publish New Test]
    C7 --> N[Target Class Only]

    D --> D1[Show latest 3]
    D --> D2[View Full Details]
    D2 --> D3[Edit Assignment]
    D2 --> D4[Seen Count + Completed Count]
    D2 --> D5[Student Activity Table]
    D --> D6[History - all older assignments in DB]
    D --> D7[Publish New Assignment]
    D7 --> N
    N --> O[Create notification for each student in target class]

    E --> E1[Handled Classes]
    E1 --> E2[Student Attendance %]
    E2 --> E3[View Student]
    E3 --> E4[Daily Attendance Table]

    F --> F1[Pending Requests]
    F1 --> F2{Accept / Decline}
    F2 --> F3[Hide from Pending View]
    F2 --> F4[Store Status in SQLite]
    F2 --> F5[Notify Requesting Student]
    F --> F6[All Requests]
    F6 --> F7[Student Name Filter]
    F6 --> F8[Status Filter]
    F6 --> F9[Date Filter]
    F6 --> F10[Month Filter]

    S[Student Login] --> T[Class Details]
    T --> T1[Class + Year / Batch]
    T --> T2[Department]
    T --> T3[Class Adviser]
    T --> T4[Mentor]
    T --> T5[HOD]
    T --> T6[Subject Faculty]
    T --> T7[Weekly Timetable Table]

    DB[(SQLite Database)]
    C3 --> DB
    D3 --> DB
    C6 --> DB
    D6 --> DB
    F4 --> DB
    E4 --> DB
    T7 --> DB
```

## Data flow summary

- **Tests/Assignments:** new records are saved to SQLite; only the latest three are displayed in the main Published list. Older records remain available through History.
- **Assessment activity:** students generate a `seen` record when they open/start a test or assignment; existing submissions are counted as completion/submission activity.
- **Notifications:** publishing an assessment creates notifications only for students assigned to the selected class. Leave decisions notify the requesting student.
- **Attendance:** daily attendance remains the existing source of truth. The new faculty view calculates each student's percentage and opens the existing daily attendance records.
- **Leave:** Accept/Decline updates the existing leave row instead of deleting it. The pending console hides reviewed requests, while All Requests exposes the complete history with filters.
- **Class Details:** the student page reads the assigned class hierarchy and class timetable from the same backend database.

## Compatibility rule

All changes are additive. Existing authentication, registration, marks, fees, feedback, placement, mentor, timetable editing, submissions, notifications, HOD and Management modules are retained.
