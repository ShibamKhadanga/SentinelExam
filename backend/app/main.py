"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.config import settings

app = FastAPI(
    title="SentinelExam API",
    description="Privacy-preserving behavioral-biometric exam integrity platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ─── CORS ───
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Mount static file serving for snapshots ───
os.makedirs(settings.SNAPSHOT_DIR, exist_ok=True)

# ─── Register API routers ───
from app.api.auth import router as auth_router
from app.api.enrollment import router as enrollment_router
from app.api.exams import router as exams_router
from app.api.sessions import router as sessions_router
from app.api.telemetry import router as telemetry_router
from app.api.dashboard import router as dashboard_router
from app.api.websocket import router as websocket_router

app.include_router(auth_router)
app.include_router(enrollment_router)
app.include_router(exams_router)
app.include_router(sessions_router)
app.include_router(telemetry_router)
app.include_router(dashboard_router)
app.include_router(websocket_router)


@app.get("/")
async def root():
    return {
        "name": "SentinelExam API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "operational",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
