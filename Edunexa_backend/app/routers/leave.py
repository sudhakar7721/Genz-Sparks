from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.models import LeaveRequest, Student, User
from app.schemas.schemas import LeaveCreate, LeaveOut, LeaveReview

router = APIRouter(prefix="/leaves", tags=["Leave"])


@router.post("", response_model=LeaveOut, status_code=201)
def apply_leave(
    data: LeaveCreate,
    user: User = Depends(require_roles("student")),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(404, "Student profile not found")
    if data.to_date < data.from_date:
        raise HTTPException(400, "To date cannot be before from date")

    leave = LeaveRequest(
        student_id=student.id,
        **data.model_dump(),
        status="Pending",
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return leave


@router.get("/my", response_model=list[LeaveOut])
def my_leaves(
    user: User = Depends(require_roles("student")),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.user_id == user.id).first()
    return db.query(LeaveRequest).filter(LeaveRequest.student_id == student.id).all()


@router.get("/pending", response_model=list[LeaveOut])
def pending_leaves(
    _: User = Depends(require_roles("faculty", "management")),
    db: Session = Depends(get_db),
):
    return db.query(LeaveRequest).filter(LeaveRequest.status == "Pending").all()


@router.put("/{leave_id}/review", response_model=LeaveOut)
def review_leave(
    leave_id: int,
    data: LeaveReview,
    user: User = Depends(require_roles("faculty", "management")),
    db: Session = Depends(get_db),
):
    if data.status not in {"Approved", "Rejected", "Pending"}:
        raise HTTPException(400, "Status must be Approved, Rejected or Pending")

    leave = db.get(LeaveRequest, leave_id)
    if not leave:
        raise HTTPException(404, "Leave request not found")

    leave.status = data.status
    leave.reviewed_by = user.id
    leave.reviewer_comment = data.reviewer_comment
    db.commit()
    db.refresh(leave)
    return leave
