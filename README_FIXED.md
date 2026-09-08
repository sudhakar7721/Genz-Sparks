# EduNexa V12 - Full Fixed Connected Package

This package contains:
- Edunexa_backend: FastAPI + SQLite backend
- Edunexa_frontend: HTML/CSS/JavaScript frontend
- SQLite database with sample/imported users and data
- Frontend-to-backend JWT authentication bridge

## 1. Start backend (Terminal 1)

Open PowerShell in `Edunexa_backend`:

```powershell
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend:
http://127.0.0.1:8000

Swagger:
http://127.0.0.1:8000/docs

## 2. Start frontend (Terminal 2)

Open PowerShell in `Edunexa_frontend`:

```powershell
python -m http.server 5500
```

Open:
http://127.0.0.1:5500

If the browser shows a directory listing, open `index.html`.

## 3. Demo login

Student:
- Student ID: DA2025001
- Email: arun_kumar@example.com
- Password: 123456

Faculty:
- Faculty ID: FAC-1001
- Email: faculty@edunexa.com
- Password: 123456

HOD:
- HOD ID: HOD-1001
- Email: hod@edunexa.com
- Password: 123456

Management:
- Email: admin@edunexa.com
- Password: 123456

## 4. Important architecture change

The frontend login now calls:

POST /api/auth/login

with:
```json
{"identifier":"DA2025001","password":"123456"}
```

The backend accepts email, student ID, faculty ID, or HOD ID.

The JWT is stored as `edunexa_token`. The frontend also keeps a mapped session object for compatibility with the existing UI modules, but does not store the backend password/hash.

## 5. Existing features

The existing frontend files/modules are retained. The API bridge was added rather than replacing the existing dashboard code.

## 6. If the browser says "Failed to fetch"

Make sure:
1. Backend is running on port 8000.
2. Frontend is running on port 5500.
3. You opened the frontend through `http://127.0.0.1:5500`, not by double-clicking index.html.
4. Check `http://127.0.0.1:8000/docs`.
