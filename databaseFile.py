import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# Grab the Neon connection string from .env
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# Create the engine that talks to Neon DB
engine = create_engine(SQLALCHEMY_DATABASE_URL)

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