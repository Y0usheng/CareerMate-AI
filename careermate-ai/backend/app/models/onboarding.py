from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base


class OnboardingProfile(Base):
    __tablename__ = "onboarding_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    full_name = Column(String(255), nullable=True)
    role = Column(String(50), nullable=True)       # student | graduate | professional
    field = Column(String(100), nullable=True)     # software | data | design | business
    skills = Column(String(500), nullable=True)    # comma-separated list
    target_role = Column(String(255), nullable=True)
    stage = Column(String(100), nullable=True)     # exploring | preparing | applying | interviewing
    goal = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="onboarding")
