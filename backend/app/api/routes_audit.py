from fastapi import APIRouter, HTTPException
from datetime import datetime
from app.db.models import Channel, UserChannel

router = APIRouter()

# TODO: Use this to ensure user has access to audit
def _authorize_channel(db, user_id, channel_id_str):
    ch = db.query(Channel).filter_by(channel_id=channel_id_str).first()
    if not ch: raise HTTPException(404, "Channel not found")
    link = db.query(UserChannel).filter_by(user_id=user_id, channel_id=ch.id).first()
    if not link: raise HTTPException(403, "Not linked to this channel")
    return ch


@router.post("/{channel_id}/refresh")
def refresh_channel(channel_id: str, days: int = 90):
    # TODO: pull analytics for the channel from YouTube Analytics API and store daily metrics
    return {"status": "queued", "channel_id": channel_id, "days": days}

@router.get("/{channel_id}")
def get_audit(channel_id: str):
    # TODO: compute real audit from DB; returning a stub payload for now
    now = datetime.utcnow().isoformat()
    return {
        "channelId": channel_id,
        "computedAt": now,
        "overview": {"healthScore": 78.3, "last28": {"views": 123456, "subsNet": 1234, "uploads": 6}},
        "winners": [{"videoId":"abc123","title":"I Built X in 24 Hours","score":92.1,"why":"High CTR on Browse; strong APV"}],
        "underperformers": [{"videoId":"def456","title":"React vs Vue 2025","score":54.4,"actions":["Shorten intro","Search-leaning title variant"]}],
        "publishingCadence":{"medianDaysBetween":5.0},
        "trafficMix":{"browse":0.52,"search":0.28,"suggested":0.15,"other":0.05},
        "actions":[ "Publish Tue/Thu 2–4pm", "Time-split test titles on next upload" ]
    }