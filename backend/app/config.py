from pydantic_settings import BaseSettings
from pydantic import EmailStr
import secrets


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./school.db"
    
    # JWT - افزایش عمر توکن به 7 روز
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 روز (10080 دقیقه)
    
    # Admin
    FIRST_ADMIN_EMAIL: EmailStr = "admin@school.com"
    FIRST_ADMIN_PASSWORD: str = "Admin@123456"
    
    # App
    APP_NAME: str = "School Management System"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Security
    BCRYPT_ROUNDS: int = 12
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()