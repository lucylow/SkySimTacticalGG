# app/db.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/agent_data.db")  # change to Postgres in prod

# Create data directory if using SQLite
if DATABASE_URL.startswith("sqlite"):
    db_path = DATABASE_URL.replace("sqlite:///", "")
    if "/" in db_path:
        os.makedirs(os.path.dirname(db_path), exist_ok=True)

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    from app import models  # ensure models are imported before create_all
    from app import models_hitl  # ensure HITL models are imported before create_all
    from app import models_analytics  # ensure analytics models are imported before create_all
    # Prediction models are already imported via models.py
    Base.metadata.create_all(bind=engine)

