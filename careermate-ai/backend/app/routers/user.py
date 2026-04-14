from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_user
from app.core.security import verify_password, hash_password
from app.models.user import User
from app.schemas.user import (
    UserProfileResponse,
    UpdateBasicInfoRequest,
    UpdateCareerRequest,
    ChangePasswordRequest,
)
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/user", tags=["User"])


@router.get("/profile", response_model=UserProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserProfileResponse)
def update_basic_info(
    body: UpdateBasicInfoRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Check email uniqueness if changed
    if body.email != current_user.email:
        existing = db.query(User).filter(User.email == body.email, User.id != current_user.id).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already in use")
        current_user.email = body.email

    current_user.full_name = body.full_name
    if body.field is not None:
        current_user.field = body.field

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/career", response_model=UserProfileResponse)
def update_career(
    body: UpdateCareerRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.career_goal is not None:
        current_user.career_goal = body.career_goal
    if body.stage is not None:
        current_user.stage = body.stage
    if body.skills is not None:
        current_user.skills = body.skills

    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/password", response_model=MessageResponse)
def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )
    if body.new_password != body.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match",
        )
    if len(body.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 8 characters",
        )
    current_user.hashed_password = hash_password(body.new_password)
    db.commit()
    return MessageResponse(message="Password updated successfully")
