# EduNexa V12 — Complete FastAPI + SQLite Backend

This package is the completed backend for the EduNexa academic management system.

## 1. Requirements

- Windows 10/11
- Python 3.12 recommended
- VS Code (recommended)

## 2. Run on Windows

Open Command Prompt in this folder:

```bat
py -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

If `py` is unavailable, use `python` to create the virtual environment.

Backend:
- http://127.0.0.1:8000
- Swagger API documentation: http://127.0.0.1:8000/docs
- ReDoc: http://127.0.0.1:8000/redoc
- Health check: http://127.0.0.1:8000/api/health

## 3. Demo accounts

Password for all demo accounts: `123456`

| Role | Email |
|---|---|
| Student | alexa@example.com |
| Faculty | faculty@edunexa.com |
| HOD | hod@edunexa.com |
| Management | admin@edunexa.com |

The frontend can show Student / Faculty / Management at the top level. When Faculty is selected, it can present Faculty and HOD login choices without displaying HOD/Faculty in the main section.

## 4. Included backend modules

### Authentication
- Login
- Registration
- JWT bearer authentication
- `/api/auth/me`
- Role-based authorization
- Student / Faculty / HOD / Management roles

### Student
- Complete student profile
- Parent and contact information
- School, 10th and 12th marks
- Blood group and additional details
- Marks
- Attendance
- Class timetable
- Tests
- Assignments
- File upload and submission
- Full-day leave
- Half-day leave with 1–6 hour control
- Leave request table API
- Certificates
- Completed courses
- Internships
- Fees
- Feedback
- Notifications

### Faculty
- Student records
- Student profile update
- Faculty details
- Classes handled
- Subjects handled
- Class adviser information
- Faculty timetable
- Class timetable
- Attendance
- Marks entry
- Mark change request
- Test creation for a selected class
- Assignment creation for a selected class
- Question/assignment file upload
- Submission viewing and evaluation
- Leave review
- Feedback viewing and response

### HOD
- Department dashboard
- Overall department achievements
- Department student details
- Student marks
- Placement details
- Full faculty details
- Class adviser / subjects information
- Feedback analytics
- Feedback response
- Mark-change approval / decline
- Class timetable
- Faculty timetable
- Achievement management
- Department-specific access control

### Management
- Overall management dashboard
- All departments
- All students
- All faculty
- Student fee details
- Department/class fee structures
- Tuition / bus / hostel / placement totals and paid values
- Student marks access
- Mark changes with explicit student approval
- Placement company information
- Campus visit / not-visited status
- Placement packages
- Department-wise placement ranking
- Faculty details, classes and subjects

## 5. Database

SQLite database is automatically created at:

`data/edunexa.db`

Uploads are stored at:

`uploads/`

The database schema is in:

`app/schema.sql`

Initialization and demo-data creation:

`app/init_db.py`

To reset the database to demo data:

```bat
python scripts/reset_database.py
```

## 6. Frontend integration

Use:

`frontend_integration/api.js`

The API base URL is:

`http://127.0.0.1:8000/api`

The helper automatically adds the saved JWT token from:

`localStorage["edunexa_token"]`

Do not create a second API helper with another `API_BASE_URL`; use one centralized API configuration.

## 7. Main API groups

- `/api/auth/*`
- `/api/dashboard/*`
- `/api/students/*`
- `/api/faculty/*`
- `/api/marks/*`
- `/api/hod/*`
- `/api/classes/*`
- `/api/departments`
- `/api/timetables/*`
- `/api/attendance/*`
- `/api/leaves/*`
- `/api/feedback/*`
- `/api/files/*`
- `/api/academics/tests`
- `/api/academics/assignments`
- `/api/academics/submissions`
- `/api/student-records/*`
- `/api/fees/*`
- `/api/placements/*`
- `/api/management/*`
- `/api/notifications/*`

## 8. Important frontend connection

Start the backend first:

```bat
python -m uvicorn app.main:app --reload --port 8000
```

Then start your frontend.

For a Vite frontend, normally:

```bat
npm install
npm run dev
```

For a simple HTML frontend, use VS Code Live Server or another local web server.

Never open the frontend by relying on `file:///...` when API/CORS testing is required.

## 9. Troubleshooting

### pip is not recognized

Use:

```bat
python -m pip install -r requirements.txt
```

instead of:

```bat
pip install -r requirements.txt
```

### uvicorn is not recognized

Use:

```bat
python -m uvicorn app.main:app --reload --port 8000
```

### Login says Invalid email or password

Make sure the backend is running and reset the demo database:

```bat
python scripts/reset_database.py
```

Then restart Uvicorn and use the demo accounts above.

### CORS error

The backend already allows common local development origins including:
- 127.0.0.1:5500
- localhost:5500
- 127.0.0.1:5173
- localhost:5173
- 127.0.0.1:3000
- localhost:3000

## 10. Security note

The included secret key is intended for local development only. Before production deployment, set:

`EDUNEXA_SECRET_KEY`

to a long random secret and configure the exact frontend origin using:

`EDUNEXA_CORS_ORIGINS`
