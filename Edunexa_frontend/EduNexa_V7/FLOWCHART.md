# EduNexa Enhanced Flowchart

```text
LOGIN
  |
  +--> Student
  |      +--> Dashboard / Academics / Tests / Assignments
  |      |      +--> Upload submission files
  |      +--> Attendance / Fees / Skills / Notifications
  |      +--> Leave
  |      |      +--> Full Day
  |      |      +--> Half Day -> 1..6 hours
  |      |      +--> My Leave Requests -> Table
  |      +--> Certificates / Courses / Internships / Additional Details
  |      +--> Class Timetable -> Subject -> Faculty
  |      +--> Class Committee
  |             +--> Subject-wise feedback
  |             +--> General feedback
  |             +--> Class Adviser + HOD
  |
  +--> Faculty
  |      +--> Existing Faculty Dashboard
  |      +--> Tests / Assignments
  |      |      +--> Upload question/reference file
  |      +--> Student Management -> Complete Student Record
  |      +--> Attendance / Leave / Marks
  |      +--> Mentor / Class Adviser
  |             +--> Enter Class Timetable + Subject Faculty
  |             +--> Mark edit period
  |                    +--> Period open -> change mark
  |                    +--> Period expired -> HOD request
  |                                      |
  |                                      +--> HOD Approve
  |                                      |      -> temporary faculty edit access
  |                                      |
  |                                      +--> HOD Reject
  |
  +--> HOD (separate login)
  |      +--> Faculty details
  |      +--> Student records
  |      +--> Class details
  |      +--> Class timetable
  |      +--> Faculty timetable
  |      +--> Faculty attendance
  |      +--> Mark-change request approval
  |      +--> Class Committee feedback
  |      +--> Extra HOD details
  |
  +--> Management
         +--> Existing Management features
         +--> HOD details
         +--> Department details
         +--> Fees / Marks / Placements / Faculty
         +--> Extra institution details

DATA LAYER
  |
  +--> Browser localStorage (`edunexa_v4`)
  +--> Existing records preserved
  +--> New arrays migrated automatically
  +--> Parent notifications routed by parent contact
```
