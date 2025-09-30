from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes_audit import router as audit_router
from app.api.routes_auth import router as auth_router
from app.api.routes_me import router as me_router
from app.db.base import init_db
from app.api.routes_billing import router as billing_router

app = FastAPI(title="YT Growth API", version="0.1.0")

# Allow local Next.js during dev; in prod, tighten this or route via BFF.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/healthz")
def healthz():
    return {"ok": True}

app.include_router(me_router, prefix="/me", tags=["me"])
app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(audit_router, prefix="/audit", tags=["audit"])
app.include_router(billing_router, tags=["billing"])

@app.on_event("startup")
def _startup_db():
    init_db()