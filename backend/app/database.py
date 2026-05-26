from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os

# استفاده از SQLite برای توسعه
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./school.db")

# ایجاد موتور دیتابیس
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}  # فقط برای SQLite
)

# ایجاد سشن فکتوری
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# کلاس پایه برای مدل‌ها
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """دریافت سشن دیتابیس"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
