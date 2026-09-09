from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.models import (
    Assignment, Department, Faculty, Feedback, Placement, Student, Test, User
)

router = APIRouter(prefix="/management", tags=["Management"])


@router.get("/dashboard")
def dashboard(
    _: User = Depends(require_roles("management")),
    db: Session = Depends(get_db),
):
    return {
        "departments": db.query(func.count(Department.id)).scalar() or 0,
        "faculty": db.query(func.count(Faculty.id)).scalar() or 0,
        "students": db.query(func.count(Student.id)).scalar() or 0,
        "companies": db.query(func.count(func.distinct(Placement.company_name))).scalar() or 0,
        "tests": db.query(func.count(Test.id)).scalar() or 0,
        "assignments": db.query(func.count(Assignment.id)).scalar() or 0,
        "feedback": db.query(func.count(Feedback.id)).scalar() or 0,
    }


@router.get("/departments", response_model=list[dict])
def departments(
    _: User = Depends(require_roles("management")),
    db: Session = Depends(get_db),
):
    departments = db.query(Department).order_by(Department.name).all()
    result = []
    for d in departments:
        students = db.query(Student).filter(Student.department_id == d.id).count()
        result.append({
            "id": d.id,
            "name": d.name,
            "code": d.code,
            "students": students,
            "description": d.description,
        })
    return result
