from fastapi import APIRouter, Depends, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from app.db.session import get_db
from app.core.security import create_access_token, get_current_user, allow_admin, allow_leadership
from app.schemas.user import Token, UserOut, UserCreate, UserUpdate
from app.services.auth import AuthService
from app.services.audit import AuditService
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login. Access token is returned.
    Audit log records login success/failure.
    """
    client_ip = request.client.host if request.client else None
    try:
        user = AuthService.authenticate_user(db, form_data.username, form_data.password)
        
        # Log successful login
        AuditService.log(
            db=db,
            action="LOGIN",
            resource_type="USER",
            resource_id=user.id,
            user_id=user.id,
            username=user.username,
            details={"message": "Đăng nhập thành công"},
            ip_address=client_ip
        )
        
        access_token = create_access_token(subject=user.username, role=user.role)
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        # Log failed login attempt
        AuditService.log(
            db=db,
            action="LOGIN_FAILED",
            resource_type="USER",
            username=form_data.username,
            details={"error": str(e), "input_username": form_data.username},
            ip_address=client_ip
        )
        raise e

@router.get("/me", response_model=UserOut)
def read_user_me(current_user: User = Depends(get_current_user)):
    """
    Get profile of the currently logged-in user.
    """
    return current_user

@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_new_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    """
    Admin-only endpoint to register a new system user.
    """
    new_user = AuthService.create_user(db, user_in)
    
    # Audit log creation
    AuditService.log(
        db=db,
        action="CREATE_USER",
        resource_type="USER",
        resource_id=new_user.id,
        user_id=current_user.id,
        username=current_user.username,
        details={"created_username": new_user.username, "role": new_user.role}
    )
    return new_user

@router.get("/users", response_model=List[UserOut])
def read_all_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_leadership)
):
    """
    Leadership & Admin endpoint to list all users.
    """
    return AuthService.list_users(db)

@router.put("/users/{user_id}", response_model=UserOut)
def update_user_by_id(
    user_id: int,
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    """
    Admin-only endpoint to update user attributes or change their password.
    """
    updated_user = AuthService.update_user(db, user_id, user_in)
    
    # Audit log update
    AuditService.log(
        db=db,
        action="UPDATE_USER",
        resource_type="USER",
        resource_id=user_id,
        user_id=current_user.id,
        username=current_user.username,
        details={"updated_username": updated_user.username, "fields": user_in.model_dump(exclude_unset=True, exclude={"password"})}
    )
    return updated_user
