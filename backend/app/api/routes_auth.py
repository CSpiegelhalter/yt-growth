import os
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.config import settings
from app.db.base import SessionLocal
from app.db.models import Channel, UserChannel, OAuthToken
from app.deps import get_current_user_id
from app.services.entitlements import can_link_more_channels

YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
]

router = APIRouter()

def db_session():
    db = SessionLocal()
    try: yield db
    finally: db.close()

def build_flow() -> Flow:
    return Flow.from_client_config(
        {
            "web": {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET.get_secret_value(),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.OAUTH_REDIRECT_URI],
            }
        },
        scopes=YOUTUBE_SCOPES,
    )

@router.get("/google/start")
def google_start():
    flow = build_flow()
    flow.redirect_uri = settings.OAUTH_REDIRECT_URI
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent"
    )
    # Redirect the browser straight to Google
    return RedirectResponse(auth_url)

@router.get("/google/callback")
def google_callback(code: str | None = None, state: str | None = None,
                    user_id: int = Depends(get_current_user_id),
                    db: Session = Depends(db_session)):
    if not code:
        raise HTTPException(400, "Missing code")

    # entitlements: can this user add another channel?
    ok, linked, allowed = can_link_more_channels(db, user_id)
    if not ok:
        raise HTTPException(status_code=402, detail=f"Channel limit reached ({linked}/{allowed}). Upgrade to link more.")

    flow = build_flow()
    flow.redirect_uri = settings.OAUTH_REDIRECT_URI
    flow.fetch_token(code=code)
    creds = flow.credentials

    # Fetch channel id + title
    data_api = build("youtube", "v3", credentials=creds, cache_discovery=False)
    resp = data_api.channels().list(part="id,snippet", mine=True).execute()
    if not resp.get("items"):
        raise HTTPException(400, "No channel found")
    item = resp["items"][0]
    ytid = item["id"]
    title = item["snippet"]["title"]

    # Upsert channel
    ch = db.query(Channel).filter_by(channel_id=ytid).first()
    if not ch:
        ch = Channel(channel_id=ytid, title=title)
        db.add(ch); db.commit(); db.refresh(ch)

    # Link user<->channel
    if not db.query(UserChannel).filter_by(user_id=user_id, channel_id=ch.id).first():
        db.add(UserChannel(user_id=user_id, channel_id=ch.id))
        db.commit()

    # Store/rotate token (encrypt refresh in real impl)
    if creds.refresh_token:
        token = db.query(OAuthToken).filter_by(provider="google", channel_id=ch.id).first()
        if not token:
            token = OAuthToken(provider="google", channel_id=ch.id, refresh_token_enc=creds.refresh_token, access_token_hint=(creds.token or "")[:12])
            db.add(token)
        else:
            token.refresh_token_enc = creds.refresh_token
            token.access_token_hint = (creds.token or "")[:12]
        db.commit()

    # After successful link, send them back to the app
    return RedirectResponse(settings.FRONTEND_AFTER_LINK_URL)
