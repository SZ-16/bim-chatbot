import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# Grab the Neon connection string from .env
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Create the engine that talks to Neon DB
# UPDATED: Added pool_pre_ping and pool_recycle for Neon's serverless connections
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,  # Verifies connection is still alive before querying
    pool_recycle=300     # Refreshes idle connections every 5 minutes
)

# Create a session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# This is the base class for our database tables
Base = declarative_base()

# Dependency function to get the database session in our routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()