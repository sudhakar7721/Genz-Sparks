from fastapi import APIRouter, Depends
from app.core.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import UserOut

router = APIRouter(tags=["Users"])


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user
