"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # ─── Database ───
    DATABASE_URL: str = "postgresql+asyncpg://sentinel:sentinel_pass@db:5432/sentinelexam"

    # ─── Auth ───
    JWT_SECRET: str = "change-me-to-a-long-random-string-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ─── CORS ───
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    # ─── Snapshots ───
    SNAPSHOT_DIR: str = "./storage/snapshots"
    SNAPSHOT_RETENTION_DAYS: int = 30

    # ─── Scoring Weights (must sum to 1.0) ───
    WEIGHT_KEYSTROKE: float = 0.35
    WEIGHT_FACE: float = 0.40
    WEIGHT_GAZE: float = 0.25

    # ─── Risk Thresholds ───
    RISK_THRESHOLD_LOW: float = 0.3
    RISK_THRESHOLD_MEDIUM: float = 0.6
    RISK_THRESHOLD_HIGH: float = 0.8

    # ─── Telemetry ───
    SNAPSHOT_INTERVAL_SECONDS: int = 45
    TELEMETRY_WINDOW_SECONDS: int = 30

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
