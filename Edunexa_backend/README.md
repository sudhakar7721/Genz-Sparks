# EduNexa Python Backend

A modular FastAPI + SQLAlchemy backend for the EduNexa frontend.

## Stack
- Python 3.11+
- FastAPI
- SQLAlchemy
- SQLite for zero-configuration development
- MySQL supported through DATABASE_URL
- JWT authentication
- CORS enabled for the frontend

## 1. Install

```bash
cd backend
python -m venv venv
```

Windows:
```bash
venv\Scripts\activate
```

macOS/Linux:
```bash
source venv/bin/activate
```

```bash
pip install -r requirements.txt
```

## 2. Configure

Copy `.env.example` to `.env`.

Default development database:
`sqlite:///./edunexa.db`

For MySQL:
`mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/edunexa`

## 3. Seed demo data

```bash
python seed.py
```

## 4. Run

```bash
uvicorn app.main:app --reload --port 8000
```

API:
http://127.0.0.1:8000

Swagger:
http://127.0.0.1:8000/docs

Health:
http://127.0.0.1:8000/api/health

## Demo accounts

Student:
- email: alexa@example.com
- password: 123456

Faculty:
- email: faculty@edunexa.com
- password: 123456

Management:
- email: admin@edunexa.com
- password: 123456

## Frontend

Change frontend API base URL to:

`http://127.0.0.1:8000/api`

The old localStorage database can remain temporarily while modules are migrated one by one.
