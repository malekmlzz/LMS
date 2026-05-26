import re
from typing import Optional, Tuple


def validate_phone(phone: Optional[str]) -> bool:
    """اعتبارسنجی شماره تلفن"""
    if phone is None:
        return True
    return bool(re.match(r'^[0-9]{10,15}$', phone))


def validate_email(email: str) -> bool:
    """اعتبارسنجی ایمیل"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_password_strength(password: str) -> Tuple[bool, Optional[str]]:
    """بررسی قدرت رمز عبور"""
    if len(password) < 6:
        return False, "رمز عبور باید حداقل ۶ کاراکتر باشد"
    return True, None


def validate_school_name(name: str) -> bool:
    """اعتبارسنجی نام مدرسه"""
    return len(name) >= 3 and len(name) <= 200
