from fastapi import APIRouter

router = APIRouter()

@router.get("")
def get_me():
    # Stub: replace with Cognito JWT verification and DB lookup
    return {"id":"dev-user-1","email":"dev@example.com"}

@router.get("/channels")
def get_my_channels():
    # Stub: replace with DB-driven channels linked to user
    return [{"channel_id": "UC_DEMO_123", "title": "Demo Channel"}]