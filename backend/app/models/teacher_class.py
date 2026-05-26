from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from ..database import Base


class TeacherClass(Base):
    __tablename__ = "teacher_classes"
    
    id = Column(Integer, primary_key=True, index=True)
    school_id = Column(Integer, ForeignKey("schools.id"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # هر ترکیب (معلم، کلاس) فقط یک بار ثبت شود
    __table_args__ = (
        UniqueConstraint('teacher_id', 'class_id', name='unique_teacher_class'),
    )
    
    def __repr__(self):
        return f"<TeacherClass teacher={self.teacher_id} class={self.class_id}>"