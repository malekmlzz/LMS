from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from ..database import Base

class Attendance(Base):
    __tablename__ = "attendances"
    
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False, index=True)  # اضافه شد
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(String(10), nullable=False)
    status = Column(String(20), nullable=False)
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    __table_args__ = (
        UniqueConstraint('class_id', 'lesson_id', 'student_id', 'date', name='unique_class_lesson_student_date'),
    )