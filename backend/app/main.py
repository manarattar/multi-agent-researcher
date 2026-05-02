import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_tables
from app.routers import research, history, followup

app = FastAPI(title="Multi-Agent Research Assistant", version="1.0.0")

_settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origins_list,
    allow_credentials=_settings.cors_origins_list != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(research.router, prefix="/api")
app.include_router(history.router, prefix="/api")
app.include_router(followup.router, prefix="/api")


@app.on_event("startup")
def startup():
    os.makedirs("./data", exist_ok=True)
    create_tables()


@app.get("/api/health")
def health():
    return {"status": "ok"}
