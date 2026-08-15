"""WebSocket manager for real-time dashboard updates."""

import json
from typing import Dict, List, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["websocket"])


class ConnectionManager:
    """Manages WebSocket connections grouped by exam_id."""

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, exam_id: str):
        await websocket.accept()
        if exam_id not in self.active_connections:
            self.active_connections[exam_id] = []
        self.active_connections[exam_id].append(websocket)

    def disconnect(self, websocket: WebSocket, exam_id: str):
        if exam_id in self.active_connections:
            self.active_connections[exam_id] = [
                ws for ws in self.active_connections[exam_id] if ws != websocket
            ]
            if not self.active_connections[exam_id]:
                del self.active_connections[exam_id]

    async def broadcast_to_exam(self, exam_id: str, message: Dict[str, Any]):
        """Broadcast a message to all connections watching a specific exam."""
        if exam_id not in self.active_connections:
            return

        disconnected = []
        for websocket in self.active_connections[exam_id]:
            try:
                await websocket.send_json(message)
            except Exception:
                disconnected.append(websocket)

        # Clean up disconnected clients
        for ws in disconnected:
            self.disconnect(ws, exam_id)

    async def broadcast_all(self, message: Dict[str, Any]):
        """Broadcast to all connected clients regardless of exam."""
        for exam_id in list(self.active_connections.keys()):
            await self.broadcast_to_exam(exam_id, message)


# Global manager instance
manager = ConnectionManager()


@router.websocket("/ws/dashboard/{exam_id}")
async def websocket_endpoint(websocket: WebSocket, exam_id: str):
    """WebSocket endpoint for instructor dashboard real-time updates."""
    await manager.connect(websocket, exam_id)
    try:
        while True:
            # Keep connection alive; receive heartbeats or commands
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, exam_id)


@router.websocket("/ws/dashboard")
async def websocket_all_endpoint(websocket: WebSocket):
    """WebSocket endpoint for monitoring all exams."""
    await manager.connect(websocket, "__all__")
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket, "__all__")
