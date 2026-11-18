"""
SmartAttend AI / CampusAI - Database Models Registry
"""

from app.database import Base, engine, SessionLocal
from app.models.university import University
from app.models.student import Student
from app.models.attendance import Subject, AttendanceSession, AttendanceRecord, AICallLog
from app.models.college import College
from app.models.user import User
from app.models.otp import EmailOTP
from app.models.seeds import seed_verified_colleges

# Ensure all tables are created in the database
Base.metadata.create_all(bind=engine)

# Auto-seed verified colleges if empty
try:
    with SessionLocal() as db:
        seed_verified_colleges(db)
except Exception as e:
    print(f"[Seed Warning] Could not auto-seed colleges: {e}")
