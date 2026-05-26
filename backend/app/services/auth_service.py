from sqlalchemy.orm import Session
from ..models.user import User
from ..schemas.user import UserCreate
from ..core.security import get_password_hash, verify_password, create_access_token
from .school_service import SchoolService


class AuthService:
    
    @staticmethod
    def get_user_by_username(db: Session, username: str) -> User | None:
        """دریافت کاربر با نام کاربری"""
        return db.query(User).filter(User.username == username, User.is_active == True).first()
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User | None:
        """دریافت کاربر با ایمیل"""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def create_admin_user(db: Session, school_id: int, user_data: UserCreate) -> User:
        """ایجاد کاربر مدیر برای مدرسه"""
        hashed_password = get_password_hash(user_data.password)
        
        db_user = User(
            school_id=school_id,
            full_name=user_data.full_name,
            email=user_data.email,
            phone=user_data.phone,
            username=user_data.username,
            password_hash=hashed_password,
            role="admin",
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
    
    @staticmethod
    def authenticate_user(db: Session, username: str, password: str) -> User | None:
        """احراز هویت کاربر"""
        user = AuthService.get_user_by_username(db, username)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user
    
    @staticmethod
    def create_access_token_for_user(user: User) -> str:
        """ایجاد توکن برای کاربر"""
        token_data = {
            "sub": str(user.id),
            "user_id": user.id,
            "school_id": user.school_id,
            "username": user.username,
            "role": user.role,
        }
        return create_access_token(token_data)
