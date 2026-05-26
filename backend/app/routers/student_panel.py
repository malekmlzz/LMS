from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

from ..database import get_db
from ..models.user import User
from ..models.class_model import Class, Lesson, Enrollment
from ..models.teacher_lesson import TeacherLesson
from ..models.grade import Grade
from ..models.attendance import Attendance
from ..core.dependencies import get_current_user

router = APIRouter(prefix="/student", tags=["Student Panel"])


# ========== مدل‌ها ==========

class LessonInfo(BaseModel):
    id: int
    name: str
    code: Optional[str] = None
    schedule: Optional[str] = None
    teacher_name: Optional[str] = None
    class_name: Optional[str] = None
    credits: Optional[int] = 3
    day: Optional[str] = None
    time: Optional[str] = None


# ========== دریافت داشبورد دانش‌آموز ==========

@router.get("/my-dashboard")
async def get_student_dashboard(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("user_id")
    school_id = current_user.get("school_id")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role != "student":
        raise HTTPException(status_code=403, detail="دسترسی فقط برای دانش‌آموزان")
    
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == user_id,
        Enrollment.school_id == school_id
    ).first()
    
    if not enrollment:
        return {"class": None, "lessons": []}
    
    class_obj = db.query(Class).filter(
        Class.id == enrollment.class_id,
        Class.is_active == True
    ).first()
    
    if not class_obj:
        return {"class": None, "lessons": []}
    
    lessons = db.query(Lesson).filter(
        Lesson.class_id == class_obj.id,
        Lesson.school_id == school_id,
        Lesson.is_active == True
    ).all()
    
    lessons_list = []
    for lesson in lessons:
        teacher_lesson = db.query(TeacherLesson).filter(
            TeacherLesson.class_id == class_obj.id,
            TeacherLesson.lesson_id == lesson.id,
            TeacherLesson.school_id == school_id
        ).first()
        
        teacher_name = None
        if teacher_lesson:
            teacher = db.query(User).filter(User.id == teacher_lesson.teacher_id).first()
            teacher_name = teacher.full_name if teacher else None
        
        lessons_list.append({
            "id": lesson.id,
            "name": lesson.name,
            "code": lesson.code,
            "schedule": lesson.schedule,
            "teacher_name": teacher_name
        })
    
    return {
        "class": {
            "id": class_obj.id,
            "name": class_obj.name,
            "code": class_obj.code,
            "grade": class_obj.grade
        },
        "lessons": lessons_list
    }


# ========== دریافت نمرات یک درس ==========

@router.get("/lessons/{lesson_id}/grades")
async def get_lesson_grades(
    lesson_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("user_id")
    school_id = current_user.get("school_id")
    
    print(f"=== DEBUG: Getting grades for user {user_id}, lesson {lesson_id}")
    
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == user_id,
        Enrollment.school_id == school_id
    ).first()
    
    if not enrollment:
        print("=== DEBUG: No enrollment found")
        return []
    
    print(f"=== DEBUG: Found enrollment for class {enrollment.class_id}")
    
    # دریافت نمرات
    grades = db.query(Grade).filter(
        Grade.student_id == user_id,
        Grade.class_id == enrollment.class_id,
        Grade.lesson_id == lesson_id
    ).all()
    
    print(f"=== DEBUG: Found {len(grades)} grades")
    for g in grades:
        print(f"    id={g.id}, exam_type={g.exam_type}, score={g.score}, lesson_id={g.lesson_id}, exam_date={g.exam_date}")
    
    return [
        {
            "id": g.id,
            "exam_type": g.exam_type,
            "score": g.score,
            "exam_date": g.exam_date.isoformat() if g.exam_date else None,
            "created_at": g.created_at
        }
        for g in grades
    ]


# ========== دریافت حضور غیاب یک درس ==========

@router.get("/lessons/{lesson_id}/attendances")
async def get_lesson_attendances(
    lesson_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("user_id")
    school_id = current_user.get("school_id")
    
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == user_id,
        Enrollment.school_id == school_id
    ).first()
    
    if not enrollment:
        return []
    
    attendances = db.query(Attendance).filter(
        Attendance.student_id == user_id,
        Attendance.class_id == enrollment.class_id,
        Attendance.lesson_id == lesson_id
    ).all()
    
    return [
        {
            "id": a.id,
            "date": a.date,
            "status": a.status
        }
        for a in attendances
    ]


# ========== دریافت لیست درس‌های دانش‌آموز (برای سازگاری) ==========

@router.get("/my-lessons", response_model=List[LessonInfo])
async def get_my_lessons(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("user_id")
    school_id = current_user.get("school_id")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role != "student":
        raise HTTPException(status_code=403, detail="دسترسی فقط برای دانش‌آموزان")
    
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == user_id,
        Enrollment.school_id == school_id
    ).first()
    
    if not enrollment:
        return []
    
    class_obj = db.query(Class).filter(
        Class.id == enrollment.class_id,
        Class.school_id == school_id,
        Class.is_active == True
    ).first()
    
    if not class_obj:
        return []
    
    lessons = db.query(Lesson).filter(
        Lesson.class_id == class_obj.id,
        Lesson.school_id == school_id,
        Lesson.is_active == True
    ).all()
    
    result = []
    for lesson in lessons:
        teacher_lesson = db.query(TeacherLesson).filter(
            TeacherLesson.class_id == class_obj.id,
            TeacherLesson.lesson_id == lesson.id,
            TeacherLesson.school_id == school_id
        ).first()
        
        teacher_name = None
        if teacher_lesson:
            teacher = db.query(User).filter(User.id == teacher_lesson.teacher_id).first()
            teacher_name = teacher.full_name if teacher else None
        
        day = None
        time = None
        if lesson.schedule:
            parts = lesson.schedule.split(' ')
            if len(parts) >= 2:
                day = parts[0]
                time = parts[1]
        
        result.append(LessonInfo(
            id=lesson.id,
            name=lesson.name,
            code=lesson.code,
            schedule=lesson.schedule,
            teacher_name=teacher_name,
            class_name=class_obj.name,
            credits=3,
            day=day,
            time=time
        ))
    
    return result


@router.get("/report-card")
async def get_report_card(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("user_id")
    school_id = current_user.get("school_id")
    
    # بررسی نقش کاربر
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role != "student":
        raise HTTPException(status_code=403, detail="دسترسی فقط برای دانش‌آموزان")
    
    # پیدا کردن کلاس دانش‌آموز
    enrollment = db.query(Enrollment).filter(
        Enrollment.student_id == user_id,
        Enrollment.school_id == school_id
    ).first()
    
    if not enrollment:
        return {
            "overall_average": 0,
            "weighted_average": 0,
            "overall_attendance": 0,
            "total_lessons": 0,
            "rank": "ثبت‌نام نشده",
            "top_lesson": None,
            "weak_lesson": None,
            "report_cards": []
        }
    
    # دریافت درس‌های کلاس
    lessons = db.query(Lesson).filter(
        Lesson.class_id == enrollment.class_id,
        Lesson.school_id == school_id,
        Lesson.is_active == True
    ).all()
    
    report_cards = []
    total_weighted_score = 0
    total_credits = 0
    total_attendance_rate = 0
    
    for lesson in lessons:
        # دریافت نمرات این درس
        grades = db.query(Grade).filter(
            Grade.student_id == user_id,
            Grade.class_id == enrollment.class_id,
            Grade.lesson_id == lesson.id
        ).all()
        
        # محاسبه میانگین نمرات درس
        average = 0
        if grades:
            total = sum(g.score for g in grades)
            average = round(total / len(grades), 2)
        
        # دریافت حضور غیاب این درس
        attendances = db.query(Attendance).filter(
            Attendance.student_id == user_id,
            Attendance.class_id == enrollment.class_id,
            Attendance.lesson_id == lesson.id
        ).all()
        
        total_classes = len(attendances)
        present_count = sum(1 for a in attendances if a.status == 'present')
        attendance_rate = round((present_count / total_classes) * 100, 1) if total_classes > 0 else 0
        
        # نام معلم
        teacher_lesson = db.query(TeacherLesson).filter(
            TeacherLesson.class_id == enrollment.class_id,
            TeacherLesson.lesson_id == lesson.id,
            TeacherLesson.school_id == school_id
        ).first()
        
        teacher_name = None
        if teacher_lesson:
            teacher = db.query(User).filter(User.id == teacher_lesson.teacher_id).first()
            teacher_name = teacher.full_name if teacher else None
        
        report_cards.append({
            "lesson_id": lesson.id,
            "lesson_name": lesson.name,
            "teacher": teacher_name,
            "credits": 3,
            "average": average,
            "attendance_rate": attendance_rate,
            "total_classes": total_classes
        })
        
        total_weighted_score += average * 3
        total_credits += 3
        total_attendance_rate += attendance_rate
    
    total_lessons = len(lessons)
    overall_average = round(total_weighted_score / total_credits, 2) if total_credits > 0 else 0
    overall_attendance = round(total_attendance_rate / total_lessons, 1) if total_lessons > 0 else 0
    
    # تعیین رتبه بر اساس میانگین
    if overall_average >= 18:
        rank = "عالی"
    elif overall_average >= 16:
        rank = "خیلی خوب"
    elif overall_average >= 14:
        rank = "خوب"
    elif overall_average >= 12:
        rank = "قابل قبول"
    else:
        rank = "نیاز به تلاش بیشتر"
    
    # درس برتر و درس ضعیف
    sorted_by_average = sorted(report_cards, key=lambda x: x["average"], reverse=True)
    top_lesson = sorted_by_average[0] if sorted_by_average else None
    weak_lesson = sorted_by_average[-1] if sorted_by_average else None
    
    return {
        "overall_average": overall_average,
        "weighted_average": overall_average,
        "overall_attendance": overall_attendance,
        "total_lessons": total_lessons,
        "rank": rank,
        "top_lesson": top_lesson,
        "weak_lesson": weak_lesson,
        "report_cards": report_cards
    }