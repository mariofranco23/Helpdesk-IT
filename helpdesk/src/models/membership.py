from sqlalchemy import Column, String, DateTime, Boolean, JSON, Enum as SQLEnum, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from . import Base
from .user import Role


class Membership(Base):
    __tablename__ = "memberships"
    __table_args__ = (
        UniqueConstraint('user_id', 'company_id', name='uq_user_company_membership'),
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False, index=True)

    role = Column(SQLEnum(Role), nullable=False)
    explicit_permissions = Column(JSON, default=[])

    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Membership(user_id={self.user_id}, company_id={self.company_id}, role={self.role})>"
