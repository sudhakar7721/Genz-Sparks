from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

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
