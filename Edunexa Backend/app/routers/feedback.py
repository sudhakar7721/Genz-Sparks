from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.models import Feedback, Student, User
from app.schemas.schemas import FeedbackCreate, FeedbackOut, FeedbackResponse

router = APIRouter(prefix="/feedback", tags=["Feedback"])


@router.post("", response_model=FeedbackOut, status_code=201)
def submit_feedback(
    data: FeedbackCreate,
    user: User = Depends(require_roles("student")),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.user_id == user.id).first()
    if not student:
        raise HTTPException(404, "Student profile not found")

    feedback = Feedback(student_id=student.id, **data.model_dump())
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


@router.get("/my", response_model=list[FeedbackOut])
def my_feedback(
    user: User = Depends(require_roles("student")),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.user_id == user.id).first()
    return db.query(Feedback).filter(Feedback.student_id == student.id).all()


@router.get("", response_model=list[FeedbackOut])
def list_feedback(
    _: User = Depends(require_roles("faculty", "management")),
    db: Session = Depends(get_db),
):
    return db.query(Feedback).order_by(Feedback.created_at.desc()).all()


@router.put("/{feedback_id}/respond", response_model=FeedbackOut)
def respond_feedback(
    feedback_id: int,
    data: FeedbackResponse,
    _: User = Depends(require_roles("faculty", "management")),
    db: Session = Depends(get_db),
):
    feedback = db.get(Feedback, feedback_id)
    if not feedback:
        raise HTTPException(404, "Feedback not found")
    feedback.response = data.response
    feedback.status = "Responded"
    db.commit()
    db.refresh(feedback)
    return feedback


@router.get("/stats/summary")
def feedback_stats(
    _: User = Depends(require_roles("faculty", "management")),
    db: Session = Depends(get_db),
):
    count = db.query(func.count(Feedback.id)).scalar() or 0
    avg = db.query(func.avg(Feedback.rating)).scalar() or 0
    return {"total": count, "average_rating": round(float(avg), 2)}
