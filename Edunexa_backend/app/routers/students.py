from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.models import Student, User
from app.schemas.schemas import StudentOut

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/me", response_model=StudentOut)
def my_student_profile(
    user: User = Depends(require_roles("student")),
    db: Session = Depends(get_db),
):
    student = (
        db.query(Student)
        .options(joinedload(Student.user), joinedload(Student.department))
        .filter(Student.user_id == user.id)
        .first()
    )
    if not student:
        raise HTTPException(404, "Student profile not found")
    return student


@router.get("", response_model=list[StudentOut])
def list_students(
    _: User = Depends(require_roles("faculty", "management")),
    db: Session = Depends(get_db),
):
    return (
        db.query(Student)
        .options(joinedload(Student.user), joinedload(Student.department))
        .order_by(Student.id)
        .all()
    )


@router.get("/{student_id}", response_model=StudentOut)
def get_student(
    student_id: int,
    _: User = Depends(require_roles("faculty", "management")),
    db: Session = Depends(get_db),
):
    student = (
        db.query(Student)
        .options(joinedload(Student.user), joinedload(Student.department))
        .filter(Student.id == student_id)
        .first()
    )
    if not student:
        raise HTTPException(404, "Student not found")
    return student
