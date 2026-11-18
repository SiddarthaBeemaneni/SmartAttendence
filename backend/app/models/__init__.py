"""
SmartAttend AI / CampusAI - Database Models Registry
"""

from app.database import Base, engine
from app.models.university import University
from app.models.student import Student
from app.models.attendance import Subject, AttendanceSession, AttendanceRecord, AICallLog

# Ensure all tables are created in the database
Base.metadata.create_all(bind=engine)
