"""
SmartAttend AI / CampusAI - FastAPI Main Application

Entry point of backend server.

Configures:
- FastAPI application instance
- CORS middleware
- Health check endpoints
- Auth router (/auth)
- University Registration router (/auth/university)
- University Profile router (/api/university)
- Multi-Tenant Student Management router (/api/students)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import (
    auth,
    university,
    university_profile,
    students,
    attendance,
    college,
    email_verification,
    subjects,
    webhooks,
    institutions,
)
from app.database import Base, engine, SessionLocal
from app.services.institution_service import seed_institutions_directory

# ============================================
# Create the FastAPI app
# ============================================
app = FastAPI(
    title=settings.APP_NAME,
    description="CampusAI / SmartAttend AI - Multi-Lingual Attendance & Parent Calling Platform",
    version="1.0.0",
)

# ============================================
# Configure CORS
# ============================================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:3000",   # Alternative React port
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# Include API Routers
# ============================================
app.include_router(institutions.router)
app.include_router(institutions.admin_router)
app.include_router(college.router)
app.include_router(email_verification.router)
app.include_router(auth.router)
app.include_router(university.router)
app.include_router(university_profile.router)
app.include_router(students.router)
app.include_router(subjects.router)
app.include_router(attendance.router)
app.include_router(webhooks.router)


@app.on_event("startup")
def startup_event():
    """Ensure database tables exist and seed All-India institutions directory."""
    try:
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as db:
            seed_institutions_directory(db)
    except Exception as e:
        print(f"[Startup Warning] Directory auto-seed: {e}")


# ============================================
# Health Check Endpoints
# ============================================
@app.get("/", tags=["Health"])
def root():
    return {
        "message": "Welcome to CampusAI / SmartAttend AI API",
        "status": "running",
        "version": "1.0.0",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "call_mode": settings.CALL_MODE,
        "auth": "enabled",
        "university_registration": "enabled",
        "university_profile": "enabled",
        "student_management": "enabled",
        "subjects": "enabled",
        "attendance": "enabled",
        "ai_calling_queue": "enabled",
        "webhooks": "enabled",
        "institutions_directory": "enabled",
    }
