# EduNexa - Frontend + FastAPI Backend Connected

This package connects the supplied modular EduNexa frontend to the supplied Python FastAPI backend.

## What was connected

- Login/logout with JWT authentication
- Student/faculty/management role selection
- Student profile
- Students and faculty data
- Marks
- Attendance
- Fees
- Tests (including test questions)
- Assignments
- Leave requests/reviews
- Skills data
- Student feedback and adviser responses
- Notifications
- Placements
- Management dashboard data

The frontend keeps its existing UI/module structure. `js/core/api.js` is the API bridge.

## 1. Start the backend on Windows

Open Command Prompt in:

`backend`

Then run:

```bat
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python seed.py
uvicorn app.main:app --reload --port 8000
```

Or use the included `run.bat` after installing dependencies and creating/seeding the database.

Backend:
- API: http://127.0.0.1:8000
- Swagger: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/api/health

## 2. Start the frontend

Open the package root in VS Code and run `index.html` with Live Server.

The frontend API base is:

`http://127.0.0.1:8000/api`

If Live Server uses another port, the backend CORS configuration already includes common development ports (5500, 5501, 3000 and 5173).

## Demo accounts

After `python seed.py`:

- Student: `alexa@example.com` / `123456`
- Faculty: `faculty@edunexa.com` / `123456`
- Management: `admin@edunexa.com` / `123456`

The login screen also accepts the seeded student ID (`EDU2026-1048`) and faculty ID (`FAC-1001`).

## Important

The backend is now the source of truth for the connected modules. Do not put database credentials in frontend JavaScript.

If an old `edunexa.db` exists from an earlier backend version, the backend contains a lightweight migration for the test-question column. For a clean demo database, delete `backend/edunexa.db` and run `python seed.py` again.
