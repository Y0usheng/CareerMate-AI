from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    filename = Column(String(255), nullable=False)
    stored_filename = Column(String(255), nullable=False)  # UUID-based filename on disk
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)             # bytes
    content_type = Column(String(100), nullable=True)
    extracted_text = Column(Text, nullable=True)           # parsed text content

    is_active = Column(Boolean, default=True)              # most recent active resume

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="resumes")
