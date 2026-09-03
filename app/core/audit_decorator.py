import functools
import asyncio
from fastapi import Request
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.audit import AuditService
from app.models.user import User

def audit_log(action: str, resource_type: str):
    """
    FastAPI Route decorator to automatically record system activity inside audit_logs.
    Supports both synchronous and asynchronous route handlers, with Session or AsyncSession.
    
    Expects the decorated function to receive:
    - db (SQLAlchemy Session or AsyncSession)
    - current_user / current_investigator (User model instance)
    - request (FastAPI Request to extract client IP)
    
    Success logs will capture the returned resource's ID (if any).
    Failure logs will capture the error string and save it under action as {action}_FAILED.
    """
    def decorator(func):
        # 1. Helper to find arguments by type/name
        def find_db(args, kwargs):
            for val in kwargs.values():
                if isinstance(val, (Session, AsyncSession)):
                    return val
            for arg in args:
                if isinstance(arg, (Session, AsyncSession)):
                    return arg
            return None

        def find_request(args, kwargs):
            for val in kwargs.values():
                if isinstance(val, Request):
                    return val
            for arg in args:
                if isinstance(arg, Request):
                    return arg
            return None

        def find_user(args, kwargs):
            for val in kwargs.values():
                if isinstance(val, User):
                    return val
            for arg in args:
                if isinstance(arg, User):
                    return arg
            for name in ["current_user", "current_investigator", "user"]:
                if name in kwargs:
                    return kwargs[name]
            return None

        # 2. Asynchronous Route Handler Wrapper
        if asyncio.iscoroutinefunction(func):
            @functools.wraps(func)
            async def async_wrapper(*args, **kwargs):
                db = find_db(args, kwargs)
                request = find_request(args, kwargs)
                current_user = find_user(args, kwargs)
                
                client_ip = request.client.host if request and request.client else None
                username = current_user.badge_id if current_user and hasattr(current_user, "badge_id") else (current_user.username if current_user else None)
                user_id = current_user.id if current_user else None

                if db is None:
                    return await func(*args, **kwargs)

                try:
                    result = await func(*args, **kwargs)
                    
                    resource_id = None
                    details_dict = {}

                    if isinstance(result, list):
                        details_dict = {"count": len(result)}
                    elif result:
                        if hasattr(result, "id"):
                            resource_id = getattr(result, "id")
                        elif isinstance(result, dict) and "id" in result:
                            resource_id = result["id"]

                        for attr in ["case_code", "case_number", "case_name", "title", "full_name"]:
                            if hasattr(result, attr):
                                details_dict[attr] = getattr(result, attr)
                            elif isinstance(result, dict) and attr in result:
                                details_dict[attr] = result[attr]

                    if isinstance(db, AsyncSession):
                        await AuditService.async_log(
                            db=db,
                            action=action,
                            resource_type=resource_type,
                            resource_id=resource_id,
                            user_id=user_id,
                            username=username,
                            details=details_dict if details_dict else None,
                            ip_address=client_ip
                        )
                    else:
                        AuditService.log(
                            db=db,
                            action=action,
                            resource_type=resource_type,
                            resource_id=resource_id,
                            user_id=user_id,
                            username=username,
                            details=details_dict if details_dict else None,
                            ip_address=client_ip
                        )
                    return result
                except Exception as e:
                    if isinstance(db, AsyncSession):
                        await AuditService.async_log(
                            db=db,
                            action=f"{action}_FAILED",
                            resource_type=resource_type,
                            user_id=user_id,
                            username=username,
                            details={"error": str(e)},
                            ip_address=client_ip
                        )
                    else:
                        AuditService.log(
                            db=db,
                            action=f"{action}_FAILED",
                            resource_type=resource_type,
                            user_id=user_id,
                            username=username,
                            details={"error": str(e)},
                            ip_address=client_ip
                        )
                    raise e
            return async_wrapper
        
        # 3. Synchronous Route Handler Wrapper
        else:
            @functools.wraps(func)
            def sync_wrapper(*args, **kwargs):
                db = find_db(args, kwargs)
                request = find_request(args, kwargs)
                current_user = find_user(args, kwargs)
                
                client_ip = request.client.host if request and request.client else None
                username = current_user.badge_id if current_user and hasattr(current_user, "badge_id") else (current_user.username if current_user else None)
                user_id = current_user.id if current_user else None

                if db is None:
                    return func(*args, **kwargs)

                try:
                    result = func(*args, **kwargs)
                    
                    resource_id = None
                    details_dict = {}

                    if isinstance(result, list):
                        details_dict = {"count": len(result)}
                    elif result:
                        if hasattr(result, "id"):
                            resource_id = getattr(result, "id")
                        elif isinstance(result, dict) and "id" in result:
                            resource_id = result["id"]

                        for attr in ["case_code", "case_number", "case_name", "title", "full_name"]:
                            if hasattr(result, attr):
                                details_dict[attr] = getattr(result, attr)
                            elif isinstance(result, dict) and attr in result:
                                details_dict[attr] = result[attr]

                    AuditService.log(
                        db=db,
                        action=action,
                        resource_type=resource_type,
                        resource_id=resource_id,
                        user_id=user_id,
                        username=username,
                        details=details_dict if details_dict else None,
                        ip_address=client_ip
                    )
                    return result
                except Exception as e:
                    AuditService.log(
                        db=db,
                        action=f"{action}_FAILED",
                        resource_type=resource_type,
                        user_id=user_id,
                        username=username,
                        details={"error": str(e)},
                        ip_address=client_ip
                    )
                    raise e
            return sync_wrapper
    return decorator
