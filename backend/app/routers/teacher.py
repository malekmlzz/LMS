from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field, validator
import re
from datetime import datetime

from ..database import get_db
from ..models.user import User
from ..models.class_model import Class , Lesson
from ..models.teacher_class import TeacherClass
from ..models.teacher_lesson import TeacherLesson
from ..core.security import get_password_hash
from ..core.dependencies import require_role

router = APIRouter(prefix="/teachers", tags=["Teacher Management"])


# ========== مدل‌های اعتبارسنجی ==========

class TeacherCreate(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=200)
    email: Optional[str] = None
    phone: Optional[str] = Field(None, pattern=r'^[0-9]{10,15}$')
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=72)
    subject: Optional[str] = Field(None, max_length=100)
    
    @validator('email')
    def validate_email(cls, v):
        if v:
            pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(pattern, v):
                raise ValueError('ایمیل نامعتبر است')
            return v.lower()
        return v


class AssignClassRequest(BaseModel):
    class_id: int


class AddLessonRequest(BaseModel):
    class_id: int
    lesson_id: int


class TeacherResponse(BaseModel):
    id: int
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    username: str
    subject: Optional[str] = None
    is_active: bool
    created_at: datetime
    classes: List[dict] = []
    
    class Config:
        from_attributes = True


# ========== اندپوینت‌ها ==========

@router.post("")  # ← بدون اسلش
async def create_teacher(
    teacher_data: TeacherCreate,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """ایجاد معلم جدید"""
    
    school_id = current_user.get("school_id")
    
    # بررسی تکراری نبودن ایمیل
    if teacher_data.email:
        existing_email = db.query(User).filter(
            User.email == teacher_data.email,
            User.school_id == school_id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="این ایمیل قبلاً ثبت شده است"
            )
    
    # بررسی تکراری نبودن نام کاربری
    existing_username = db.query(User).filter(
        User.username == teacher_data.username,
        User.school_id == school_id
    ).first()
    
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="این نام کاربری قبلاً ثبت شده است"
        )
    
    # ایجاد معلم
    hashed_password = get_password_hash(teacher_data.password)
    
    new_teacher = User(
        school_id=school_id,
        full_name=teacher_data.full_name,
        email=teacher_data.email,
        phone=teacher_data.phone,
        username=teacher_data.username,
        password_hash=hashed_password,
        role="teacher",
        is_active=True
    )
    
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)
    
    return {
        "id": new_teacher.id,
        "full_name": new_teacher.full_name,
        "email": new_teacher.email,
        "phone": new_teacher.phone,
        "username": new_teacher.username,
        "subject": teacher_data.subject,
        "is_active": new_teacher.is_active,
        "created_at": new_teacher.created_at,
        "classes": []
    }


@router.get("")
async def get_teachers(
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """دریافت لیست معلمین همراه با کلاس‌های آنها"""
    
    school_id = current_user.get("school_id")
    
    teachers = db.query(User).filter(
        User.school_id == school_id,
        User.role == "teacher"
    ).all()
    
    result = []
    for teacher in teachers:
        # دریافت کلاس‌های معلم از جدول رابط
        teacher_classes = db.query(TeacherClass).filter(
            TeacherClass.teacher_id == teacher.id,
            TeacherClass.school_id == school_id
        ).all()
        
        classes_list = []
        for tc in teacher_classes:
            cls = db.query(Class).filter(Class.id == tc.class_id).first()
            if cls:
                # دریافت درس‌هایی که معلم در این کلاس تدریس می‌کند
                teacher_lessons = db.query(TeacherLesson).filter(
                    TeacherLesson.teacher_id == teacher.id,
                    TeacherLesson.class_id == cls.id
                ).all()
                
                lesson_ids = [tl.lesson_id for tl in teacher_lessons]
                lessons_list = []
                if lesson_ids:
                    lessons = db.query(Lesson).filter(
                        Lesson.id.in_(lesson_ids),
                        Lesson.is_active == True
                    ).all()
                    lessons_list = [
                        {"id": l.id, "name": l.name, "schedule": l.schedule}
                        for l in lessons
                    ]
                
                classes_list.append({
                    "id": cls.id,
                    "name": cls.name,
                    "code": cls.code,
                    "grade": cls.grade,
                    "teacherLessons": lessons_list
                })
        
        result.append({
            "id": teacher.id,
            "full_name": teacher.full_name,
            "email": teacher.email,
            "phone": teacher.phone,
            "username": teacher.username,
            "subject": None,
            "is_active": teacher.is_active,
            "created_at": teacher.created_at,
            "classes": classes_list  # ← این مهم است
        })
    
    return result

@router.get("/available-classes")
async def get_available_classes(
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """دریافت لیست کلاس‌های موجود"""
    
    school_id = current_user.get("school_id")
    
    classes = db.query(Class).filter(
        Class.school_id == school_id,
        Class.is_active == True
    ).all()
    
    return [
        {
            "id": cls.id,
            "name": cls.name,
            "code": cls.code,
            "grade": cls.grade
        }
        for cls in classes
    ]

@router.post("/{teacher_id}/assign-class")
async def assign_class_to_teacher(
    teacher_id: int,
    assign_data: AssignClassRequest,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """اختصاص کلاس به معلم"""
    
    school_id = current_user.get("school_id")
    
    teacher = db.query(User).filter(
        User.id == teacher_id,
        User.school_id == school_id,
        User.role == "teacher"
    ).first()
    
    if not teacher:
        raise HTTPException(status_code=404, detail="معلم یافت نشد")
    
    target_class = db.query(Class).filter(
        Class.id == assign_data.class_id,
        Class.school_id == school_id
    ).first()
    
    if not target_class:
        raise HTTPException(status_code=404, detail="کلاس یافت نشد")
    
    # بررسی تکراری نبودن
    existing = db.query(TeacherClass).filter(
        TeacherClass.teacher_id == teacher_id,
        TeacherClass.class_id == assign_data.class_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="این کلاس قبلاً به این معلم اختصاص داده شده است")
    
    # ایجاد رابطه جدید
    new_teacher_class = TeacherClass(
        school_id=school_id,
        teacher_id=teacher_id,
        class_id=assign_data.class_id
    )
    db.add(new_teacher_class)
    db.commit()
    
    return {"message": f"کلاس {target_class.name} با موفقیت به {teacher.full_name} اضافه شد"}

@router.post("/{teacher_id}/add-lesson")
async def add_lesson_to_teacher(
    teacher_id: int,
    add_data: AddLessonRequest,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """افزودن درس به معلم"""
    
    school_id = current_user.get("school_id")
    
    teacher = db.query(User).filter(
        User.id == teacher_id,
        User.school_id == school_id,
        User.role == "teacher"
    ).first()
    
    if not teacher:
        raise HTTPException(status_code=404, detail="معلم یافت نشد")
    
    target_class = db.query(Class).filter(
        Class.id == add_data.class_id,
        Class.school_id == school_id
    ).first()
    
    if not target_class:
        raise HTTPException(status_code=404, detail="کلاس یافت نشد")
    
    lesson = db.query(Lesson).filter(
        Lesson.id == add_data.lesson_id,
        Lesson.class_id == add_data.class_id,
        Lesson.school_id == school_id
    ).first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="درس یافت نشد")
    
    existing = db.query(TeacherLesson).filter(
        TeacherLesson.teacher_id == teacher_id,
        TeacherLesson.class_id == add_data.class_id,
        TeacherLesson.lesson_id == add_data.lesson_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="این درس قبلاً به این معلم اختصاص داده شده است")
    
    new_teacher_lesson = TeacherLesson(
        school_id=school_id,
        teacher_id=teacher_id,
        class_id=add_data.class_id,
        lesson_id=add_data.lesson_id
    )
    db.add(new_teacher_lesson)
    db.commit()
    
    return {"message": f"درس {lesson.name} با موفقیت به {teacher.full_name} اضافه شد"}


@router.delete("/{teacher_id}/remove-lesson")
async def remove_lesson_from_teacher(
    teacher_id: int,
    remove_data: dict,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """حذف درس از معلم"""
    
    school_id = current_user.get("school_id")
    class_id = remove_data.get("class_id")
    lesson_id = remove_data.get("lesson_id")
    
    deleted = db.query(TeacherLesson).filter(
        TeacherLesson.teacher_id == teacher_id,
        TeacherLesson.class_id == class_id,
        TeacherLesson.lesson_id == lesson_id
    ).delete()
    
    if deleted == 0:
        raise HTTPException(status_code=404, detail="این درس برای این معلم یافت نشد")
    
    db.commit()
    
    return {"message": "درس با موفقیت از معلم حذف شد"}


@router.delete("/{teacher_id}/remove-class")
async def remove_class_from_teacher(
    teacher_id: int,
    remove_data: dict,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """حذف کلاس از معلم"""
    
    school_id = current_user.get("school_id")
    class_id = remove_data.get("class_id")
    
    teacher_class = db.query(TeacherClass).filter(
        TeacherClass.teacher_id == teacher_id,
        TeacherClass.class_id == class_id
    ).first()
    
    if not teacher_class:
        raise HTTPException(status_code=404, detail="این کلاس به این معلم اختصاص داده نشده است")
    
    db.delete(teacher_class)
    db.commit()
    
    return {"message": "کلاس با موفقیت از معلم حذف شد"}