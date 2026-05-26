from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field
import secrets
from datetime import datetime

from ..database import get_db
from ..models.user import User
from ..models.class_model import Class, Lesson
from ..core.dependencies import require_role

router = APIRouter(prefix="/classes", tags=["Class Management"])


class ClassCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=200)
    code: Optional[str] = None
    grade: Optional[str] = None


class ClassResponse(BaseModel):
    id: int
    name: str
    code: Optional[str]
    grade: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class LessonCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=200)
    schedule: Optional[str] = None


class LessonResponse(BaseModel):
    id: int
    name: str
    schedule: Optional[str]
    class_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


@router.post("/", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
async def create_class(
    class_data: ClassCreate,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """ایجاد کلاس جدید"""
    
    school_id = current_user.get("school_id")
    
    # تولید کد کلاس خودکار
    if not class_data.code:
        class_data.code = secrets.token_hex(3).upper()
    
    new_class = Class(
        school_id=school_id,
        name=class_data.name,
        code=class_data.code,
        grade=class_data.grade,
        is_active=True
    )
    
    db.add(new_class)
    db.commit()
    db.refresh(new_class)
    
    return ClassResponse(
        id=new_class.id,
        name=new_class.name,
        code=new_class.code,
        grade=new_class.grade,
        is_active=new_class.is_active,
        created_at=new_class.created_at
    )


@router.get("/", response_model=List[ClassResponse])
async def get_classes(
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """دریافت لیست کلاس‌ها"""
    
    school_id = current_user.get("school_id")
    
    classes = db.query(Class).filter(
        Class.school_id == school_id,
        Class.is_active == True
    ).order_by(Class.created_at.desc()).all()
    
    return classes


@router.get("/{class_id}/lessons", response_model=List[LessonResponse])
async def get_class_lessons(
    class_id: int,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """دریافت لیست درس‌های یک کلاس"""
    
    school_id = current_user.get("school_id")
    
    lessons = db.query(Lesson).filter(
        Lesson.class_id == class_id,
        Lesson.school_id == school_id,
        Lesson.is_active == True
    ).all()
    
    return lessons


@router.post("/{class_id}/lessons", response_model=LessonResponse, status_code=status.HTTP_201_CREATED)
async def add_lesson(
    class_id: int,
    lesson_data: LessonCreate,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """افزودن درس به کلاس"""
    
    school_id = current_user.get("school_id")
    
    cls = db.query(Class).filter(
        Class.id == class_id,
        Class.school_id == school_id
    ).first()
    
    if not cls:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کلاس یافت نشد"
        )
    
    new_lesson = Lesson(
        school_id=school_id,
        class_id=class_id,
        name=lesson_data.name,
        schedule=lesson_data.schedule,
        is_active=True
    )
    
    db.add(new_lesson)
    db.commit()
    db.refresh(new_lesson)
    
    return LessonResponse(
        id=new_lesson.id,
        name=new_lesson.name,
        schedule=new_lesson.schedule,
        class_id=new_lesson.class_id,
        is_active=new_lesson.is_active,
        created_at=new_lesson.created_at
    )


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    class_id: int,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """حذف کلاس"""
    
    school_id = current_user.get("school_id")
    
    cls = db.query(Class).filter(
        Class.id == class_id,
        Class.school_id == school_id
    ).first()
    
    if not cls:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="کلاس یافت نشد"
        )
    
    db.query(Lesson).filter(Lesson.class_id == class_id).delete()
    db.delete(cls)
    db.commit()
    
    return None


@router.delete("/lessons/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: int,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """حذف درس"""
    
    school_id = current_user.get("school_id")
    
    lesson = db.query(Lesson).filter(
        Lesson.id == lesson_id,
        Lesson.school_id == school_id
    ).first()
    
    if not lesson:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="درس یافت نشد"
        )
    
    db.delete(lesson)
    db.commit()
    
    return None