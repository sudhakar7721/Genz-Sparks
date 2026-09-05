from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.models import Attendance, Student, User
from app.schemas.schemas import AttendanceCreate, AttendanceOut

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.get("/{student_id}", response_model=list[AttendanceOut])
def list_attendance(
    student_id: int,
    _: User = Depends(require_roles("student", "faculty", "management")),
    db: Session = Depends(get_db),
):
    return db.query(Attendance).filter(
        Attendance.student_id == student_id
    ).order_by(Attendance.date.desc()).all()


@router.post("", response_model=AttendanceOut, status_code=201)
def add_attendance(
    data: AttendanceCreate,
    _: User = Depends(require_roles("faculty", "management")),
    db: Session = Depends(get_db),
):
    student = db.get(Student, data.student_id)
    if not student:
        raise HTTPException(404, "Student not found")

    record = Attendance(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)

    # Recalculate simple overall attendance.
    records = db.query(Attendance).filter(Attendance.student_id == student.id).all()
    if records:
        present = sum(1 for x in records if x.status.lower() == "present")
        student.attendance = round((present / len(records)) * 100, 2)
        db.commit()

    return record
