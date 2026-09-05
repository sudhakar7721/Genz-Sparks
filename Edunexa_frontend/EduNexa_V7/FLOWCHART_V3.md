# EduNexa V3 Flowchart — Requested Changes + Existing Features Preserved

```text
LOGIN / REGISTRATION
 |
 +--> STUDENT
 |     |
 |     +--> Dashboard
 |     +--> Marks / Academics
 |     +--> Tests + Assignments
 |     +--> Attendance
 |     +--> Fees
 |     +--> LEAVE & CLASS ADVISER 🗓️  [ONE SECTION ONLY]
 |     |      |
 |     |      +--> Submit Full-Day / Half-Day leave
 |     |      +--> Date / period / hours / reason
 |     |      +--> Request --> Class Adviser Leave Console
 |     |      +--> My Leave Requests --> TABLE FORMAT
 |     |      +--> Status: Pending / Approved / Rejected
 |     |
 |     +--> Class Timetable 🕐
 |            +--> ROWS = Days
 |            +--> COLUMNS = Periods
 |            +--> Subject + Faculty
 |
 +--> FACULTY
 |     |
 |     +--> Existing Tests / Assignments / Attendance / Marks
 |     +--> Faculty Timetable 📅
 |     |      +--> ROWS = Days
 |     |      +--> COLUMNS = Periods
 |     |      +--> Class + Subject + Room
 |     |
 |     +--> CLASS ADVISER
 |            +--> Class Adviser Leave Console 🗓️
 |            |      +--> Receives student leave requests
 |            |      +--> View / Approve / Decline
 |            +--> Class Timetable 🕐
 |                   +--> ROWS = Days
 |                   +--> COLUMNS = Periods
 |                   +--> Subject + Faculty + Room
 |
 +--> HOD
 |     +--> Existing HOD console preserved
 |     +--> Achievements
 |     +--> Class / Student / Marks / Placement
 |     +--> Faculty details
 |     +--> Feedback & Analytics
 |
 +--> MANAGEMENT
       |
       +--> Existing Fees / Marks / Placements / Faculty modules
       |
       +--> HOD INFORMATION 🏛️
       |      +--> View HODs across departments
       |      +--> Add New HOD
       |      +--> Edit HOD
       |      +--> Contact / Qualification / Experience / Office / Extra info
       |
       +--> DEPARTMENT DETAILS 🏫
              +--> View departments
              +--> Add New Department
              +--> Edit Department
              +--> Department code / HOD / classes / contact / description
              +--> Feedback count + average rating
              +--> View department feedback
              +--> OLD "Management Views" MENU REMOVED
```

## Data flow

Student Leave Form
    -> `db.classLeaveRequests`
    -> Class Adviser Leave Console
    -> Approve / Decline
    -> Student My Leave Requests table

Timetable
    -> `db.classTimetables` / `db.facultyTimetables`
    -> day-by-period matrix

Management HOD
    -> `db.hodDetails`
    -> optionally synchronized with HOD login user

Management Department
    -> `db.departments`
    -> feedback analytics reads `db.feedbacks`

All existing EduNexa modules remain in the project. The V3 layer adds/overrides only the requested behavior.
