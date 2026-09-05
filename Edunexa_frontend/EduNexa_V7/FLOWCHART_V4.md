# EduNexa V4 – Consolidated Feature Flowchart

```text
EDUNEXA
│
├── STUDENT
│   ├── Dashboard
│   ├── Class Timetable 🕐
│   │   └── Rows × Columns (Day × Period)
│   │       └── Subject + Subject Faculty
│   ├── Leave & Class Adviser 🗓️  [ONE MODULE]
│   │   ├── Full Day / Half Day
│   │   ├── Half Day Hours (1–6)
│   │   ├── Period / Hours + Reason
│   │   ├── Send → Class Adviser Leave Console
│   │   └── My Leave Requests → Table
│   ├── Tests & Assignments + File Upload
│   ├── Certificates / Courses / Internship
│   ├── Class Committee Feedback
│   └── Existing Student Features
│
├── FACULTY
│   ├── Dashboard
│   ├── Faculty Timetable 📅
│   │   └── Rows × Columns (Day × Period)
│   ├── Class Timetable 🕐  [ONE MODULE]
│   │   └── Rows × Columns (Day × Period)
│   ├── Class Adviser
│   │   └── Class Adviser Leave Console 🗓️
│   ├── Student Management
│   ├── Tests / Assignments + File Upload
│   ├── Attendance
│   ├── Marks & Mark Change Requests
│   ├── Feedback / Class Committee Feedback
│   └── Existing Faculty Features
│
├── HOD
│   ├── Dashboard / Achievements
│   ├── Faculty Details
│   ├── Student Records
│   ├── Class Details
│   ├── Class Timetables
│   ├── Faculty Timetable
│   ├── Mark Change Requests
│   ├── Faculty Attendance
│   ├── Feedback & Analytics
│   └── Extra Details
│
└── MANAGEMENT
    ├── Dashboard
    ├── Faculty Details
    ├── Department Fees
    ├── Student Marks
    ├── Placements
    ├── Feedback Analytics
    │
    ├── HOD Information 🏛️  [ONE MODULE]
    │   ├── HOD Details
    │   ├── View HOD
    │   ├── Add New HOD
    │   └── Edit HOD
    │
    ├── Department Details 🏫  [ONE MODULE]
    │   ├── Department Details
    │   ├── View Department
    │   ├── Add New Department
    │   ├── Edit Department
    │   └── Feedback Analytics / View Feedback
    │
    └── Extra Institution Details

REMOVED:
  ✕ Management Views → HOD Details — View
  ✕ Management Views → Department Details & Feedback
  ✕ Duplicate Management HOD module
  ✕ Duplicate Management Department module
  ✕ Duplicate Faculty Class Timetable module

All other existing EduNexa modules/features are preserved.
```
