from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import secrets
import qrcode
import io
import base64

from database import engine, Base, get_db
import models


app = FastAPI(title="QR Event Check-in API")

Base.metadata.create_all(bind=engine)


# Allow Next.js frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://qr-based-event-check-in-system-mu.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Request schema
# -----------------------------

class ParticipantCreate(BaseModel):
    name: str
    email: str
    phone: str


# -----------------------------
# Helper: Generate QR code
# -----------------------------

def generate_qr_code(token: str) -> str:
    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=4
    )

    qr.add_data(token)
    qr.make(fit=True)

    image = qr.make_image(fill_color="black", back_color="white")

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")

    encoded_image = base64.b64encode(
        buffer.getvalue()
    ).decode("utf-8")

    return f"data:image/png;base64,{encoded_image}"


# -----------------------------
# Basic routes
# -----------------------------

@app.get("/")
def root():
    return {"message": "QR Event Check-in API is running"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy"}


# -----------------------------
# Participant registration
# -----------------------------

@app.post("/api/participants")
def register_participant(
    participant: ParticipantCreate,
    db: Session = Depends(get_db)
):
    # Check whether email already exists
    existing_participant = (
        db.query(models.Participant)
        .filter(models.Participant.email == participant.email)
        .first()
    )

    if existing_participant:
        raise HTTPException(
            status_code=400,
            detail="A participant with this email is already registered."
        )

    # Generate a cryptographically random unique token
    token = secrets.token_urlsafe(32)

    # Create participant
    new_participant = models.Participant(
        name=participant.name,
        email=participant.email,
        phone=participant.phone,
        qr_token=token,
        attended=False,
        registered_at=datetime.utcnow()
    )

    db.add(new_participant)
    db.commit()
    db.refresh(new_participant)

    # Generate QR code
    qr_code = generate_qr_code(token)

    return {
        "message": "Participant registered successfully",
        "participant": {
            "id": new_participant.id,
            "name": new_participant.name,
            "email": new_participant.email,
            "phone": new_participant.phone,
            "registered_at": new_participant.registered_at
        },
        "qr_token": token,
        "qr_code": qr_code
    }
    # -----------------------------
# QR Check-in
# -----------------------------

class CheckInRequest(BaseModel):
    qr_token: str


@app.post("/api/checkin")
def check_in_participant(
    checkin: CheckInRequest,
    db: Session = Depends(get_db)
):
    # Find participant using QR token
    participant = (
        db.query(models.Participant)
        .filter(models.Participant.qr_token == checkin.qr_token)
        .first()
    )

    # Invalid QR code
    if not participant:
        raise HTTPException(
            status_code=404,
            detail="Invalid QR code."
        )

    # Prevent duplicate check-in
    if participant.attended:
        raise HTTPException(
            status_code=400,
            detail="Participant has already checked in."
        )

    # Mark participant as attended
    participant.attended = True
    participant.checked_in_at = datetime.utcnow()

    db.commit()
    db.refresh(participant)

    return {
        "message": "Check-in successful",
        "participant": {
            "id": participant.id,
            "name": participant.name,
            "email": participant.email,
            "phone": participant.phone,
            "attended": participant.attended,
            "checked_in_at": participant.checked_in_at
        }
    }
@app.get("/api/dashboard")
def get_dashboard(db: Session = Depends(get_db)):
    total_participants = db.query(models.Participant).count()

    attended = (
        db.query(models.Participant)
        .filter(models.Participant.attended == True)
        .count()
    )

    not_attended = total_participants - attended

    attendance_percentage = (
        round((attended / total_participants) * 100, 1)
        if total_participants > 0
        else 0
    )

    return {
        "total_participants": total_participants,
        "attended": attended,
        "not_attended": not_attended,
        "attendance_percentage": attendance_percentage
    }


@app.get("/api/attendance")
def get_attendance(db: Session = Depends(get_db)):
    participants = (
        db.query(models.Participant)
        .order_by(models.Participant.registered_at.desc())
        .all()
    )

    return [
        {
            "id": participant.id,
            "name": participant.name,
            "email": participant.email,
            "phone": participant.phone,
            "attended": participant.attended,
            "registered_at": participant.registered_at,
            "checked_in_at": participant.checked_in_at
        }
        for participant in participants
    ]
@app.get("/api/participants/{participant_id}/qr")
def get_participant_qr(
    participant_id: int,
    db: Session = Depends(get_db)
):
    participant = (
        db.query(models.Participant)
        .filter(models.Participant.id == participant_id)
        .first()
    )

    if not participant:
        raise HTTPException(
            status_code=404,
            detail="Participant not found."
        )

    return {
        "participant": {
            "id": participant.id,
            "name": participant.name,
            "email": participant.email
        },
        "qr_code": generate_qr_code(participant.qr_token)
    }