from sqlalchemy import Column, String, DateTime, Boolean, Enum as SQLEnum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from . import Base


class Role(str, enum.Enum):
    EXTERNAL_REQUESTER = "external_requester"
    COMPANY_ADMIN = "company_admin"
    IT_AGENT = "it_agent"
    IT_SUPERVISOR = "it_supervisor"
    SYSTEM_ADMIN = "system_admin"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)

    email = Column(String(255), nullable=False, index=True)
    username = Column(String(100), nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    full_name = Column(String(255))
    phone = Column(String(20))
    is_active = Column(Boolean, default=True, nullable=False)

    mfa_enabled = Column(Boolean, default=False, nullable=False)
    password_changed_at = Column(DateTime)
    last_login_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, company_id={self.company_id})>"
