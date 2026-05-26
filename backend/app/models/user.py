from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False, index=True)
    full_name = Column(String(200), nullable=False)
    email = Column(String(100), nullable=True)  # ← تغییر به nullable=True
    phone = Column(String(20), nullable=True)
    parent_phone = Column(String(20), nullable=True)
    grade = Column(String(50), nullable=True)
    username = Column(String(100), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="student")
    is_active = Column(Boolean, default=True)
    
    # فیلدهای امنیتی
    failed_login_attempts = Column(Integer, default=0)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    last_login_ip = Column(String(45), nullable=True)
    last_login_user_agent = Column(String(500), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<User {self.username} ({self.role})>"