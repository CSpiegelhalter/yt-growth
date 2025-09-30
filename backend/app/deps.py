from fastapi import Header, HTTPException
from app.config import settings
from app.db.base import SessionLocal
from app.db.models import User

def _ensure_dev_user() -> int:
    """Create user id=1 for dev if it doesn't exist; return the id."""
    db = SessionLocal()
    try:
        u = db.query(User).filter_by(id=1).first()
        if not u:
            u = User(id=1, email="dev@example.com")
            db.add(u)
            db.commit()
        return 1
    finally:
        db.close()

# In prod you’ll replace this with Cognito JWT verification that returns a real user id.
def get_current_user_id(authorization: str | None = Header(None)) -> int:
    if settings.DEV_MODE:
        return _ensure_dev_user()
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    # TODO: verify Cognito JWT, look up/create User, return its id
    raise HTTPException(501, "JWT verification not implemented")
