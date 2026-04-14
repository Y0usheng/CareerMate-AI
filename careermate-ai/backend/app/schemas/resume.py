from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ResumeResponse(BaseModel):
    id: int
    filename: str
    file_size: Optional[int]
    content_type: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
