from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.models import Faculty, User
from app.schemas.schemas import FacultyOut

router = APIRouter(prefix="/faculty", tags=["Faculty"])


@router.get("/me", response_model=FacultyOut)
def my_profile(
    user: User = Depends(require_roles("faculty")),
    db: Session = Depends(get_db),
):
    faculty = (
        db.query(Faculty)
        .options(joinedload(Faculty.user))
        .filter(Faculty.user_id == user.id)
        .first()
    )
    if not faculty:
        raise HTTPException(404, "Faculty profile not found")
    return faculty


@router.get("", response_model=list[FacultyOut])
def list_faculty(
    _: User = Depends(require_roles("management")),
    db: Session = Depends(get_db),
):
    return db.query(Faculty).options(joinedload(Faculty.user)).order_by(Faculty.id).all()


@router.get("/mentors", response_model=list[FacultyOut])
def mentors(
    _: User = Depends(require_roles("faculty", "management")),
    db: Session = Depends(get_db),
):
    return (
        db.query(Faculty)
        .options(joinedload(Faculty.user))
        .filter(Faculty.mentor.is_(True))
        .all()
    )


@router.get("/advisers", response_model=list[FacultyOut])
def advisers(
    _: User = Depends(require_roles("faculty", "management")),
    db: Session = Depends(get_db),
):
    return (
        db.query(Faculty)
        .options(joinedload(Faculty.user))
        .filter(Faculty.class_adviser.is_(True))
        .all()
    )
