"""
SmartAttend AI / CampusAI - SQLite Schema Sync & Migration
Ensures all required columns and tables exist in SQLite smartattend.db.
"""

import sqlite3
import os
from app.database import Base, engine, SessionLocal
import app.models.institution
from app.services.institution_service import seed_institutions_directory

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "smartattend.db")

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Update students table
    student_cols = [c[1] for c in cursor.execute("PRAGMA table_info(students)").fetchall()]
    if "parent_relationship" not in student_cols:
        cursor.execute("ALTER TABLE students ADD COLUMN parent_relationship TEXT DEFAULT 'Parent'")
        print("[MIGRATE] Added parent_relationship to students")

    # 2. Update ai_call_logs table
    call_cols = [c[1] for c in cursor.execute("PRAGMA table_info(ai_call_logs)").fetchall()]
    needed_call_cols = [
        ("job_id", "TEXT"),
        ("college_id", "TEXT"),
        ("parent_id", "TEXT"),
        ("attendance_record_id", "TEXT"),
        ("idempotency_key", "TEXT"),
        ("preferred_language", "TEXT DEFAULT 'en'"),
        ("call_mode", "TEXT DEFAULT 'simulation'"),
        ("provider_call_id", "TEXT"),
        ("attempt_count", "INTEGER DEFAULT 1"),
        ("max_attempts", "INTEGER DEFAULT 3"),
        ("parent_verified", "BOOLEAN DEFAULT 0"),
        ("ai_classification", "TEXT"),
        ("actual_absence_reason", "TEXT"),
        ("transcript", "TEXT"),
        ("failure_reason", "TEXT"),
        ("call_start_time", "TIMESTAMP"),
        ("call_end_time", "TIMESTAMP"),
        ("created_at", "TIMESTAMP"),
        ("updated_at", "TIMESTAMP"),
    ]

    for col_name, col_type in needed_call_cols:
        if col_name not in call_cols:
            cursor.execute(f"ALTER TABLE ai_call_logs ADD COLUMN {col_name} {col_type}")
            print(f"[MIGRATE] Added {col_name} to ai_call_logs")

    # 3. Check attendance_sessions table
    sess_cols = [c[1] for c in cursor.execute("PRAGMA table_info(attendance_sessions)").fetchall()]
    needed_sess_cols = [
        ("finalized_at", "TIMESTAMP"),
    ]
    for col_name, col_type in needed_sess_cols:
        if col_name not in sess_cols:
            cursor.execute(f"ALTER TABLE attendance_sessions ADD COLUMN {col_name} {col_type}")
            print(f"[MIGRATE] Added {col_name} to attendance_sessions")

    conn.commit()
    conn.close()
    print("[MIGRATE] Database schema sync completed successfully.")

    # 4. Create any newly registered SQLAlchemy tables (e.g. institutions)
    Base.metadata.create_all(bind=engine)
    print("[MIGRATE] SQLAlchemy tables ensured (institutions, requests, logs).")

    with SessionLocal() as db:
        seeded = seed_institutions_directory(db)
        print(f"[MIGRATE] Seeded {seeded} official institutions.")

if __name__ == "__main__":
    migrate()
