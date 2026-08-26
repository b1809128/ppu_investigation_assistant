from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from app.db.base import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("investigators.id", ondelete="SET NULL"), nullable=True)
    username = Column(String(50), nullable=True)
    action = Column(String(50), nullable=False)  # E.g., LOGIN, CREATE_CASE, READ_CASE, UPDATE_CASE, DELETE_CASE, LIST_CASES
    resource_type = Column(String(50), nullable=False)  # E.g., USER, CASE_FILE, SUSPECT, LEGAL
    resource_id = Column(Integer, nullable=True)
    details = Column(Text, nullable=True)  # JSON-formatted string or text context
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
