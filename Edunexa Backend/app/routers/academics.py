from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.models import Mark, User
from app.schemas.schemas import MarkCreate, MarkOut, MarkUpdate

router = APIRouter(prefix="/marks", tags=["Marks"])


def calc_average(m1, m2, m3, m4):
    return round((m1 + m2 + m3 + m4) / 4, 2)


@router.get("/{student_id}", response_model=list[MarkOut])
def list_marks(
    student_id: int,
    _: User = Depends(require_roles("student", "faculty", "management")),
    db: Session = Depends(get_db),
):
    return db.query(Mark).filter(Mark.student_id == student_id).order_by(Mark.subject).all()


@router.post("", response_model=MarkOut, status_code=201)
def create_mark(
    data: MarkCreate,
    user: User = Depends(require_roles("faculty", "management")),
    db: Session = Depends(get_db),
):
    values = data.model_dump()
    values["average"] = calc_average(data.m1, data.m2, data.m3, data.m4)
    values["updated_by"] = user.id
    mark = Mark(**values)
    db.add(mark)
    db.commit()
    db.refresh(mark)
    return mark


@router.put("/{mark_id}", response_model=MarkOut)
def update_mark(
    mark_id: int,
    data: MarkUpdate,
    user: User = Depends(require_roles("faculty", "management")),
    db: Session = Depends(get_db),
):
    mark = db.get(Mark, mark_id)
    if not mark:
        raise HTTPException(404, "Mark record not found")

    for key, value in data.model_dump(exclude_none=True).items():
        setattr(mark, key, value)

    mark.average = calc_average(mark.m1, mark.m2, mark.m3, mark.m4)
    mark.updated_by = user.id

    db.commit()
    db.refresh(mark)
    return mark
