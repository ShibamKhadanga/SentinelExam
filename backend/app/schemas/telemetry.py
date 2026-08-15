"""Telemetry request/response schemas."""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


class KeystrokeEventData(BaseModel):
    key: str
    dwell_time: float
    flight_time: Optional[float] = None
    timestamp: float


class MouseEventData(BaseModel):
    x: float
    y: float
    timestamp: float
    event_type: str = "move"  # "move", "click", "idle"


class TabEventData(BaseModel):
    event_type: str  # "blur", "focus"
    timestamp: float
    duration: Optional[float] = None


class SnapshotData(BaseModel):
    image_base64: str
    face_detected: bool = False
    face_count: int = 0
    face_embedding: Optional[List[float]] = None
    gaze_direction: Optional[Dict[str, Any]] = None
    captured_at: float


class TelemetryBatch(BaseModel):
    """A batch of telemetry data sent from the client."""
    session_id: UUID
    window_index: int
    window_start: float  # Unix timestamp
    window_end: float
    keystrokes: List[KeystrokeEventData] = []
    mouse_events: List[MouseEventData] = []
    tab_events: List[TabEventData] = []
    snapshots: List[SnapshotData] = []
    bytes_size: Optional[int] = None  # Payload size for bandwidth tracking


class TelemetryWindowResponse(BaseModel):
    id: UUID
    window_index: int
    window_start: datetime
    window_end: datetime
    keystroke_score: Optional[float] = None
    face_score: Optional[float] = None
    gaze_score: Optional[float] = None
    composite_score: Optional[float] = None
    is_flagged: bool
    keystroke_features: Optional[Dict[str, Any]] = None
    mouse_features: Optional[Dict[str, Any]] = None
    tab_events: Optional[List[Dict[str, Any]]] = None
    evidence: Optional[Dict[str, Any]] = None
    snapshot_count: int = 0

    model_config = {"from_attributes": True}
