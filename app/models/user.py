from sqlalchemy import Column, Integer, String, Boolean, DateTime, func
from sqlalchemy.orm import synonym
from app.db.base import Base

class User(Base):
    """
    Model representing an Investigator in the system.
    Mapped to the 'investigators' table.
    Retains the class name 'User' and supports synonym mappings for backwards compatibility.
    """
    __tablename__ = "investigators"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    badge_id = Column(String(50), unique=True, index=True, nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(20), default="INVESTIGATOR", nullable=False)  # ADMIN, LEADERSHIP, INVESTIGATOR
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Synonyms for backwards compatibility
    username = synonym("badge_id")
    hashed_password = synonym("password_hash")
