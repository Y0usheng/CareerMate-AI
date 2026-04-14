from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class UserProfileResponse(BaseModel):
    id: int
    full_name: str
    email: str
    field: Optional[str] = None
    career_goal: Optional[str] = None
    stage: Optional[str] = None
    skills: Optional[str] = None
    onboarding_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UpdateBasicInfoRequest(BaseModel):
    full_name: str
    email: EmailStr
    field: Optional[str] = None


class UpdateCareerRequest(BaseModel):
    career_goal: Optional[str] = None
    stage: Optional[str] = None
    skills: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    def model_post_init(self, __context) -> None:
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match")
        if len(self.new_password) < 8:
            raise ValueError("New password must be at least 8 characters")
