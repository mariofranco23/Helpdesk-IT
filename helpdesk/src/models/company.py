from sqlalchemy import Column, String, DateTime, Boolean, JSON, Enum as SQLEnum, func
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from . import Base


class CompanyStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    INACTIVE = "inactive"


class Company(Base):
    __tablename__ = "companies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cuit = Column(String(15), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    address = Column(String(512))
    phone = Column(String(20))
    email = Column(String(255))
    status = Column(SQLEnum(CompanyStatus), default=CompanyStatus.ACTIVE, nullable=False)

    contract_metadata = Column(JSON, default={})

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Company(id={self.id}, cuit={self.cuit}, name={self.name})>"
