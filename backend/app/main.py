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
)

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
app.include_router(college.router)
app.include_router(email_verification.router)
app.include_router(auth.router)
app.include_router(university.router)
app.include_router(university_profile.router)
app.include_router(students.router)
app.include_router(attendance.router)


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
        "auth": "enabled",
        "university_registration": "enabled",
        "university_profile": "enabled",
        "student_management": "enabled",
    }
