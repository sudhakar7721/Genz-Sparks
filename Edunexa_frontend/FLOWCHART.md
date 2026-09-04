# EduNexa Frontend Flowchart

```mermaid
flowchart TD
    A[Start EduNexa] --> B[Login / Signup]
    B --> C{Select Role}

    C -->|Student| S[Student Portal]
    C -->|Faculty| F[Faculty Portal]
    C -->|Management| M[Management Portal]

    S --> S1[Dashboard]
    S --> S2[Marks & Academics]
    S --> S3[Tests]
    S --> S4[Assignments]
    S --> S5[Attendance]
    S --> S6[Fees]
    S --> S7[Leave Request]
    S --> S8[Skill Dashboard]
    S --> S9[Feedback]
    S --> S10[Notifications]

    F --> F1[Dashboard]
    F --> F2[Tests]
    F --> F3[Assignments]
    F --> F4[Attendance]
    F --> F5[Leave Requests]
    F --> F6[Marks & Results]
    F --> G{Special Access}
    G -->|Mentor| F7[Student Skill Dashboard]
    G -->|Class Adviser| F8[Full Class Access]
    F8 --> F9[Student Fees]
    F8 --> F10[Parent Notifications]
    F8 --> F11[Student Feedback]

    M --> M1[Dashboard]
    M --> M2[Faculty Details]
    M --> M3[Department Fees]
    M --> M4[Student Marks]
    M --> M5[Placements]
    M --> M6[Feedback Analytics]

    S2 --> D[(EduNexa Local Database)]
    S3 --> D
    S4 --> D
    S5 --> D
    S6 --> D
    S7 --> D
    S8 --> D
    S9 --> D
    F2 --> D
    F3 --> D
    F4 --> D
    F5 --> D
    F6 --> D
    F7 --> D
    F8 --> D
    M2 --> D
    M3 --> D
    M4 --> D
    M5 --> D
    M6 --> D

    D --> N[Notifications / Role-aware Updates]
    N --> S10
    N --> F
    N --> M
```

## Data flow
`User -> Role Authentication -> Role Navigation -> Module -> Local Database -> UI Refresh / Notifications`

The current frontend stores its demo data in browser `localStorage`, using the `edunexa_v4` database key.
