from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel, Field, validator
import re
from datetime import datetime

from ..database import get_db
from ..models.user import User
from ..models.class_model import Class, Enrollment
from ..core.security import get_password_hash
from ..core.dependencies import require_role

router = APIRouter(prefix="/students", tags=["Student Management"])


# ========== مدل‌های اعتبارسنجی ==========

class StudentCreate(BaseModel):
    full_name: str = Field(..., min_length=3, max_length=200)
    email: Optional[str] = None
    phone: Optional[str] = Field(None, pattern=r'^[0-9]{10,15}$')
    parent_phone: Optional[str] = Field(None, pattern=r'^[0-9]{10,15}$')
    grade: Optional[str] = Field(None, max_length=50)
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=72)
    class_id: Optional[int] = None
    
    @validator('email')
    def validate_email(cls, v):
        if v:
            pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
            if not re.match(pattern, v):
                raise ValueError('ایمیل نامعتبر است')
            return v.lower()
        return v


class StudentUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    parent_phone: Optional[str] = None
    grade: Optional[str] = None
    is_active: Optional[bool] = None
    class_id: Optional[int] = None


class StudentResponse(BaseModel):
    id: int
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    parent_phone: Optional[str] = None
    grade: Optional[str] = None
    username: str
    is_active: bool
    created_at: datetime
    class_name: Optional[str] = None
    
    class Config:
        from_attributes = True


# ========== لاگ امنیتی ==========

def log_security_event(action: str, user_id: int, school_id: int, target_id: int = None, details: str = None):
    print(f"[SECURITY] Student Management - Action: {action}, User: {user_id}, School: {school_id}, Target: {target_id}, Details: {details}")


# ========== اندپوینت دریافت لیست کلاس‌ها ==========

@router.get("/classes")
async def get_all_classes(
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """دریافت لیست کلاس‌های مدرسه برای انتخاب در فرم دانش‌آموز"""
    
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


# ========== اندپوینت ایجاد دانش‌آموز ==========

@router.post("/", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
async def create_student(
    student_data: StudentCreate,
    request: Request,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """ایجاد دانش‌آموز جدید و ثبت در کلاس انتخاب شده"""
    
    school_id = current_user.get("school_id")
    admin_id = current_user.get("user_id")
    
    # بررسی تکراری نبودن ایمیل
    if student_data.email:
        existing_email = db.query(User).filter(
            User.email == student_data.email,
            User.school_id == school_id
        ).first()
        
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="این ایمیل قبلاً ثبت شده است"
            )
    
    # بررسی تکراری نبودن نام کاربری
    existing_username = db.query(User).filter(
        User.username == student_data.username,
        User.school_id == school_id
    ).first()
    
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="این نام کاربری قبلاً ثبت شده است"
        )
    
    # ایجاد دانش‌آموز
    hashed_password = get_password_hash(student_data.password)
    
    new_student = User(
        school_id=school_id,
        full_name=student_data.full_name,
        email=student_data.email,
        phone=student_data.phone,
        parent_phone=student_data.parent_phone,
        grade=student_data.grade,
        username=student_data.username,
        password_hash=hashed_password,
        role="student",
        is_active=True
    )
    
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    
    # ثبت دانش‌آموز در کلاس انتخاب شده
    class_name = None
    if student_data.class_id:
        target_class = db.query(Class).filter(
            Class.id == student_data.class_id,
            Class.school_id == school_id,
            Class.is_active == True
        ).first()
        
        if target_class:
            class_name = target_class.name
            existing_enrollment = db.query(Enrollment).filter(
                Enrollment.class_id == target_class.id,
                Enrollment.student_id == new_student.id
            ).first()
            
            if not existing_enrollment:
                new_enrollment = Enrollment(
                    school_id=school_id,
                    class_id=target_class.id,
                    student_id=new_student.id
                )
                db.add(new_enrollment)
                db.commit()
    
    log_security_event("CREATE_STUDENT", admin_id, school_id, new_student.id, f"Student: {student_data.username}")
    
    # برگرداندن پاسخ با دیکشنری
    return {
        "id": new_student.id,
        "full_name": new_student.full_name,
        "email": new_student.email,
        "phone": new_student.phone,
        "parent_phone": new_student.parent_phone,
        "grade": new_student.grade,
        "username": new_student.username,
        "is_active": new_student.is_active,
        "created_at": new_student.created_at,
        "class_name": class_name
    }


# ========== اندپوینت دریافت لیست دانش‌آموزان ==========

@router.get("/", response_model=List[StudentResponse])
async def get_students(
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """دریافت لیست دانش‌آموزان مدرسه همراه با کلاس آنها"""
    
    school_id = current_user.get("school_id")
    
    students = db.query(User).filter(
        User.school_id == school_id,
        User.role == "student"
    ).all()
    
    result = []
    for student in students:
        # دریافت کلاس دانش‌آموز
        enrollment = db.query(Enrollment).filter(
            Enrollment.student_id == student.id
        ).first()
        
        class_name = None
        if enrollment:
            cls = db.query(Class).filter(Class.id == enrollment.class_id).first()
            if cls:
                class_name = cls.name
        
        result.append({
            "id": student.id,
            "full_name": student.full_name,
            "email": student.email,
            "phone": student.phone,
            "parent_phone": student.parent_phone,
            "grade": student.grade,
            "username": student.username,
            "is_active": student.is_active,
            "created_at": student.created_at,
            "class_name": class_name
        })
    
    return result


# ========== اندپوینت دریافت اطلاعات یک دانش‌آموز ==========

@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: int,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """دریافت اطلاعات یک دانش‌آموز"""
    
    school_id = current_user.get("school_id")
    
    student = db.query(User).filter(
        User.id == student_id,
        User.school_id == school_id,
        User.role == "student"
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="دانش‌آموز یافت نشد"
        )
    
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == student.id
    ).first()
    
    class_name = None
    if enrollment:
        cls = db.query(Class).filter(Class.id == enrollment.class_id).first()
        if cls:
            class_name = cls.name
    
    return {
        "id": student.id,
        "full_name": student.full_name,
        "email": student.email,
        "phone": student.phone,
        "parent_phone": student.parent_phone,
        "grade": student.grade,
        "username": student.username,
        "is_active": student.is_active,
        "created_at": student.created_at,
        "class_name": class_name
    }


# ========== اندپوینت ویرایش دانش‌آموز ==========

@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: int,
    student_data: StudentUpdate,
    request: Request,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """ویرایش اطلاعات دانش‌آموز و تغییر کلاس"""
    
    school_id = current_user.get("school_id")
    admin_id = current_user.get("user_id")
    
    student = db.query(User).filter(
        User.id == student_id,
        User.school_id == school_id,
        User.role == "student"
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="دانش‌آموز یافت نشد"
        )
    
    # به‌روزرسانی اطلاعات دانش‌آموز
    if student_data.full_name is not None:
        student.full_name = student_data.full_name
    if student_data.email is not None:
        existing_email = db.query(User).filter(
            User.email == student_data.email,
            User.school_id == school_id,
            User.id != student_id
        ).first()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="این ایمیل قبلاً ثبت شده است"
            )
        student.email = student_data.email
    if student_data.phone is not None:
        student.phone = student_data.phone
    if student_data.parent_phone is not None:
        student.parent_phone = student_data.parent_phone
    if student_data.grade is not None:
        student.grade = student_data.grade
    if student_data.is_active is not None:
        student.is_active = student_data.is_active
    
    db.commit()
    db.refresh(student)
    
    # به‌روزرسانی کلاس دانش‌آموز
    class_name = None
    current_enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == student_id
    ).first()
    
    if student_data.class_id is not None:
        if current_enrollment and current_enrollment.class_id != student_data.class_id:
            db.delete(current_enrollment)
            current_enrollment = None
        
        if student_data.class_id > 0 and not current_enrollment:
            target_class = db.query(Class).filter(
                Class.id == student_data.class_id,
                Class.school_id == school_id,
                Class.is_active == True
            ).first()
            
            if target_class:
                class_name = target_class.name
                new_enrollment = Enrollment(
                    school_id=school_id,
                    class_id=target_class.id,
                    student_id=student.id
                )
                db.add(new_enrollment)
                db.commit()
        
        elif student_data.class_id == 0 and current_enrollment:
            db.delete(current_enrollment)
            db.commit()
    else:
        if current_enrollment:
            cls = db.query(Class).filter(Class.id == current_enrollment.class_id).first()
            if cls:
                class_name = cls.name
    
    log_security_event("UPDATE_STUDENT", admin_id, school_id, student_id, "Updated")
    
    return {
        "id": student.id,
        "full_name": student.full_name,
        "email": student.email,
        "phone": student.phone,
        "parent_phone": student.parent_phone,
        "grade": student.grade,
        "username": student.username,
        "is_active": student.is_active,
        "created_at": student.created_at,
        "class_name": class_name
    }


# ========== اندپوینت حذف دانش‌آموز ==========

@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_student(
    student_id: int,
    current_user: dict = Depends(require_role("admin")),
    db: Session = Depends(get_db)
):
    """حذف دانش‌آموز"""
    
    school_id = current_user.get("school_id")
    admin_id = current_user.get("user_id")
    
    student = db.query(User).filter(
        User.id == student_id,
        User.school_id == school_id,
        User.role == "student"
    ).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="دانش‌آموز یافت نشد"
        )
    
    db.query(Enrollment).filter(Enrollment.student_id == student_id).delete()
    db.delete(student)
    db.commit()
    
    log_security_event("DELETE_STUDENT", admin_id, school_id, student_id, f"Student: {student.username}")
    
    return None