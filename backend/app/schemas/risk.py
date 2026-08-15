"""Risk scoring response schemas."""

from pydantic import BaseModel
from typing import Optional, Dict, Any


class RiskScoreResponse(BaseModel):
    keystroke_score: float
    face_score: float
    gaze_score: float
    composite_score: float
    risk_level: str  # "low", "medium", "high", "critical"
    is_flagged: bool
    evidence: Optional[Dict[str, Any]] = None
