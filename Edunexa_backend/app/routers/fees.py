from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.models import Fee, Student, User
from app.schemas.schemas import FeeCreate, FeeOut

router = APIRouter(prefix="/fees", tags=["Fees"])


@router.get("/student/{student_id}", response_model=list[FeeOut])
def student_fees(
    student_id: int,
    _: User = Depends(require_roles("student", "faculty", "management")),
    db: Session = Depends(get_db),
):
    return db.query(Fee).filter(Fee.student_id == student_id).all()


@router.post("", response_model=FeeOut, status_code=201)
def create_fee(
    data: FeeCreate,
    _: User = Depends(require_roles("management")),
    db: Session = Depends(get_db),
):
    if not db.get(Student, data.student_id):
        raise HTTPException(404, "Student not found")

    fee = Fee(**data.model_dump())
    db.add(fee)
    db.commit()
    db.refresh(fee)
    return fee


@router.put("/{fee_id}", response_model=FeeOut)
def update_fee(
    fee_id: int,
    data: FeeCreate,
    _: User = Depends(require_roles("management")),
    db: Session = Depends(get_db),
):
    fee = db.get(Fee, fee_id)
    if not fee:
        raise HTTPException(404, "Fee record not found")

    for key, value in data.model_dump().items():
        setattr(fee, key, value)

    db.commit()
    db.refresh(fee)
    return fee
