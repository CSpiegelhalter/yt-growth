import os, urllib.parse
from fastapi import APIRouter, HTTPException
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

YOUTUBE_SCOPES = [
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
]

router = APIRouter()

def build_flow() -> Flow:
    return Flow.from_client_config(
        {
            "web": {
                "client_id": os.environ.get("GOOGLE_CLIENT_ID"),
                "client_secret": os.environ.get("GOOGLE_CLIENT_SECRET"),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [os.environ.get("OAUTH_REDIRECT_URI")],
            }
        },
        scopes=YOUTUBE_SCOPES,
    )

@router.get("/google/start")
def google_start():
    flow = build_flow()
    flow.redirect_uri = os.environ.get("OAUTH_REDIRECT_URI")
    auth_url, state = flow.authorization_url(
        access_type="offline",
        include_granted_scopes="true",
        prompt="consent"
    )
    return {"auth_url": auth_url, "state": state}

@router.get("/google/callback")
def google_callback(code: str | None = None, state: str | None = None):
    if not code:
        raise HTTPException(400, "Missing code")
    flow = build_flow()
    flow.redirect_uri = os.environ.get("OAUTH_REDIRECT_URI")
    flow.fetch_token(code=code)
    creds = flow.credentials

    # Fetch channel id + title
    data_api = build("youtube", "v3", credentials=creds, cache_discovery=False)
    resp = data_api.channels().list(part="id,snippet", mine=True).execute()
    if not resp.get("items"):
        raise HTTPException(400, "No channel found")
    item = resp["items"][0]
    channel_id = item["id"]
    title = item["snippet"]["title"]

    # TODO: encrypt & store creds.refresh_token, map to user, upsert channels + user_channels
    # For MVP we only return the info so you can verify the flow works locally.
    return {
        "channel_id": channel_id,
        "title": title,
        "has_refresh": bool(creds.refresh_token),
        "access_token_len": len(creds.token) if creds.token else 0
    }