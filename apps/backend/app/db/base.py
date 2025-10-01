import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.db.models import Base

# app/db/base.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings

def _normalize_url(url: str) -> str:
    url = (url or "").strip().strip('"').strip("'")
    if not url:
        raise RuntimeError("DATABASE_URL is empty or unset.")
    return url

print(f'\n\n\n\n{settings.DATABASE_URL}\n\n\n\n\n pleeeeeeeez')
DATABASE_URL = _normalize_url(settings.DATABASE_URL)

# psycopg3 driver name is `psycopg`; pip install psycopg or psycopg[binary]
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# create tables on boot for MVP; switch to Alembic later
def init_db():
    Base.metadata.create_all(bind=engine)
