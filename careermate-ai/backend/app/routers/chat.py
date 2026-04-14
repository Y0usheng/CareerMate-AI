from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import anthropic

from app.config import settings
from app.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.resume import Resume
from app.schemas.chat import ChatRequest, ChatResponse, MessageRole

router = APIRouter(prefix="/chat", tags=["Chat"])

SYSTEM_PROMPT = """You are CareerMate AI, a professional career coaching assistant.
Your role is to help users with:
- Resume review and improvement suggestions
- Interview preparation and mock interviews
- Career planning and goal setting
- Job search strategy
- Professional skill development

Be encouraging, specific, and actionable in your advice. Keep responses concise but thorough.
When reviewing resumes, focus on clarity, impact, and relevance to the user's target role.
"""


def _get_resume_context(user: User, db: Session) -> str:
    resume = (
        db.query(Resume)
        .filter(Resume.user_id == user.id, Resume.is_active == True)
        .order_by(Resume.created_at.desc())
        .first()
    )
    if resume and resume.extracted_text:
        return f"\n\nThe user has uploaded a resume. Content:\n{resume.extracted_text[:3000]}"
    if resume:
        return f"\n\nThe user has uploaded a resume file: {resume.filename}"
    return ""


@router.post("", response_model=ChatResponse)
def chat(
    body: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not settings.ANTHROPIC_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured. Please set ANTHROPIC_API_KEY.",
        )

    # Build system prompt with user context
    user_context = f"\n\nUser profile: {current_user.full_name}"
    if current_user.field:
        user_context += f", field: {current_user.field}"
    if current_user.career_goal:
        user_context += f", career goal: {current_user.career_goal}"
    if current_user.stage:
        user_context += f", current stage: {current_user.stage}"
    if current_user.skills:
        user_context += f", skills: {current_user.skills}"

    resume_context = _get_resume_context(current_user, db)
    system = SYSTEM_PROMPT + user_context + resume_context

    # Convert history to Anthropic message format
    messages = []
    for msg in (body.history or []):
        messages.append({
            "role": msg.role.value,
            "content": msg.text,
        })
    messages.append({"role": "user", "content": body.message})

    try:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1024,
            system=system,
            messages=messages,
        )
        reply = response.content[0].text
    except anthropic.APIError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"AI service error: {str(e)}",
        )

    return ChatResponse(reply=reply)
