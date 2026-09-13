# EduNexa – Student Enhancement Flowchart (2026)

```text
                         ┌──────────────────────────┐
                         │       EduNexa Login       │
                         └────────────┬─────────────┘
                                      │
                           ┌──────────▼──────────┐
                           │   Student Section   │
                           └──────────┬──────────┘
                                      │
       ┌──────────────────────────────┼───────────────────────────────┐
       │                              │                               │
       ▼                              ▼                               ▼
┌───────────────┐             ┌────────────────┐             ┌──────────────────┐
│ Interactive   │             │ Leave Request  │             │ Skill Dashboard  │
│ Dashboard     │             │                │             │                  │
└──────┬────────┘             └───────┬────────┘             └────────┬─────────┘
       │                              │                               │
       ├─ Default attendance          ├─ One Leave Duration           ├─ Skill analysis
       │  for every student           ├─ From Date selected           ├─ Role recommendation
       ├─ Tests/Assignments           │  → To Date min = From Date    └─ Resume upload
       ├─ Leave count                 └─ Full/Half day + hours
       └─ Notification count

       ┌──────────────────────────────┼───────────────────────────────┐
       │                              │                               │
       ▼                              ▼                               ▼
┌───────────────────┐        ┌──────────────────┐             ┌──────────────────┐
│ Certificates &    │        │ Notifications   │             │ Class Details    │
│ Career Portfolio  │        │                  │             │                  │
└─────────┬─────────┘        └────────┬─────────┘             └────────┬─────────┘
          │                           │                                │
          ├─ Upload certificate       ├─ Faculty                       ├─ Class name
          ├─ View certificate         ├─ Class Adviser                 ├─ Academic year
          ├─ Persistent per student   ├─ Mentor                        ├─ Class Adviser
          ├─ Completed courses        ├─ HOD                           ├─ Mentor
          └─ Internship details       └─ Admin                         ├─ Subject faculty
                                                                       └─ Class timetable
                                                                                │
                                                                                ▼
                                                                  ┌────────────────────┐
                                                                  │ Class Adviser      │
                                                                  │ enters / edits     │
                                                                  │ timetable          │
                                                                  └─────────┬──────────┘
                                                                            │
                                                                            ▼
                                                                  ┌────────────────────┐
                                                                  │ Shared timetable   │
                                                                  │ for every student  │
                                                                  │ in same class      │
                                                                  └────────────────────┘

PERSISTENCE:
Student registration / requests / tests / assignments / certificates /
courses / internships / feedback / notifications / timetable data
remain in the existing EduNexa local database after Logout.
Logout clears only the active session, not the stored application data.
```

## Safety / compatibility rule

- Existing Student, Faculty, HOD and Management modules are preserved.
- Existing registration, requests, tests, assignments, marks, fees, feedback and notifications are not deleted.
- The enhancement is loaded as an additional JavaScript/CSS layer.
- The existing class timetable data structure is retained and enhanced with edit/delete support for Class Adviser.
