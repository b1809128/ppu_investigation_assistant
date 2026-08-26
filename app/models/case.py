from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func, Double
from sqlalchemy.orm import relationship, synonym
from app.db.base import Base

class CaseFile(Base):
    """
    Model representing a Case File.
    Mapped to 'case_files' table.
    Retains synonym mappings for backwards compatibility (e.g. case_number -> case_code).
    """
    __tablename__ = "case_files"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_code = Column(String(50), unique=True, index=True, nullable=False)
    case_name = Column(String(255), nullable=False)
    incident_date = Column(DateTime, nullable=True)
    location = Column(String(255), nullable=True)
    summary_acts = Column(Text, nullable=True)
    damage_value = Column(Double, nullable=True)
    status = Column(String(20), default="INVESTIGATING", nullable=False)  # INVESTIGATING, SUSPENDED, CLOSED
    lead_investigator_id = Column(Integer, ForeignKey("investigators.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    # Synonyms for backwards compatibility
    case_number = synonym("case_code")
    title = synonym("case_name")
    description = synonym("summary_acts")
    created_by_id = synonym("lead_investigator_id")

    # Relationships
    lead_investigator = relationship("User", foreign_keys=[lead_investigator_id])
    created_by = relationship("User", foreign_keys=[lead_investigator_id], overlaps="lead_investigator")
    suspects = relationship("Suspect", back_populates="case_file", cascade="all, delete-orphan")
