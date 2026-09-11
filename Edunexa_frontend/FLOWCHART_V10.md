# EduNexa V10 — Faculty / HOD Authentication Flow

```text
Login Screen
   |
   +--> Student
   |
   +--> Faculty
   |      |
   |      +--> Faculty Login --> Faculty Dashboard
   |      |
   |      +--> HOD Login -----> HOD Dashboard
   |                              |
   |                              +--> Department Achievements
   |                              +--> Student Records & Marks
   |                              +--> Faculty Details
   |                              +--> Class Details / Timetables
   |                              +--> Mark Change Approvals
   |                              +--> Feedback & Analytics
   |
   +--> Management

Create New Account
   |
   +--> Student
   +--> Faculty
   +--> HOD
          |
          +--> Name + Email + Password
          +--> Department
          +--> Qualification
          +--> Experience
          +--> Phone
          +--> Auto-generated HOD ID
          +--> Save to local database
```

## Demo Run
- Demo Faculty: `faculty@edunexa.com` / `123456`
- Demo HOD: `hod@edunexa.com` / `123456`
- Clicking either demo button automatically opens the selected dashboard.
