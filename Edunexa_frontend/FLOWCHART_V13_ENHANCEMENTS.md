# EduNexa V13 Requested Enhancements Flowchart

```text
                         EDUNEXA
                            │
             ┌──────────────┴──────────────┐
             │                             │
        FACULTY SECTION              STUDENT SECTION
             │                             │
     ┌───────┼────────┐              CLASS DETAILS
     │       │        │                    │
   TESTS  ASSIGN. ATTENDANCE              │
     │       │        │             ┌──────┴───────────────┐
     │       │        │             │                      │
 Latest 3  Latest 3  All handled   Class & Year       Staff Details
     │       │       classes        │                  │
  View/Edit View/Edit │          Timetable       Adviser / Mentor
     │       │       │          in table          / HOD / Subject Faculty
     └───┬───┴───┐   │
         │       │   └─────── Student Attendance %
      History  History          │
         │       │          View student
      All old records           │
                 │              └── All-day attendance table
                 │
          Publish new assessment
                 │
          Target Class Students
                 │
          Backend creates notification
                 │
          Student Notification Center

       CLASS ADVISER LEAVE CONSOLE
                    │
              Pending Requests
                    │
             Accept / Decline
                    │
          ┌─────────┴─────────┐
          │                   │
       Hide from          Save in SQLite
       pending view             │
          │              All Requests
          │                   │
          └──────────── Filter ────────────┐
                         │                 │
                  Student / Status / Date / Month
                         │
                  Accept/Decline
                         │
                  Student notification
```

## Data flow

```text
Frontend JavaScript
       │ fetch + JWT
       ▼
FastAPI REST API
       │
       ├── Tests / Assignments + history
       ├── Assessment views + submissions
       ├── Target-class notifications
       ├── Attendance overview + daily details
       ├── Leave review + filters
       └── Student class details
       │
       ▼
SQLite (edunexa.db)
```
