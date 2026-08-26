from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password
from app.core.exceptions import AuthException, AppException
from typing import Optional, List

class AuthService:
    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> User:
        """
        Authenticate user credentials using badge_id/username and password_hash.
        Raises AuthException on invalid credentials.
        """
        user = db.query(User).filter((User.badge_id == username) | (User.username == username)).first()
        if not user:
            raise AuthException(message="Tài khoản hoặc mật khẩu không chính xác")
        
        if not verify_password(password, user.password_hash):
            raise AuthException(message="Tài khoản hoặc mật khẩu không chính xác")
            
        if not user.is_active:
            raise AuthException(message="Tài khoản đang bị khóa")
            
        return user

    @staticmethod
    def create_user(db: Session, user_in: UserCreate) -> User:
        """
        Create a new investigator user with hashed password.
        """
        existing_user = db.query(User).filter(User.badge_id == user_in.badge_id).first()
        if existing_user:
            raise AppException(message=f"Số hiệu điều tra viên '{user_in.badge_id}' đã tồn tại", code="BAD_REQUEST")
            
        hashed_password = get_password_hash(user_in.password)
        db_user = User(
            badge_id=user_in.badge_id,
            password_hash=hashed_password,
            full_name=user_in.full_name,
            role=user_in.role
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update_user(db: Session, user_id: int, user_in: UserUpdate) -> User:
        """
        Update investigator user information or change password.
        """
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise AppException(message="Không tìm thấy người dùng", code="NOT_FOUND", status_code=404)
            
        if user_in.full_name is not None:
            db_user.full_name = user_in.full_name
        if user_in.is_active is not None:
            db_user.is_active = user_in.is_active
        if user_in.password is not None:
            db_user.password_hash = get_password_hash(user_in.password)
            
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def list_users(db: Session) -> List[User]:
        return db.query(User).all()
        
    @staticmethod
    def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
        return db.query(User).filter(User.id == user_id).first()
