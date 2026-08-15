"""Gaze/attention heuristic scorer.

★ ML INTEGRATION POINT 3 ★

STUB IMPLEMENTATION: Uses eye landmark positions from MediaPipe to estimate
gaze direction. Computes a pupil-to-eye-corner ratio and flags when the
student appears to be looking away from the screen.

TO REPLACE: Swap with a dedicated gaze-estimation model such as:
- GazeNet
- MPIIGaze
- ETH-XGaze
- Any model that outputs gaze angles (yaw/pitch) from facial landmarks or raw images

These models provide calibrated gaze directions rather than simple ratios,
enabling much more accurate off-screen detection.
"""

from typing import Any, Dict, Optional

from app.scoring.base import ScoringModelInterface


class GazeScorer(ScoringModelInterface):
    """Estimates gaze direction from eye landmark ratios."""

    # Threshold: if gaze ratio deviates beyond this, consider "looking away"
    GAZE_THRESHOLD = 0.35

    def __init__(self):
        self._last_evidence: Dict[str, Any] = {}

    async def score(
        self,
        live_data: Dict[str, Any],
        baseline_data: Optional[Dict[str, Any]] = None,
    ) -> float:
        """Score gaze attention from snapshot gaze data.

        Expected live_data keys:
            snapshots: list of gaze readings for this window, each containing:
                - left_eye_ratio (float): 0.0=far left, 0.5=center, 1.0=far right
                - right_eye_ratio (float): same scale
                - is_looking_away (bool): pre-computed by client-side MediaPipe
                - face_detected (bool)

        baseline_data: Not used for gaze scoring (no personalized baseline needed).
        """
        snapshots = live_data.get("snapshots", [])

        if not snapshots:
            self._last_evidence = {
                "reason": "No snapshot gaze data available",
                "score": 0.0,
            }
            return 0.0

        total_snapshots = len(snapshots)
        looking_away_count = 0
        no_face_count = 0
        gaze_deviations = []

        for snap in snapshots:
            if not snap.get("face_detected", False):
                no_face_count += 1
                continue

            left_ratio = snap.get("left_eye_ratio", 0.5)
            right_ratio = snap.get("right_eye_ratio", 0.5)

            # Compute deviation from center (0.5)
            left_dev = abs(left_ratio - 0.5)
            right_dev = abs(right_ratio - 0.5)
            avg_dev = (left_dev + right_dev) / 2

            gaze_deviations.append(avg_dev)

            # Check if looking away based on threshold or client flag
            if snap.get("is_looking_away", False) or avg_dev > self.GAZE_THRESHOLD:
                looking_away_count += 1

        # Calculate risk based on proportion of "looking away" snapshots
        valid_snapshots = total_snapshots - no_face_count
        if valid_snapshots == 0:
            risk_score = 0.5  # Can't assess without valid snapshots
        else:
            away_ratio = looking_away_count / valid_snapshots
            # Gentle curve: occasional glances are fine, sustained looking away is suspicious
            risk_score = self._clamp(away_ratio ** 0.7)

        # Penalty for no-face snapshots
        if total_snapshots > 0:
            no_face_ratio = no_face_count / total_snapshots
            risk_score = self._clamp(risk_score + no_face_ratio * 0.3)

        avg_deviation = (
            round(sum(gaze_deviations) / len(gaze_deviations), 4)
            if gaze_deviations else 0.0
        )

        self._last_evidence = {
            "reason": "Gaze direction analysis",
            "total_snapshots": total_snapshots,
            "looking_away_count": looking_away_count,
            "no_face_count": no_face_count,
            "average_gaze_deviation": avg_deviation,
            "away_ratio": round(
                looking_away_count / max(valid_snapshots, 1), 4
            ),
            "score": round(risk_score, 4),
        }

        return risk_score

    def get_evidence(self) -> Dict[str, Any]:
        return self._last_evidence
