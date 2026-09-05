# EduNexa V5

This package is based on the existing EduNexa V4 project and keeps the existing modules while consolidating duplicate UI sections.

## Demo accounts
- Student: alexa@example.com / 123456
- Faculty: faculty@edunexa.com / 123456
- HOD: hod@edunexa.com / 123456
- Management: admin@edunexa.com / 123456

## Included sample reports
- 4 HOD directory records
- 4 department records
- Department descriptions and sample feedback notes
- Existing feedback, fees, marks, placement, timetable, attendance and student/faculty demo data remain intact
- `sampleReports` summary is stored in localStorage for demo reporting

## Important
The frontend uses localStorage for demo data. When connecting the FastAPI/SQLite backend, replace the localStorage data layer with API calls.
