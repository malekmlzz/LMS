from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime, date
from sqlalchemy import func

from ..database import get_db
from ..models.user import User
from ..models.class_model import Class, Lesson, Enrollment
from ..models.teacher_class import TeacherClass
from ..models.teacher_lesson import TeacherLesson
from ..models.attendance import Attendance
from ..models.grade import Grade
from ..core.dependencies import require_role

router = APIRouter(prefix="/teacher", tags=["Teacher Panel"])


# ========== مدل‌ها ==========

class AttendanceRecord(BaseModel):
    class_id: int
    lesson_id: int
    student_id: int
    date: str
    status: str


class GradeRecord(BaseModel):
    class_id: int
    lesson_id: int
    student_id: int
    exam_type: str
    score: float
    exam_date: Optional[str] = None  # فرمت YYYY-MM-DD

# ========== دریافت درس‌های معلم در یک کلاس ==========

@router.get("/classes/{class_id}/my-lessons")
async def get_my_class_lessons(
    class_id: int,
    current_user: dict = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    teacher_id = current_user.get("user_id")
    school_id = current_user.get("school_id")
    
    teacher_class = db.query(TeacherClass).filter(
        TeacherClass.teacher_id == teacher_id,
        TeacherClass.class_id == class_id,
        TeacherClass.school_id == school_id
    ).first()
    
    if not teacher_class:
        raise HTTPException(status_code=403, detail="شما به این کلاس دسترسی ندارید")
    
    teacher_lessons = db.query(TeacherLesson).filter(
        TeacherLesson.teacher_id == teacher_id,
        TeacherLesson.class_id == class_id,
        TeacherLesson.school_id == school_id
    ).all()
    
    result = []
    for tl in teacher_lessons:
        lesson = db.query(Lesson).filter(
            Lesson.id == tl.lesson_id,
            Lesson.is_active == True
        ).first()
        if lesson:
            result.append({
                "id": lesson.id,
                "name": lesson.name,
                "code": lesson.code,
                "schedule": lesson.schedule
            })
    
    return result


# ========== دریافت دانش‌آموزان برای یک درس خاص ==========

from sqlalchemy import func

@router.get("/classes/{class_id}/lessons/{lesson_id}/students")
async def get_class_students_for_lesson(
    class_id: int,
    lesson_id: int,
    exam_date: Optional[str] = None,
    current_user: dict = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    teacher_id = current_user.get("user_id")
    school_id = current_user.get("school_id")
    
    # بررسی دسترسی‌ها
    teacher_class = db.query(TeacherClass).filter(
        TeacherClass.teacher_id == teacher_id,
        TeacherClass.class_id == class_id,
        TeacherClass.school_id == school_id
    ).first()
    
    if not teacher_class:
        raise HTTPException(status_code=403, detail="شما به این کلاس دسترسی ندارید")
    
    teacher_lesson = db.query(TeacherLesson).filter(
        TeacherLesson.teacher_id == teacher_id,
        TeacherLesson.class_id == class_id,
        TeacherLesson.lesson_id == lesson_id,
        TeacherLesson.school_id == school_id
    ).first()
    
    if not teacher_lesson:
        raise HTTPException(status_code=403, detail="شما به این درس دسترسی ندارید")
    
    # دریافت دانش‌آموزان
    enrollments = db.query(Enrollment).filter(
        Enrollment.class_id == class_id
    ).all()
    
    result = []
    for enrollment in enrollments:
        student = db.query(User).filter(
            User.id == enrollment.student_id,
            User.is_active == True
        ).first()
        
        if student:
            # ====== نمرات امروز (فقط همان تاریخ انتخاب شده) ======
            grades_today = []
            if exam_date:
                # استفاده از func.date برای مقایسه فقط تاریخ (بدون ساعت)
                grades_today = db.query(Grade).filter(
                    Grade.student_id == student.id,
                    Grade.class_id == class_id,
                    Grade.lesson_id == lesson_id,
                    func.date(Grade.exam_date) == exam_date
                ).all()
                print(f"Student {student.full_name}: found {len(grades_today)} grades for date {exam_date}")
            else:
                # اگر تاریخ انتخاب نشده، همه نمرات را نشان بده
                grades_today = db.query(Grade).filter(
                    Grade.student_id == student.id,
                    Grade.class_id == class_id,
                    Grade.lesson_id == lesson_id
                ).all()
            
            # ساخت لیست نمرات
            grades_list = []
            for g in grades_today:
                grades_list.append({
                    "id": g.id,
                    "exam_type": g.exam_type,
                    "score": g.score,
                    "exam_date": g.exam_date.isoformat() if g.exam_date else None,
                    "created_at": g.created_at.isoformat() if g.created_at else None
                })
            
            # ====== میانگین تجمعی (تا تاریخ جاری) ======
            cumulative_grades = db.query(Grade).filter(
                Grade.student_id == student.id,
                Grade.class_id == class_id,
                Grade.lesson_id == lesson_id
            )
            if exam_date:
                cumulative_grades = cumulative_grades.filter(func.date(Grade.exam_date) <= exam_date)
            cumulative_grades = cumulative_grades.all()
            
            average = None
            if cumulative_grades:
                total = sum(g.score for g in cumulative_grades)
                average = round(total / len(cumulative_grades), 2)
            
            # حضور غیاب
            attendance = None
            if exam_date:
                attendance_record = db.query(Attendance).filter(
                    Attendance.class_id == class_id,
                    Attendance.lesson_id == lesson_id,
                    Attendance.student_id == student.id,
                    Attendance.date == exam_date
                ).first()
                if attendance_record:
                    attendance = attendance_record.status
            
            result.append({
                "id": student.id,
                "full_name": student.full_name,
                "username": student.username,
                "email": student.email or "",
                "phone": student.phone,
                "parent_phone": student.parent_phone,
                "grade": student.grade,
                "grades": grades_list,
                "average": average,
                "attendance_status": attendance
            })
    
    return result

@router.post("/attendance")
async def record_attendance(
    attendance: AttendanceRecord,
    current_user: dict = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    teacher_id = current_user.get("user_id")
    school_id = current_user.get("school_id")
    
    # بررسی دسترسی‌ها
    teacher_class = db.query(TeacherClass).filter(
        TeacherClass.teacher_id == teacher_id,
        TeacherClass.class_id == attendance.class_id,
        TeacherClass.school_id == school_id
    ).first()
    
    if not teacher_class:
        raise HTTPException(status_code=403, detail="شما به این کلاس دسترسی ندارید")
    
    teacher_lesson = db.query(TeacherLesson).filter(
        TeacherLesson.teacher_id == teacher_id,
        TeacherLesson.class_id == attendance.class_id,
        TeacherLesson.lesson_id == attendance.lesson_id,
        TeacherLesson.school_id == school_id
    ).first()
    
    if not teacher_lesson:
        raise HTTPException(status_code=403, detail="شما به این درس دسترسی ندارید")
    
    # بررسی وجود دانش‌آموز در کلاس
    enrollment = db.query(Enrollment).filter(
        Enrollment.class_id == attendance.class_id,
        Enrollment.student_id == attendance.student_id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="دانش‌آموز در این کلاس ثبت‌نام نشده است")
    
    # ثبت یا بروزرسانی
    existing = db.query(Attendance).filter(
        Attendance.class_id == attendance.class_id,
        Attendance.lesson_id == attendance.lesson_id,
        Attendance.student_id == attendance.student_id,
        Attendance.date == attendance.date
    ).first()
    
    if existing:
        existing.status = attendance.status
        existing.updated_at = datetime.utcnow()
    else:
        new_attendance = Attendance(
            school_id=school_id,
            class_id=attendance.class_id,
            lesson_id=attendance.lesson_id,
            student_id=attendance.student_id,
            date=attendance.date,
            status=attendance.status,
            recorded_by=teacher_id
        )
        db.add(new_attendance)
    
    db.commit()
    
    return {"message": "حضور غیاب با موفقیت ثبت شد", "success": True}
# ========== ثبت نمره ==========

@router.post("/grade")
async def record_grade(
    grade: GradeRecord,
    current_user: dict = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    teacher_id = current_user.get("user_id")
    school_id = current_user.get("school_id")
    
    # بررسی دسترسی‌ها
    teacher_class = db.query(TeacherClass).filter(
        TeacherClass.teacher_id == teacher_id,
        TeacherClass.class_id == grade.class_id,
        TeacherClass.school_id == school_id
    ).first()
    
    if not teacher_class:
        raise HTTPException(status_code=403, detail="شما به این کلاس دسترسی ندارید")
    
    teacher_lesson = db.query(TeacherLesson).filter(
        TeacherLesson.teacher_id == teacher_id,
        TeacherLesson.class_id == grade.class_id,
        TeacherLesson.lesson_id == grade.lesson_id,
        TeacherLesson.school_id == school_id
    ).first()
    
    if not teacher_lesson:
        raise HTTPException(status_code=403, detail="شما به این درس دسترسی ندارید")
    
    enrollment = db.query(Enrollment).filter(
        Enrollment.class_id == grade.class_id,
        Enrollment.student_id == grade.student_id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="دانش‌آموز در این کلاس ثبت‌نام نشده است")
    
    # تبدیل رشته تاریخ به آبجکت تاریخ
    exam_date_obj = None
    if grade.exam_date:
        try:
            exam_date_obj = datetime.strptime(grade.exam_date, '%Y-%m-%d').date()
            print(f"=== DEBUG: Saving grade with date: {exam_date_obj}")
        except ValueError as e:
            print(f"=== DEBUG: Date conversion error: {e}")
    
    # بررسی تکراری نبودن
    existing = db.query(Grade).filter(
        Grade.class_id == grade.class_id,
        Grade.lesson_id == grade.lesson_id,
        Grade.student_id == grade.student_id,
        Grade.exam_type == grade.exam_type,
        Grade.exam_date == exam_date_obj
    ).first()
    
    if existing:
        existing.score = grade.score
        existing.updated_at = datetime.utcnow()
        print(f"=== DEBUG: Updated existing grade for student {grade.student_id}")
    else:
        new_grade = Grade(
            school_id=school_id,
            class_id=grade.class_id,
            lesson_id=grade.lesson_id,
            student_id=grade.student_id,
            exam_type=grade.exam_type,
            score=grade.score,
            exam_date=exam_date_obj,
            recorded_by=teacher_id
        )
        db.add(new_grade)
        print(f"=== DEBUG: Created new grade for student {grade.student_id} with date {exam_date_obj}")
    
    db.commit()
    
    # برگرداندن نمرات به‌روز شده برای تاریخ جاری
    return {"message": "نمره با موفقیت ثبت شد", "success": True}

@router.get("/my-classes")
async def get_my_classes(
    current_user: dict = Depends(require_role("teacher")),
    db: Session = Depends(get_db)
):
    teacher_id = current_user.get("user_id")
    school_id = current_user.get("school_id")
    
    # دریافت کلاس‌های معلم از جدول TeacherClass
    teacher_classes = db.query(TeacherClass).filter(
        TeacherClass.teacher_id == teacher_id,
        TeacherClass.school_id == school_id
    ).all()
    
    result = []
    for tc in teacher_classes:
        cls = db.query(Class).filter(
            Class.id == tc.class_id,
            Class.school_id == school_id,
            Class.is_active == True
        ).first()
        
        if cls:
            # دریافت درس‌هایی که معلم در این کلاس تدریس می‌کند
            teacher_lessons = db.query(TeacherLesson).filter(
                TeacherLesson.teacher_id == teacher_id,
                TeacherLesson.class_id == cls.id
            ).all()
            
            # اگر معلم در این کلاس درسی دارد، کلاس را نمایش بده
            if teacher_lessons:
                # دریافت لیست درس‌ها
                lessons_list = []
                for tl in teacher_lessons:
                    lesson = db.query(Lesson).filter(
                        Lesson.id == tl.lesson_id,
                        Lesson.is_active == True
                    ).first()
                    if lesson:
                        lessons_list.append({
                            "id": lesson.id,
                            "name": lesson.name,
                            "schedule": lesson.schedule
                        })
                
                # دریافت تعداد دانش‌آموزان کلاس
                students_count = db.query(Enrollment).filter(
                    Enrollment.class_id == cls.id
                ).count()
                
                result.append({
                    "id": cls.id,
                    "name": cls.name,
                    "code": cls.code,
                    "grade": cls.grade,
                    "students_count": students_count,
                    "teacher_lessons": lessons_list  # ← لیست درس‌ها را اضافه کنید
                })
    
    return result