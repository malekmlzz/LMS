from sqlalchemy.orm import Session
from ..models.school import School
from ..schemas.school import SchoolCreate
from ..core.security import generate_school_code


class SchoolService:
    
    @staticmethod
    def get_by_id(db: Session, school_id: int) -> School | None:
        """دریافت مدرسه با ID"""
        return db.query(School).filter(School.id == school_id, School.is_active == True).first()
    
    @staticmethod
    def get_by_code(db: Session, code: str) -> School | None:
        """دریافت مدرسه با کد"""
        return db.query(School).filter(School.code == code, School.is_active == True).first()
    
    @staticmethod
    def get_by_email(db: Session, email: str) -> School | None:
        """دریافت مدرسه با ایمیل"""
        return db.query(School).filter(School.email == email).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> School | None:
        """دریافت مدرسه با نام"""
        return db.query(School).filter(School.name == name).first()
    
    @staticmethod
    def create_school(db: Session, school_data: SchoolCreate) -> School:
        """ایجاد مدرسه جدید با کد یکتا"""
        # تولید کد یکتا
        school_code = generate_school_code(school_data.name)
        
        # ایجاد مدرسه
        db_school = School(
            name=school_data.name,
            code=school_code,
            address=school_data.address,
            phone=school_data.phone,
            email=school_data.email,
        )
        db.add(db_school)
        db.commit()
        db.refresh(db_school)
        
        return db_school
