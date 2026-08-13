from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime

from database import Base


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=False)

    qr_token = Column(String, unique=True, nullable=False, index=True)

    attended = Column(Boolean, default=False)

    registered_at = Column(DateTime, default=datetime.utcnow)
    checked_in_at = Column(DateTime, nullable=True)