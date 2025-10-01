from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.base import SessionLocal
from app.db.models import User, Channel, UserChannel, Subscription
from app.deps import get_current_user_id
from datetime import datetime

router = APIRouter()

def db_session():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def ensure_dev_user(db: Session, uid: int) -> User:
    u = db.query(User).filter_by(id=uid).first()
    if not u:
        u = User(id=uid, email="dev@example.com")
        db.add(u); db.commit()
    return u

@router.get("")
def get_me(user_id: int = Depends(get_current_user_id), db: Session = Depends(db_session)):
    u = ensure_dev_user(db, user_id)
    sub = db.query(Subscription).filter_by(user_id=u.id).first()
    plan = sub.plan if sub else "basic"
    status = sub.status if sub else "active"
    channel_limit = sub.channel_limit if sub else 1
    return {"id": u.id, "email": u.email, "plan": plan, "status": status, "channel_limit": channel_limit}

@router.get("/channels")
def get_my_channels(user_id: int = Depends(get_current_user_id), db: Session = Depends(db_session)):
    ensure_dev_user(db, user_id)
    rows = (
        db.query(Channel)
        .join(UserChannel, UserChannel.channel_id == Channel.id)
        .filter(UserChannel.user_id == user_id)
        .all()
    )
    return [ {"channel_id": c.channel_id, "title": c.title} for c in rows ]

@router.delete("/channels/{channel_id}")
def unlink_channel(channel_id: str, user_id: int = Depends(get_current_user_id), db: Session = Depends(db_session)):
    ensure_dev_user(db, user_id)
    ch = db.query(Channel).filter_by(channel_id=channel_id).first()
    if not ch: raise HTTPException(404, "Channel not found")
    db.query(UserChannel).filter_by(user_id=user_id, channel_id=ch.id).delete()
    # optional: also delete tokens if no one else linked this channel
    remaining = db.query(UserChannel).filter_by(channel_id=ch.id).count()
    if remaining == 0:
        db.delete(ch)
    db.commit()
    return {"ok": True}
