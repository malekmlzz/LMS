from pydantic import BaseModel, Field, field_validator, EmailStr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=200)
    email: EmailStr
    phone: Optional[str] = Field(None, pattern=r'^[0-9]{10,15}$')
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=72)
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError('رمز عبور حداقل ۶ کاراکتر باید باشد')
        if len(v) > 72:
            raise ValueError('رمز عبور حداکثر ۷۲ کاراکتر باید باشد')
        return v


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(UserBase):
    id: int
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: int
    school_id: int
    username: str
    role: str
