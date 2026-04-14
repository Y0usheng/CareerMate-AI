from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.onboarding import OnboardingProfile
from app.schemas.onboarding import OnboardingRequest, OnboardingResponse

router = APIRouter(prefix="/onboarding", tags=["Onboarding"])


@router.post("", response_model=OnboardingResponse, status_code=status.HTTP_201_CREATED)
def save_onboarding(
    body: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skills_str = ",".join(body.skills)

    existing = db.query(OnboardingProfile).filter(OnboardingProfile.user_id == current_user.id).first()
    if existing:
        existing.full_name = body.full_name
        existing.role = body.role
        existing.field = body.field
        existing.skills = skills_str
        existing.target_role = body.target_role
        existing.stage = body.stage
        existing.goal = body.goal
        db.commit()
        db.refresh(existing)
        profile = existing
    else:
        profile = OnboardingProfile(
            user_id=current_user.id,
            full_name=body.full_name,
            role=body.role,
            field=body.field,
            skills=skills_str,
            target_role=body.target_role,
            stage=body.stage,
            goal=body.goal,
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # Sync relevant fields to User and mark onboarding complete
    current_user.full_name = body.full_name
    current_user.field = body.field
    current_user.career_goal = body.target_role
    current_user.stage = body.stage
    current_user.skills = skills_str
    current_user.onboarding_completed = True
    db.commit()

    return OnboardingResponse.from_orm_with_skills(profile)


@router.get("", response_model=OnboardingResponse)
def get_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(OnboardingProfile).filter(OnboardingProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Onboarding not found")
    return OnboardingResponse.from_orm_with_skills(profile)
