from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from . import Base


class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)

    token_hash = Column(String(255), unique=True, nullable=False, index=True)

    user_agent = Column(String(512))
    ip_address = Column(String(45))

    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_activity_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at

    def __repr__(self):
        return f"<Session(user_id={self.user_id}, company_id={self.company_id}, expires={self.expires_at})>"
