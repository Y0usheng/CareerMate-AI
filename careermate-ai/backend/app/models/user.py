from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # Career settings
    field = Column(String(100), nullable=True)
    career_goal = Column(String(255), nullable=True)
    stage = Column(String(100), nullable=True)
    skills = Column(String(500), nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    onboarding_completed = Column(Boolean, default=False)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    onboarding = relationship("OnboardingProfile", back_populates="user", uselist=False)
    resumes = relationship("Resume", back_populates="user")
