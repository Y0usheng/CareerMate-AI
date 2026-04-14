from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional


class ContactRequest(BaseModel):
    fullname: str
    email: EmailStr
    role: Optional[str] = None    # student | graduate | professional
    field: Optional[str] = None   # software | data | design
    message: str

    @field_validator("fullname")
    @classmethod
    def fullname_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()

    @field_validator("message")
    @classmethod
    def message_min_length(cls, v: str) -> str:
        if len(v.strip()) < 20:
            raise ValueError("Message must be at least 20 characters")
        return v.strip()
