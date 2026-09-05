# EduNexa V12 Full Backend

FastAPI + SQLite backend for the supplied EduNexa V12 frontend.

## Windows

```bat
py -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

If `py` is unavailable, use `python`.

- Backend: http://127.0.0.1:8000
- Swagger: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc

## Demo accounts

Password for all: `123456`

- Student: `alexa@example.com`
- Faculty: `faculty@edunexa.com`
- HOD: `hod@edunexa.com`
- Management: `admin@edunexa.com`

## Included modules

Authentication/JWT, SQLite persistence, student records, faculty records, HOD dashboard,
marks and HOD mark-change approval/decline, class and faculty timetables, full/half-day
leave (half-day 1-6 hours), attendance, feedback + HOD analytics, tests/assignments and
file uploads, certificates/courses/internships, fees, placement companies/package ranking,
achievements, notifications and role-based access.

The current V12 frontend still has its localStorage database. `frontend_integration/api.js`
contains a helper for gradually connecting its existing UI to this API without removing
existing features.

The SQLite database is created automatically at `data/edunexa.db`.
To reset demo data: `python scripts/reset_database.py`.
