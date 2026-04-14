from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime


class OnboardingRequest(BaseModel):
    full_name: str
    role: str        # student | graduate | professional
    field: str       # software | data | design | business
    skills: List[str]
    target_role: str
    stage: str       # exploring | preparing | applying | interviewing
    goal: str

    @field_validator("skills")
    @classmethod
    def skills_not_empty(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("At least one skill must be selected")
        return v

    @field_validator("full_name", "role", "field", "target_role", "stage", "goal")
    @classmethod
    def not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("This field cannot be empty")
        return v.strip()


class OnboardingResponse(BaseModel):
    id: int
    user_id: int
    full_name: Optional[str]
    role: Optional[str]
    field: Optional[str]
    skills: Optional[List[str]]
    target_role: Optional[str]
    stage: Optional[str]
    goal: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

    @classmethod
    def from_orm_with_skills(cls, obj):
        data = {
            "id": obj.id,
            "user_id": obj.user_id,
            "full_name": obj.full_name,
            "role": obj.role,
            "field": obj.field,
            "skills": obj.skills.split(",") if obj.skills else [],
            "target_role": obj.target_role,
            "stage": obj.stage,
            "goal": obj.goal,
            "created_at": obj.created_at,
        }
        return cls(**data)
