from fastapi import APIRouter, Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, Field, validator
import re
from datetime import datetime, timedelta
import secrets
import hashlib

from ..database import get_db
from ..models.user import User
from ..models.school import School
from ..core.security import (
    get_password_hash, 
    verify_password, 
    create_access_token,
    decode_access_token,
    generate_secure_token
)
from ..core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ========== مدل‌های اعتبارسنجی ==========

class SchoolRegisterRequest(BaseModel):
    schoolName: str = Field(..., min_length=3, max_length=200)
    adminName: str = Field(..., min_length=3, max_length=200)
    email: str
    phone: Optional[str] = None
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8, max_length=72)
    
    @validator('email')
    def validate_email(cls, v):
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError('ایمیل نامعتبر است')
        return v.lower()
    
    @validator('password')
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('رمز عبور باید حداقل ۸ کاراکتر باشد')
        if not any(c.isupper() for c in v):
            raise ValueError('رمز عبور باید حداقل یک حرف بزرگ داشته باشد')
        if not any(c.islower() for c in v):
            raise ValueError('رمز عبور باید حداقل یک حرف کوچک داشته باشد')
        if not any(c.isdigit() for c in v):
            raise ValueError('رمز عبور باید حداقل یک عدد داشته باشد')
        return v
    
    @validator('phone')
    def validate_phone(cls, v):
        if v:
            if not re.match(r'^[0-9]{10,15}$', v):
                raise ValueError('شماره تلفن نامعتبر است')
        return v


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=1, max_length=72)
    
    @validator('username')
    def sanitize_username(cls, v):
        return re.sub(r'[^\w@._-]', '', v).lower()


# ========== امنیت ==========

invalid_tokens = set()
login_attempts = {}


def check_rate_limit(identifier: str) -> bool:
    """بررسی محدودیت نرخ درخواست - حداکثر ۵ تلاش در ۱۵ دقیقه"""
    now = datetime.now()
    if identifier not in login_attempts:
        login_attempts[identifier] = []
    
    login_attempts[identifier] = [
        attempt for attempt in login_attempts[identifier]
        if now - attempt < timedelta(minutes=15)
    ]
    
    if len(login_attempts[identifier]) >= 5:
        return False
    
    login_attempts[identifier].append(now)
    return True


def log_security_event(action: str, username: str, ip: str, success: bool, details: str = None):
    """ثبت رویدادهای امنیتی"""
    status = "SUCCESS" if success else "FAILED"
    print(f"[SECURITY] {action} - User: {username}, IP: {ip}, Status: {status}, Details: {details}, Time: {datetime.now()}")


# ========== اندپوینت‌ها ==========

@router.post("/register-school", status_code=status.HTTP_201_CREATED)
async def register_school(
    data: SchoolRegisterRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """ثبت‌نام مدرسه جدید با امنیت بالا"""
    
    client_ip = request.client.host
    
    # Rate limiting
    if not check_rate_limit(f"register_{client_ip}"):
        log_security_event("REGISTER", data.username, client_ip, False, "Rate limit exceeded")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="تعداد درخواست‌های شما بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر تلاش کنید"
        )
    
    # بررسی تکراری نبودن ایمیل
    existing_email = db.query(User).filter(User.email == data.email).first()
    if existing_email:
        log_security_event("REGISTER", data.username, client_ip, False, "Duplicate email")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="این ایمیل قبلاً ثبت شده است"
        )
    
    # بررسی تکراری نبودن نام کاربری
    existing_username = db.query(User).filter(User.username == data.username).first()
    if existing_username:
        log_security_event("REGISTER", data.username, client_ip, False, "Duplicate username")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="این نام کاربری قبلاً ثبت شده است"
        )
    
    # تولید کد مدرسه امن
    random_bytes = secrets.token_bytes(32)
    hash_input = f"{data.schoolName}_{data.email}_{datetime.now().timestamp()}"
    hash_value = hashlib.sha256(hash_input.encode()).hexdigest()[:8].upper()
    random_part = secrets.token_hex(3).upper()
    school_code = f"{hash_value}-{random_part}"
    
    # ایجاد مدرسه
    db_school = School(
        name=data.schoolName,
        code=school_code,
        phone=data.phone,
        email=data.email,
        is_active=True
    )
    db.add(db_school)
    db.commit()
    db.refresh(db_school)
    
    # ایجاد کاربر مدیر
    hashed_password = get_password_hash(data.password)
    db_admin = User(
        school_id=db_school.id,
        full_name=data.adminName,
        email=data.email,
        phone=data.phone,
        username=data.username,
        password_hash=hashed_password,
        role="admin",
        is_active=True
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    
    # ایجاد توکن JWT
    token_data = {
        "sub": str(db_admin.id),
        "user_id": db_admin.id,
        "school_id": db_admin.school_id,
        "username": db_admin.username,
        "role": db_admin.role,
        "jti": generate_secure_token(16),
        "iat": datetime.utcnow().timestamp(),
    }
    access_token = create_access_token(token_data)
    
    log_security_event("REGISTER", data.username, client_ip, True, f"School: {data.schoolName}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 7 * 24 * 60 * 60,  # 7 روز
        "user": {
            "id": db_admin.id,
            "username": db_admin.username,
            "full_name": db_admin.full_name,
            "email": db_admin.email,
            "role": db_admin.role,
        },
        "school_code": db_school.code
    }


@router.post("/login")
async def login(
    login_data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """ورود کاربر به سیستم - بدون نیاز به کد مدرسه"""
    
    client_ip = request.client.host
    user_agent = request.headers.get("user-agent", "")
    
    # Rate limiting
    identifier = f"login_{client_ip}_{login_data.username}"
    if not check_rate_limit(identifier):
        log_security_event("LOGIN", login_data.username, client_ip, False, "Rate limit exceeded")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="تعداد تلاش‌های ناموفق بیش از حد مجاز است. لطفاً ۱۵ دقیقه دیگر تلاش کنید"
        )
    
    # پیدا کردن کاربر با username
    user = db.query(User).filter(
        User.username == login_data.username,
        User.is_active == True
    ).first()
    
    # تأخیر تصادفی برای جلوگیری از timing attack
    import time
    time.sleep(secrets.randbelow(300) / 1000)
    
    # بررسی وجود کاربر و صحت رمز
    if not user or not verify_password(login_data.password, user.password_hash):
        # افزایش شمارنده تلاش‌های ناموفق
        if user:
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            db.commit()
        log_security_event("LOGIN", login_data.username, client_ip, False, "Invalid credentials")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="نام کاربری یا رمز عبور اشتباه است"
        )
    
    # بررسی قفل شدن حساب (بعد از ۱۰ تلاش ناموفق)
    if user.failed_login_attempts and user.failed_login_attempts >= 10:
        log_security_event("LOGIN", login_data.username, client_ip, False, "Account locked")
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="حساب کاربری شما به دلیل تلاش‌های ناموفق متعدد قفل شده است. لطفاً با مدیر تماس بگیرید"
        )
    
    # ریست شمارنده تلاش‌های ناموفق
    user.failed_login_attempts = 0
    user.last_login_at = datetime.utcnow()
    user.last_login_ip = client_ip
    user.last_login_user_agent = user_agent
    db.commit()
    
    # دریافت اطلاعات مدرسه
    school = db.query(School).filter(School.id == user.school_id).first()
    
    # ایجاد توکن JWT
    token_data = {
        "sub": str(user.id),
        "user_id": user.id,
        "school_id": user.school_id,
        "username": user.username,
        "role": user.role,
        "jti": generate_secure_token(16),
        "iat": datetime.utcnow().timestamp(),
    }
    access_token = create_access_token(token_data)
    
    log_security_event("LOGIN", login_data.username, client_ip, True, f"Role: {user.role}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": 7 * 24 * 60 * 60,
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "role": user.role,
            "school_name": school.name if school else None,
        }
    }
@router.post("/logout")
async def logout(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """خروج ایمن از سیستم - Invalidate token"""
    
    # توکن قبلاً در middleware اعتبارسنجی شده
    # اضافه کردن به لیست سیاه (در تولید واقعی باید در Redis یا دیتابیس ذخیره شود)
    # برای سادگی، فعلاً فقط لاگ می‌کنیم
    client_ip = request.client.host
    log_security_event("LOGOUT", current_user.get("username"), client_ip, True, None)
    
    return {"message": "خروج با موفقیت انجام شد"}


@router.get("/verify")
async def verify_token(
    current_user: dict = Depends(get_current_user)
):
    """بررسی اعتبار توکن"""
    return {
        "valid": True,
        "user": {
            "id": current_user.get("user_id"),
            "username": current_user.get("username"),
            "role": current_user.get("role"),
        }
    }