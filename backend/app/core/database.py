"""
Database Configuration and Session Management
PostgreSQL with SQLAlchemy ORM
"""

from typing import Generator
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session, declarative_base
from sqlalchemy.pool import QueuePool

from app.core.config import settings


# Create SQLAlchemy engine with connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,  # Recycle connections after 30 minutes
    pool_pre_ping=True,  # Verify connection is alive before using
)


# Session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# Base class for all models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency.
    Yields a database session and ensures it's closed after use.

    Usage:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Event listener to set search_path for PostgreSQL schemas if needed
@event.listens_for(engine, "connect")
def set_search_path(dbapi_connection, connection_record):
    """
    Set PostgreSQL search_path on new connections.
    Ensures consistent schema resolution.
    """
    cursor = dbapi_connection.cursor()
    cursor.execute("SET search_path TO public")
    cursor.close()


def init_db() -> None:
    """
    Initialize database tables.
    Should be called on application startup.

    Note: In production, use Alembic migrations instead.
    """
    # Import all models to ensure they're registered with Base
    from app.models import user  # noqa: F401

    Base.metadata.create_all(bind=engine)


def check_db_connection() -> bool:
    """
    Check if database connection is working.
    Returns True if connection is successful, False otherwise.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
