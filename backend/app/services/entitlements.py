from sqlalchemy.orm import Session
from app.db.models import Subscription, UserChannel
from app.config import PLAN_LIMITS

def get_limit(plan: str) -> int:
    return PLAN_LIMITS.get(plan, 1)

def can_link_more_channels(db: Session, user_id: int) -> tuple[bool, int, int]:
    sub = db.query(Subscription).filter_by(user_id=user_id).first()
    plan = (sub.plan if sub else "basic")
    status = (sub.status if sub else "active")
    allowed = (sub.channel_limit if sub else get_limit(plan))
    linked = db.query(UserChannel).filter_by(user_id=user_id).count()
    ok = (status == "active") and (linked < allowed)
    return ok, linked, allowed
