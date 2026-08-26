from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.security import allow_leadership, get_current_user
from app.schemas.audit import AuditLogOut, AuditLogCreate
from app.models.audit import AuditLog
from app.models.user import User
from app.services.audit import AuditService

router = APIRouter(prefix="/audit", tags=["Audit System"])

@router.get("", response_model=List[AuditLogOut])
def read_audit_logs(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_leadership)
):
    """
    Retrieve all security audit logs.
    Access restricted to Admin & Leadership roles.
    This retrieval action is itself audited.
    """
    client_ip = request.client.host if request.client else None
    
    # Log the audit access event first
    AuditService.log(
        db=db,
        action="VIEW_AUDIT_LOGS",
        resource_type="AUDIT",
        user_id=current_user.id,
        username=current_user.username,
        ip_address=client_ip
    )
    
    # Query logs from database (will include the VIEW_AUDIT_LOGS log just written)
    logs = db.query(AuditLog).order_by(AuditLog.id.desc()).all()
    
    return logs


@router.post("", response_model=AuditLogOut)
def create_audit_log(
    log_in: AuditLogCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Log a custom client-side event.
    """
    client_ip = request.client.host if request.client else None
    
    return AuditService.log(
        db=db,
        action=log_in.action,
        resource_type=log_in.resource_type,
        resource_id=log_in.resource_id,
        user_id=current_user.id,
        username=current_user.username,
        details=log_in.details,
        ip_address=client_ip
    )

