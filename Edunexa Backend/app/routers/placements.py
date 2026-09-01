from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import require_roles
from app.models.models import Placement, User
from app.schemas.schemas import PlacementCreate, PlacementOut

router = APIRouter(prefix="/placements", tags=["Placements"])


@router.get("", response_model=list[PlacementOut])
def list_placements(
    _: User = Depends(require_roles("student", "faculty", "management")),
    db: Session = Depends(get_db),
):
    return db.query(Placement).order_by(Placement.package_lpa.desc()).all()


@router.post("", response_model=PlacementOut, status_code=201)
def create_placement(
    data: PlacementCreate,
    _: User = Depends(require_roles("management")),
    db: Session = Depends(get_db),
):
    placement = Placement(**data.model_dump())
    db.add(placement)
    db.commit()
    db.refresh(placement)
    return placement
