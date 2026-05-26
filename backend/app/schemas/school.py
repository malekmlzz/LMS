from pydantic import BaseModel, Field, field_validator
from typing import Optional


class SchoolBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=200, description="نام مدرسه")
    address: Optional[str] = Field(None, max_length=500)
    phone: Optional[str] = Field(None, pattern=r'^[0-9]{10,15}$')
    email: Optional[str] = None


class SchoolCreate(SchoolBase):
    pass


class SchoolResponse(SchoolBase):
    id: int
    code: str
    is_active: bool
    
    class Config:
        from_attributes = True
