# EduNexa — Frontend ↔ Backend Connectivity Guide

EduNexa is a two-part academic management system:

| Part | Tech | Path |
|---|---|---|
| Frontend | Vanilla JS SPA (localStorage demo) | `Edunexa_frontend/` |
| Backend | FastAPI + SQLite REST API (port 8000) | `Edunexa_backend/` |

This package connects the two: the frontend now talks to the backend for
**login, register, and all data (students, marks, fees, feedback, leaves,
tests, assignments, submissions, placements, achievements)** instead of
running purely on demo data.

## Login accounts — 77 total

The project includes the complete credential list supplied in `Login Details.pdf`:

- 50 Student accounts
- 20 Faculty accounts
- 5 HOD accounts
- 2 Management accounts

The same credentials are stored in `LOGIN_ACCOUNTS.csv` for quick reference. The
backend seed data is in `Edunexa_backend/data/login_accounts.json`.

The backend initialization script automatically creates/updates all 77 accounts
before the API starts, so the accounts are retained even if the database is
recreated.

### Account format

Student passwords use the supplied `<login-id>@123` pattern.
Faculty passwords use `<login-id-prefix>@fac_77`.
HOD passwords use `<login-id-prefix>@hod_55`.
Management passwords use `<login-id-prefix>@admin_33`.

The exact names, login IDs and passwords are listed in `LOGIN_ACCOUNTS.csv`.


| Role | Email | Login screen |
|---|---|---|
| Student | `alexa@example.com` | Student card (or enter `EDU2026-1048` as Student ID) |
| Faculty | `faculty@edunexa.com` | Staff card → Faculty |
| HOD | `hod@edunexa.com` | Staff card → HOD |
| Management | `admin@edunexa.com` | Management card |

## How it works

- `Edunexa_frontend/js/core/api.js` — the API client. Points at
  `http://127.0.0.1:8000/api` by default.
- `Edunexa_frontend/js/core/api_bridge.js` — the integration layer:
  1. Overrides `login` / `register` / `logout` with real backend validation
     (checks your selected role card matches the account's actual role).
  2. After login, loads backend data (marks, fees, feedback, leaves, tests,
     assignments, submissions, notifications, departments, class lists,
     achievements, placements) and merges it into the app's `db`.
  3. Every save is written through to the backend (debounced syncing).
  4. Shows a green **"EduNexa backend connected"** pill in the top bar.
  5. **Offline fallback:** if the backend is not running, the app still works
     as the original localStorage demo — data just stays local.

No changes were needed to any existing feature module; the bridge layers on top.

## Run on Windows (two Command Prompt windows)

```
run_backend.bat      <- installs deps + starts API on http://127.0.0.1:8000
run_frontend.bat     <- serves the app on http://127.0.0.1:5500
```

Then open http://127.0.0.1:5500 in your browser.

## Run on Linux / macOS

```
bash run.sh
```

Open http://127.0.0.1:5500 (API docs at http://127.0.0.1:8000/docs).
If the backend deps are missing, `run.sh` creates a venv and installs them
(`Edunexa_backend/requirements.txt`). Already-created venv from the original
Windows dev machine is not shipped; recreate it with one of the scripts above.

## Port 8000 already in use?

The API base URL is overridable **without editing code**. Either:

- Open the Developer Console (F12) once on the app and run:
  ```js
  localStorage.setItem("edunexa_api_url", "http://127.0.0.1:8026/api")
  ```
  then reload — or
- Edit the `API_BASE` / `window.EDUNEXA_API_URL` default at the top of
  `Edunexa_frontend/js/core/api.js`.

Whatever port you pick, start the backend on the same port, e.g.:
```
EDUNEXA_PORT=8026 bash run.sh          # Linux/macOS
run_backend.bat                        # Windows: edit the port in that file
```

## Notes

- The SQLite database (`Edunexa_backend/data/edunexa.db`) is created and
  seeded automatically the first time the backend starts (4 demo accounts,
  sample marks/fees). Old copies are preserved under
  `Edunexa_backend/data/root-owned-backups/`.
- API reference: http://127.0.0.1:8000/docs (Swagger UI).
- Security: the backend never returns password hashes to the frontend
  (`/students`, `/faculty`, etc. strip `password_hash`).