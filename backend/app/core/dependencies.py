from fastapi import Depends, HTTPException, status, Header, Request
from sqlalchemy.orm import Session
from typing import Optional, Dict
from jose import JWTError

from ..database import get_db
from ..models.user import User
from .security import decode_access_token


async def get_current_user(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    request: Request = None,
    db: Session = Depends(get_db)
) -> Dict:
    """
    دریافت کاربر جاری از توکن JWT
    بدون نیاز به کد مدرسه - فقط با توکن
    """
    
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="توکن ارائه نشده است",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="فرمت توکن نامعتبر است",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = authorization.replace("Bearer ", "")
    
    # رمزگشایی توکن
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="توکن نامعتبر یا منقضی شده است",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="توکن نامعتبر است"
        )
    
    # بررسی وجود کاربر در دیتابیس
    user = db.query(User).filter(
        User.id == user_id,
        User.is_active == True
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="کاربر یافت نشد"
        )
    
    # بررسی IP (اختیاری - می‌تواند غیرفعال شود)
    client_ip = request.client.host if request else None
    token_ip = payload.get("ip")
    if token_ip and client_ip and token_ip != client_ip:
        # IP تغییر کرده - می‌تواند خطا دهد یا فقط لاگ کند
        # برای امنیت بیشتر، می‌توانیم توکن را نامعتبر کنیم
        pass
    
    return {
        "user_id": user.id,
        "school_id": user.school_id,
        "username": user.username,
        "role": user.role,
        "full_name": user.full_name,
        "email": user.email,
    }


def require_role(required_role: str):
    """
    دکوریتور برای محدودیت دسترسی بر اساس نقش کاربر
    استفاده: @router.get("/admin-only", dependencies=[Depends(require_role("admin"))])
    """
    async def role_checker(current_user: Dict = Depends(get_current_user)):
        if current_user.get("role") != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"شما دسترسی {required_role} ندارید"
            )
        return current_user
    return role_checker


def require_any_role(*roles: str):
    """
    دکوریتور برای محدودیت دسترسی بر اساس چند نقش
    استفاده: @router.get("/protected", dependencies=[Depends(require_any_role("admin", "teacher"))])
    """
    async def role_checker(current_user: Dict = Depends(get_current_user)):
        if current_user.get("role") not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"شما دسترسی لازم را ندارید"
            )
        return current_user
    return role_checker