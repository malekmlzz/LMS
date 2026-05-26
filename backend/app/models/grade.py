from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class Grade(Base):
    __tablename__ = "grades"
    
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False, index=True)  # اضافه شد
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    exam_type = Column(String(50), nullable=False)  # quiz, homework, midterm, final
    score = Column(Float, nullable=False)
    exam_date = Column(DateTime, nullable=True)
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())