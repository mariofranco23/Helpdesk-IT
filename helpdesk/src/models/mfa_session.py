from sqlalchemy import Column, String, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, timedelta
import uuid

from . import Base


class MFASession(Base):
    __tablename__ = "mfa_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    encrypted_secret = Column(String(500), nullable=False)
    recovery_codes = Column(JSON, default=[])

    verified_at = Column(DateTime)

    enrollment_started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    enrollment_expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(hours=1))

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<MFASession(user_id={self.user_id}, verified={self.verified_at is not None})>"
