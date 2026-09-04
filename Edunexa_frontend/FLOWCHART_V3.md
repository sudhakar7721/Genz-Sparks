# EduNexa V3 Requested Feature Flowchart

```mermaid
flowchart TD
    A[Login] --> R{Role}

    R --> S[Student]
    S --> ST[Class Timetable<br/>Weekly Rows × Period Columns]
    S --> LC[Class Adviser Leave Console]
    LC --> LF[Submit Leave Request]
    LF --> AC[Class Adviser Leave Console]
    LC --> MR[My Leave Requests Table]
    AC --> D{Approve / Decline}
    D --> MR

    R --> F[Faculty]
    F --> FT[Faculty Timetable<br/>Weekly Rows × Period Columns]
    F --> CT[Class Timetable<br/>Weekly Rows × Period Columns]
    F --> AL[Class Adviser Leave Console]
    AL --> D

    R --> M[Management]
    M --> H[HOD Details]
    H --> HV[View HOD]
    H --> HE[Edit HOD]
    H --> HA[Add New HOD]
    M --> DEP[Department Details & Feedback]
    DEP --> DV[View Department]
    DEP --> DE[Edit Department]
    DEP --> DA[Add New Department]
    DEP --> FB[Feedback Count + Average Rating]
```

## Final navigation

**Student**
- Class Timetable
- **Class Adviser Leave Console** — one section only; request form + My Leave Requests table

**Faculty**
- **Faculty Timetable** — weekly rows/columns
- **Class Timetable** — weekly rows/columns
- Class Adviser Leave Console (for advisers)

**Management**
- **HOD Details** — View / Edit / Add New HOD
- **Department Details & Feedback** — View / Edit / Add New Department + feedback analytics
- Removed the old **Management Views** group and separate management feedback entry.
