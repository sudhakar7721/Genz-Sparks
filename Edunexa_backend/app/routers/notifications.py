from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.models import Notification, Student, User
from app.schemas.schemas import NotificationCreate, NotificationOut

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/my", response_model=list[NotificationOut])
def my_notifications(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.user_id == user.id).first()
    q = db.query(Notification)

    if student:
        q = q.filter(
            (Notification.student_id == student.id)
            | (Notification.recipient_role == user.role)
            | (Notification.recipient_role == "all")
        )
    else:
        q = q.filter(
            (Notification.recipient_role == user.role)
            | (Notification.recipient_role == "all")
        )

    return q.order_by(Notification.created_at.desc()).all()


@router.post("", response_model=NotificationOut, status_code=201)
def create_notification(
    data: NotificationCreate,
    _: User = Depends(require_roles("faculty", "management")),
    db: Session = Depends(get_db),
):
    notification = Notification(**data.model_dump())
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


@router.put("/{notification_id}/read", response_model=NotificationOut)
def mark_read(
    notification_id: int,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    notification = db.get(Notification, notification_id)
    if not notification:
        raise HTTPException(404, "Notification not found")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification
