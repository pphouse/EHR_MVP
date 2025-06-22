from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from .config import settings

# Database engine setup
if settings.environment == "test":
    # Use test database for testing
    engine = create_engine(
        settings.test_database_url,
        poolclass=StaticPool,
        connect_args={"check_same_thread": False} if "sqlite" in settings.test_database_url else {}
    )
else:
    # Use main database for development/production
    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=5,
        max_overflow=10
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Database dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all tables"""
    Base.metadata.create_all(bind=engine)


def drop_tables():
    """Drop all tables"""
    Base.metadata.drop_all(bind=engine)