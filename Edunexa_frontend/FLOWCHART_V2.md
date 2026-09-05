# EduNexa V2 Flowchart — Existing Features Preserved + New Features

```text
LOGIN / REGISTRATION
 |
 +--> Student ------------------------------+
 |    Existing modules preserved             |
 |    +--> Class Timetable (TABLE)           |
 |    +--> Existing Leave + Class Adviser    |
 |    +--> Tests / Assignments / Marks        |
 |                                             |
 +--> Faculty / HOD choice                   |
 |    |
 |    +--> FACULTY                          |
 |         +--> Existing Faculty features    |
 |         +--> Tests -> select Class        |
 |         +--> Assignments -> select Class  |
 |         +--> Faculty Timetable (TABLE)    |
 |         +--> Class Adviser Console        |
 |              +--> Leave Requests          |
 |              +--> Class Timetable (TABLE) |
 |              +--> Feedback View           |
 |         +--> Dashboard/Marks              |
 |              +--> Class + Department data |
 |                                             |
 |    +--> HOD                               |
 |         +--> Overall Department Achievements
 |         +--> Class Details
 |              +--> Student + Marks + Placement
 |         +--> Full Faculty Details
 |              +--> Adviser + Subjects + Extra
 |         +--> Feedback View + Analytics
 |         +--> Mark Change Request Approve/Decline
 |         +--> All Feedbacks                 |
 |                                             |
 +--> Management                           |
      +--> Existing Management features       |
      +--> HOD Details -> VIEW               |
      +--> Department Details -> VIEW        |
      +--> Feedback Analytics per Department |
```

## Data flow
Faculty selects a class when publishing a test/assignment -> record stores `className` -> student views are filtered to their class.
Student/Faculty/HOD/Management data continues to use the existing EduNexa localStorage database, so existing data is not intentionally removed.
