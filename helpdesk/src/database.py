"""Configuración de base de datos - SQLAlchemy"""

import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool

# URL de BD desde variable de entorno
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://helpdesk:helpdesk_password@localhost:5432/helpdesk_db"
)

# Engine con pooling
engine = create_engine(
    DATABASE_URL,
    echo=os.getenv("DEBUG", "false").lower() == "true",
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
    pool_recycle=3600,
)

# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db() -> Generator[Session, None, None]:
    """Dependencia de FastAPI para obtener sesión de BD"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Crea todas las tablas (usar en desarrollo)"""
    from src.models import Base
    Base.metadata.create_all(bind=engine)


def drop_db():
    """Elimina todas las tablas (peligroso - solo para desarrollo/testing)"""
    from src.models import Base
    Base.metadata.drop_all(bind=engine)
