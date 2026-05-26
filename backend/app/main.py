from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .routers import auth, teacher, student, class_management, user, teacher_panel, student_panel



# ایجاد جداول دیتابیس
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    debug=settings.DEBUG
)

# ========== تنظیمات CORS ==========
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8081",
        "http://localhost:19006",
        "http://127.0.0.1:8000",
        "http://127.0.0.1:8081",
        "*"  # برای تست
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ثبت روت‌ها
app.include_router(auth.router, prefix="/api/v1")
app.include_router(teacher.router, prefix="/api/v1")
app.include_router(student.router, prefix="/api/v1")
app.include_router(class_management.router, prefix="/api/v1")
app.include_router(user.router, prefix="/api/v1")
app.include_router(teacher_panel.router, prefix="/api/v1")
app.include_router(student_panel.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}