# EduNexa — Department + Class Adviser Privacy Flowchart

```mermaid
flowchart TD
    A[EduNexa Login] --> B{Role}
    B --> S[Student]
    B --> F[Faculty]
    B --> H[HOD]
    B --> M[Management]

    S --> S1[Own profile + own academic data]
    S --> S2[Submit leave request]
    S2 --> CA[Assigned Class Adviser]

    F --> F1{Class Adviser?}
    F1 -->|No| FD[Same-department academic data only]
    F1 -->|Yes| FC[Assigned class only]
    FC --> P[Student personal details]
    FC --> L[Leave requests + reasons + approval]
    FC --> AT[Attendance / Marks / Fees / Feedback]

    H --> HD[Own department academic data]
    HD --> HP[No personal details]
    HD --> HL[No student leave details]
    HD --> HR[Department approvals / analytics]

    M --> MA[All departments]
    MA --> MP[All student/faculty/HOD records]
    MA --> ML[Institution-wide reports and controls]

    P --> X[Privacy boundary]
    L --> X
    HP --> X
    HL --> X
    X --> Z[Only assigned Class Adviser or Management can access student personal/leave details]
```

## Access rules

| Role | Student academic data | Student personal details | Leave details | Scope |
|---|---|---|---|---|
| Student | Own only | Own only | Own requests | Self |
| Faculty (non-adviser) | Yes | No | No | Same department |
| Class Adviser | Yes | Yes | Yes + approve/reject | Assigned class |
| HOD | Yes | No | No | Same department |
| Management | Yes | Yes | Yes | All departments |

### Important behavior
- A Class Adviser is additionally restricted by `classesHandled`; they do not automatically receive every student in the department.
- Student personal records include address, parent/guardian details, contacts, blood group, school history, 10th/12th marks and additional private details.
- Leave reason, dates, duration and review status are Class Adviser-only for staff, except Management.
- Faculty/HOD department dashboards can continue to show permitted academic information without exposing private profile fields.
- Existing EduNexa modules and features are retained; this change adds privacy boundaries rather than removing functionality.
