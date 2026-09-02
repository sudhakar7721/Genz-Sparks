from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.core.config import settings
from app.core.database import Base, engine
from app.models import models

from app.routers import (
    auth, users, students, faculty, academics, attendance, fees,
    assessment, leave, skills, feedback, placements, notifications, management
)

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="EduNexa modular education management backend",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(set(settings.cors_list + ["http://127.0.0.1:5501", "http://localhost:5501", "http://127.0.0.1:3000", "http://localhost:3000", "http://127.0.0.1:5173", "http://localhost:5173"])),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

# Lightweight SQLite migration for existing EduNexa databases.
try:
    if engine.url.get_backend_name() == "sqlite":
        columns = {c["name"] for c in inspect(engine).get_columns("tests")}
        if "questions" not in columns:
            with engine.begin() as conn:
                conn.execute(text("ALTER TABLE tests ADD COLUMN questions JSON"))
except Exception as migration_error:
    print("EduNexa migration warning:", migration_error)

app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(students.router, prefix="/api")
app.include_router(faculty.router, prefix="/api")
app.include_router(academics.router, prefix="/api")
app.include_router(attendance.router, prefix="/api")
app.include_router(fees.router, prefix="/api")
app.include_router(assessment.router, prefix="/api")
app.include_router(leave.router, prefix="/api")
app.include_router(skills.router, prefix="/api")
app.include_router(feedback.router, prefix="/api")
app.include_router(placements.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(management.router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": "EduNexa API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "EduNexa API"}
