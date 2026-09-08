# EduNexa V12 — Corrected FastAPI + SQLite Backend

This package is a corrected local-development backend for EduNexa.

## What was fixed

- Login now accepts **email, Student ID, Faculty ID, or HOD ID** in the `identifier` field.
- Login safely rejects malformed/legacy bcrypt hashes instead of crashing.
- Replaced the Passlib/bcrypt version-warning path with the `bcrypt` package directly.
- Centralized frontend API helper stores and sends the JWT bearer token.
- Added frontend helper methods for students and departments.
- Existing Student, Faculty, HOD, and Management API routes/schema/data are retained.

## Requirements

- Windows 10/11
- Python 3.12 recommended
- VS Code recommended

## Install and run

From this folder:

```bat
py -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Swagger:

`http://127.0.0.1:8000/docs`

Health:

`http://127.0.0.1:8000/api/health`

## Login

The login body is now:

```json
{
  "identifier": "DA2025001",
  "password": "123456"
}
```

Email also works:

```json
{
  "identifier": "arun_kumar@example.com",
  "password": "123456"
}
```

For Arun Kumar:

- Student ID: `DA2025001`
- Email: `arun_kumar@example.com`
- Password: `123456`

## Important: existing database

The ZIP contains the current `data/edunexa.db` so your current imported data is preserved.

A backup is also included. Do **not** run `scripts/reset_database.py` unless you intentionally want to reset the database to demo data.

If a student password needs to be reset:

```bat
python reset_student_password.py
```

This sets all student accounts to `123456`.

## Frontend API connection

Use:

`frontend_integration/api.js`

The API base is:

`http://127.0.0.1:8000/api`

Example browser-console test after loading `api.js`:

```js
EduNexaAPI.login('DA2025001', '123456')
```

Then:

```js
EduNexaAPI.me()
```

The JWT is stored in `localStorage["edunexa_token"]` and automatically sent as a Bearer token.

## Simple HTML frontend server

If VS Code Live Server is unavailable, run the following from your frontend folder:

```bat
python -m http.server 5500
```

Then open:

`http://127.0.0.1:5500`

Do not open an API-connected frontend as `file:///...`.

## CORS

The default development origins include:

- `http://127.0.0.1:5500`
- `http://localhost:5500`
- `http://127.0.0.1:5173`
- `http://localhost:5173`
- `http://127.0.0.1:3000`
- `http://localhost:3000`

For production, set `EDUNEXA_SECRET_KEY` and `EDUNEXA_CORS_ORIGINS`.
