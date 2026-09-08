# EduNexa Login & Role Flowchart

```text
                         ┌─────────────────────────┐
                         │     EduNexa Login       │
                         └────────────┬────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    │                 │                 │
                 Student           Faculty          Management
                    │                 │                 │
             50 student IDs    ┌──────┴──────┐      Admin login
             5 departments     │             │       2 accounts
             10 / department  Faculty       HOD
             4 classes / dept  20 accounts   5 accounts
                    │          4 / department   │
                    │                 │         │
                    │        one class adviser  │
                    │        per faculty       │
                    │                 │         │
                    └──────────┬──────┴─────────┘
                               │
                     ┌─────────▼─────────┐
                     │  Role Dashboard   │
                     └─────────┬─────────┘
                               │
      ┌────────────────────────┼────────────────────────┐
      │                        │                        │
 Student Modules         Faculty Modules          HOD Modules
      │                        │                        │
 • Timetable              • Student management      • Achievements
 • Marks                   • Tests / assignments    • Class details
 • File uploads            • Attendance             • Faculty details
 • Leave + half-day        • Class adviser console  • Feedback analytics
 • Leave requests table    • Timetable               • Mark change approval
 • Certificates            • Marks                   • Department overview
 • Courses / internships   • Feedback view
 • Class committee         • Class-specific tests
 • Subject/non-subject    • Mentor / adviser
   feedback                │
      │                    │
      └────────────────────┼────────────────────────┐
                           │                        │
                    Shared Data Layer         Management
                           │                        │
                    localStorage DB          • Fees by department/class
                    + future FastAPI/SQLite  • Student marks access/change
                                             • Placement companies
                                             • Placed students/packages
                                             • Faculty details
                                             • 2 admin accounts

Departments (5)
├─ Data Analytics → A, B, C, D
├─ Computer Science → A, B, C, D
├─ Commerce → A, B, C, D
├─ Artificial Intelligence → A, B, C, D
└─ Information Technology → A, B, C, D

Account totals: 50 Students + 20 Faculty + 5 HOD + 2 Admin = 77 logins
```
