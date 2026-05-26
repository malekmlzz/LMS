from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from ..database import Base


class TeacherLesson(Base):
    __tablename__ = "teacher_lessons"
    
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # هر ترکیب (معلم، کلاس، درس) فقط یک بار ثبت شود
    __table_args__ = (
        UniqueConstraint('teacher_id', 'class_id', 'lesson_id', name='unique_teacher_class_lesson'),
    )
    
    def __repr__(self):
        return f"<TeacherLesson teacher={self.teacher_id} class={self.class_id} lesson={self.lesson_id}>"