import os, json, hmac, hashlib, time
from fastapi import APIRouter, Header, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from app.db.base import SessionLocal
from app.db.models import Subscription
from app.deps import get_current_user_id
from app.config import settings, PLAN_LIMITS
from datetime import datetime

router = APIRouter()

def db_session():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def _verify_stripe_signature(payload: bytes, sig_header: str | None) -> bool:
    # Minimal placeholder: in real setup, use stripe SDK.
    if not settings.STRIPE_WEBHOOK_SECRET:
        return True  # dev mode
    if not sig_header: return False
    # Simple check: NOT production-grade; replace with stripe.Webhook.construct_event
    parts = dict([kv.split("=",1) for kv in sig_header.split(",") if "=" in kv])
    signature = parts.get("v1")
    if not signature: return False
    digest = hmac.new(settings.STRIPE_WEBHOOK_SECRET.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(digest, signature)

@router.post("/webhooks/stripe")
async def stripe_webhook(request: Request, stripe_signature: str | None = Header(None), db: Session = Depends(db_session)):
    body = await request.body()
    if not _verify_stripe_signature(body, stripe_signature):
        raise HTTPException(400, "Invalid signature")
    event = json.loads(body.decode())

    typ = event.get("type")
    data = event.get("data", {}).get("object", {})

    # You should map Stripe customer/subscription to your user_id.
    # For MVP we apply to the dev user (id=1).
    user_id = 1

    plan = "basic"
    status = "active"
    channel_limit = PLAN_LIMITS[plan]

    if typ in ("customer.subscription.created", "customer.subscription.updated"):
        # Inspect data["items"], price ids, status, etc. For now, pretend plan by price lookup.
        status = data.get("status","active")
        price_id = (data.get("items",{}).get("data",[{}])[0].get("price",{}).get("id"))
        if price_id:
            # TODO: map price_id -> plan
            plan = "pro" if "pro" in price_id else "basic"
        channel_limit = PLAN_LIMITS.get(plan, 1)

    elif typ in ("customer.subscription.deleted", "customer.subscription.cancelled"):
        status = "canceled"
        plan = "basic"
        channel_limit = 0

    sub = db.query(Subscription).filter_by(user_id=user_id).first()
    if not sub:
        sub = Subscription(user_id=user_id, plan=plan, status=status, channel_limit=channel_limit, updated_at=datetime.utcnow())
        db.add(sub)
    else:
        sub.plan = plan
        sub.status = status
        sub.channel_limit = channel_limit
        sub.updated_at = datetime.utcnow()
    db.commit()

    return {"received": True}
