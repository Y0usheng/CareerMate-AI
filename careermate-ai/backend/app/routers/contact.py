from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.contact import ContactMessage
from app.schemas.contact import ContactRequest
from app.schemas.auth import MessageResponse

router = APIRouter(prefix="/contact", tags=["Contact"])


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def submit_contact(body: ContactRequest, db: Session = Depends(get_db)):
    message = ContactMessage(
        fullname=body.fullname,
        email=body.email,
        role=body.role,
        field=body.field,
        message=body.message,
    )
    db.add(message)
    db.commit()
    return MessageResponse(message="Your message has been received. We'll be in touch soon!")
