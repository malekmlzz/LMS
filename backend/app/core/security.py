from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
import secrets
import hashlib
import hmac
from ..config import settings

# تنظیمات هش رمز عبور با bcrypt قوی
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=settings.BCRYPT_ROUNDS  # 12 rounds پیش‌فرض
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    بررسی صحت رمز عبور با محافظت در برابر timing attack
    """
    # محدود کردن طول رمز عبور به 72 کاراکتر (محدودیت bcrypt)
    if len(plain_password) > 72:
        plain_password = plain_password[:72]
    
    # استفاده از timing-safe comparison
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    هش کردن رمز عبور با bcrypt و salt تصادفی
    """
    if len(password) > 72:
        password = password[:72]
    
    # bcrypt به صورت خودکار salt تصادفی اضافه می‌کند
    return pwd_context.hash(password, rounds=settings.BCRYPT_ROUNDS)


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    ایجاد توکن JWT با امضای HS256
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
    })
    
    # امضای توکن با secret key
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.SECRET_KEY, 
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    رمزگشایی و اعتبارسنجی توکن JWT
    """
    try:
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM],
            options={"verify_exp": True}
        )
        return payload
    except JWTError:
        return None


def generate_secure_token(length: int = 32) -> str:
    """
    تولید توکن امن تصادفی برای استفاده‌های مختلف
    """
    return secrets.token_urlsafe(length)


def hash_api_key(api_key: str) -> str:
    """
    هش کردن API key برای ذخیره در دیتابیس
    """
    return hashlib.sha256(api_key.encode()).hexdigest()


def verify_api_key(api_key: str, hashed_key: str) -> bool:
    """
    بررسی اعتبار API key با timing-safe comparison
    """
    return hmac.compare_digest(hash_api_key(api_key), hashed_key)


def generate_school_code(school_name: str) -> str:
    """
    تولید کد یکتا برای مدرسه (امن و غیرقابل حدس)
    """
    random_bytes = secrets.token_bytes(32)
    timestamp = datetime.utcnow().timestamp()
    
    # ترکیب اطلاعات مختلف برای ایجاد هش منحصربه‌فرد
    hash_input = f"{school_name}_{timestamp}_{random_bytes.hex()}"
    hash_value = hashlib.sha256(hash_input.encode()).hexdigest()[:12].upper()
    
    # اضافه کردن بخش تصادفی
    random_part = secrets.token_hex(4).upper()
    
    return f"{hash_value}-{random_part}"