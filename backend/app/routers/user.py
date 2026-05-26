from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, Field, validator
import re

from ..database import get_db
from ..models.user import User
from ..core.security import get_password_hash, verify_password
from ..core.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["User Management"])


# ========== مدل‌های اعتبارسنجی ==========

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=3, max_length=200)
    email: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)  # تغییر: حذف pattern و اجازه دادن به رشته خالی
    
    @validator('email')
    def validate_email(cls, v):
        if v:
            pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(pattern, v):
                raise ValueError('ایمیل نامعتبر است')
            return v.lower()
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v and v.strip():  # فقط اگر مقدار غیر خالی باشد اعتبارسنجی کن
            if not re.match(r'^[0-9]{10,15}$', v):
                raise ValueError('شماره تلفن نامعتبر است')
            return v
        return None  # مقدار خالی را به None تبدیل کن


class ChangePassword(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=6, max_length=72)


class UserResponse(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str]
    username: str
    role: str
    
    class Config:
        from_attributes = True


# ========== اندپوینت‌ها ==========

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """دریافت اطلاعات کاربر جاری"""
    
    user = db.query(User).filter(User.id == current_user.get("user_id")).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کاربر یافت نشد"
        )
    
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        username=user.username,
        role=user.role
    )


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    profile_data: ProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """بروزرسانی پروفایل کاربر"""
    
    user = db.query(User).filter(User.id == current_user.get("user_id")).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کاربر یافت نشد"
        )
    
    # بررسی تکراری نبودن ایمیل
    if profile_data.email and profile_data.email != user.email:
        existing = db.query(User).filter(
            User.email == profile_data.email,
            User.id != user.id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="این ایمیل قبلاً ثبت شده است"
            )
        user.email = profile_data.email
    
    if profile_data.full_name is not None and profile_data.full_name.strip():
        user.full_name = profile_data.full_name.strip()
    
    # phone می‌تواند None باشد (یعنی حذف شده) یا مقدار جدید
    if profile_data.phone is not None:
        user.phone = profile_data.phone if profile_data.phone else None
    
    db.commit()
    db.refresh(user)
    
    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        username=user.username,
        role=user.role
    )


@router.post("/change-password")
async def change_password(
    password_data: ChangePassword,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """تغییر رمز عبور"""
    
    user = db.query(User).filter(User.id == current_user.get("user_id")).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کاربر یافت نشد"
        )
    
    # بررسی رمز عبور فعلی
    if not verify_password(password_data.current_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="رمز عبور فعلی اشتباه است"
        )
    
    # تغییر رمز عبور
    user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "رمز عبور با موفقیت تغییر کرد"}


@router.delete("/profile-image")
async def delete_profile_image(
    current_user: dict = Depends(get_current_user)
):
    """حذف عکس پروفایل"""
    return {"message": "عکس پروفایل حذف شد"}