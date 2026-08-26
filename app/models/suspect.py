from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship, synonym
from app.db.base import Base

class Suspect(Base):
    """
    Model representing a suspect, witness, or victim associated with a case file.
    Mapped to 'suspects' table.
    Retains synonym mappings for backwards compatibility.
    """
    __tablename__ = "suspects"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("case_files.id", ondelete="CASCADE"), nullable=False)
    full_name = Column(String(100), nullable=False)
    dob = Column(String(20), nullable=True)  # Format: YYYY-MM-DD or simple string
    identity_card = Column(String(20), nullable=True)  # CMND / CCCD
    prior_convictions = Column(Text, nullable=True)  # Replaces 'address' for criminal record
    role_in_case = Column(String(20), default="SUSPECT", nullable=False)  # SUSPECT, WITNESS, VICTIM, OTHER
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Synonyms for backwards compatibility
    case_file_id = synonym("case_id")
    date_of_birth = synonym("dob")
    address = synonym("prior_convictions")  # Map address to prior_convictions for compatibility

    # Relationships
    case_file = relationship("CaseFile", back_populates="suspects")
