"""
SmartAttend AI / CampusAI - Resilient Database Connection Setup

Connects to PostgreSQL as primary database.
If PostgreSQL is not running or unreachable, seamlessly falls back to 
SQLite ('smartattend.db') so all development, models, tables, and tenant
operations remain 100% operational.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings

# Attempt primary Postgres connection, fallback to SQLite if offline
db_url = settings.DATABASE_URL

try:
    if db_url.startswith("postgres"):
        # Test connection briefly
        test_engine = create_engine(db_url, pool_pre_ping=True, connect_args={"connect_timeout": 2})
        with test_engine.connect() as conn:
            pass
        engine = test_engine
        print(f"[Database] Connected to PostgreSQL: {db_url}")
    else:
        engine = create_engine(db_url)
except Exception as e:
    # Graceful SQLite fallback for development
    sqlite_url = "sqlite:///./smartattend.db"
    engine = create_engine(
        sqlite_url,
        echo=False,
        connect_args={"check_same_thread": False},
    )
    print(f"[Database] PostgreSQL offline ({e}). Using resilient SQLite fallback: {sqlite_url}")


SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
