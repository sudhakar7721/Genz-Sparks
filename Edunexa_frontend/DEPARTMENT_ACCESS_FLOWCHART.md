# EduNexa Department-Wise Access Flowchart

## Access rule

**Management → ALL departments**  
**Faculty → ONLY students/data from Faculty's department**  
**HOD → ONLY students/data from HOD's department**  
**Student → ONLY the logged-in student's own academic/profile data**

```mermaid
flowchart TD
    A[EduNexa Login] --> B{User Role}

    B -->|Student| C[Student Session]
    B -->|Faculty| D[Faculty Session]
    B -->|HOD| E[HOD Session]
    B -->|Management| F[Management Session]

    C --> C1[Own Student ID]
    C1 --> C2[Own marks • attendance • fees • leave • tests • assignments • profile]

    D --> D1[Read logged-in Faculty Department]
    D1 --> D2[Filter students by same department]
    D2 --> D3[Student Management]
    D2 --> D4[Attendance]
    D2 --> D5[Marks]
    D2 --> D6[Leaves]
    D2 --> D7[Mentor / Adviser]
    D2 --> D8[Department tests & assignments]

    E --> E1[Read logged-in HOD Department]
    E1 --> E2[Filter students & faculty by same department]
    E2 --> E3[HOD Student Details]
    E2 --> E4[HOD Faculty Details]
    E2 --> E5[Mark Change Requests]
    E2 --> E6[Department timetable / attendance / feedback]

    F --> F1[College-wide Management Access]
    F1 --> F2[All 5 departments]
    F2 --> F3[All students]
    F2 --> F4[All faculty & HOD]
    F2 --> F5[Fees • Marks • Placements • Reports • Analytics]

    G[Unauthorized cross-department student] --> H[Access Denied]
    D3 --> G
    D4 --> G
    D5 --> G
    D6 --> G
    E3 --> G
    E5 --> G
```

## Data flow

```text
Login
  ↓
Authenticated User
  ↓
Role + Department
  ↓
Department Access Layer
  ├── Student  → own record only
  ├── Faculty  → currentUser.department
  ├── HOD      → currentUser.department
  └── Management → no department restriction
  ↓
Existing EduNexa Features
  ↓
Filtered UI + filtered actions + access checks
  ↓
localStorage database
```

## Important implementation details

- Existing features are preserved; the change is an access/filter layer.
- `students()` is now role-aware.
- `getStudent()` refuses unauthorized cross-department student access.
- Faculty student records, attendance, marks, leave, mentor/adviser and academic lists are department-scoped.
- HOD student/faculty records, mark requests, feedback and faculty timetable/attendance are department-scoped.
- Management remains college-wide.
- New tests, assignments, leave records and mark requests store department metadata.
- The supplied 77-account structure is included: **50 students + 20 faculty + 5 HOD + 2 management** across **5 departments**.
