from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit import AuditLog
import json
from typing import Optional, Any, Union

class AuditService:
    @staticmethod
    def log(
        db: Session,
        action: str,
        resource_type: str,
        resource_id: Optional[int] = None,
        user_id: Optional[int] = None,
        username: Optional[str] = None,
        details: Optional[Any] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """
        Record a system activity inside audit_logs using a synchronous database session.
        Converts detailed context to a serialized JSON string.
        """
        details_str = None
        if details is not None:
            try:
                details_str = json.dumps(details, ensure_ascii=False)
            except Exception:
                details_str = str(details)

        db_log = AuditLog(
            user_id=user_id,
            username=username,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details_str,
            ip_address=ip_address
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log

    @staticmethod
    async def async_log(
        db: AsyncSession,
        action: str,
        resource_type: str,
        resource_id: Optional[int] = None,
        user_id: Optional[int] = None,
        username: Optional[str] = None,
        details: Optional[Any] = None,
        ip_address: Optional[str] = None
    ) -> AuditLog:
        """
        Record a system activity inside audit_logs using an asynchronous database session.
        Converts detailed context to a serialized JSON string.
        """
        details_str = None
        if details is not None:
            try:
                details_str = json.dumps(details, ensure_ascii=False)
            except Exception:
                details_str = str(details)

        db_log = AuditLog(
            user_id=user_id,
            username=username,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details_str,
            ip_address=ip_address
        )
        db.add(db_log)
        await db.commit()
        await db.refresh(db_log)
        return db_log
