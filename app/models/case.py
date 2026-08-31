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
    investigation_stage = Column(String(50), default="XAC_MINH", nullable=False)  # TIN_BAO, XAC_MINH, KHOI_TO_VU_AN, KHOI_TO_BI_CAN, KET_LUAN
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
    documents = relationship("CaseDocument", back_populates="case_file", cascade="all, delete-orphan")
    investigation_logs = relationship("InvestigationLog", back_populates="case_file", cascade="all, delete-orphan")

class CaseDocument(Base):
    """
    Model representing procedural investigation documents added to a case file.
    Mapped to 'case_documents' table.
    """
    __tablename__ = "case_documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("case_files.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    document_type = Column(String(100), nullable=False) # e.g. "Quyết định khởi tố vụ án hình sự"
    file_path = Column(String(505), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    case_file = relationship("CaseFile", back_populates="documents")

class InvestigationLog(Base):
    """
    Model representing logs of the investigation process (timeline events).
    Mapped to 'investigation_logs' table.
    """
    __tablename__ = "investigation_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("case_files.id", ondelete="CASCADE"), nullable=False)
    log_date = Column(DateTime, server_default=func.now(), nullable=False)
    title = Column(String(255), nullable=False)  # e.g., "Lấy lời khai bị can Nguyễn Văn A", "Khám nghiệm hiện trường"
    details = Column(Text, nullable=True)        # Chi tiết sự kiện xảy ra
    investigator_id = Column(Integer, ForeignKey("investigators.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    case_file = relationship("CaseFile", back_populates="investigation_logs")
    investigator = relationship("User", foreign_keys=[investigator_id])

class CaseAnalysis(Base):
    """
    Model representing deep learning and procedural analysis results for a case file.
    Mapped to 'case_analyses' table.
    """
    __tablename__ = "case_analyses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    case_id = Column(Integer, ForeignKey("case_files.id", ondelete="CASCADE"), nullable=False)
    summary_acts = Column(Text, nullable=False)
    extracted_entities = Column(Text, nullable=True)  # JSON-serialized string
    suggested_charge = Column(Text, nullable=True)    # JSON-serialized string
    procedural_warnings = Column(Text, nullable=True) # JSON-serialized string
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    case_file = relationship("CaseFile")
