from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from ..database import Base


class School(Base):
    __tablename__ = "schools"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)  # unique=True حذف شد
    code = Column(String(50), nullable=False, unique=True, index=True)
    address = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<School {self.name}>"
