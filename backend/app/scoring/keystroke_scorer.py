"""Keystroke dynamics anomaly scorer.

★ ML INTEGRATION POINT 1 ★

STUB IMPLEMENTATION: Uses normalized Euclidean distance between live typing
features and enrollment baseline. This is a simple statistical comparison.

TO REPLACE: Swap with a trained model such as:
- One-class SVM trained on per-student keystroke baseline
- Autoencoder that learns normal typing patterns
- Isolation Forest for anomaly detection
- LSTM/Transformer for sequential keystroke modeling

The model should be trained on enrollment data and detect deviations
that indicate a different person is typing.
"""

from typing import Any, Dict, Optional
import numpy as np

from app.scoring.base import ScoringModelInterface


class KeystrokeScorer(ScoringModelInterface):
    """Compares live keystroke dynamics against enrollment baseline."""

    def __init__(self):
        self._last_evidence: Dict[str, Any] = {}

    async def score(
        self,
        live_data: Dict[str, Any],
        baseline_data: Optional[Dict[str, Any]] = None,
    ) -> float:
        """Score keystroke anomaly using statistical distance.

        Expected live_data keys:
            mean_dwell, std_dwell, mean_flight, std_flight, wpm, key_count

        Expected baseline_data keys (from enrollment):
            mean_dwell, std_dwell, mean_flight, std_flight, wpm
        """
        if not baseline_data or not live_data:
            self._last_evidence = {"reason": "Insufficient data", "score": 0.0}
            return 0.0

        # Skip if too few keystrokes in this window
        key_count = live_data.get("key_count", 0)
        if key_count < 5:
            self._last_evidence = {
                "reason": "Too few keystrokes for reliable comparison",
                "key_count": key_count,
                "score": 0.0,
            }
            return 0.0

        feature_keys = ["mean_dwell", "std_dwell", "mean_flight", "std_flight"]

        try:
            live_vec = np.array([live_data.get(k, 0.0) for k in feature_keys], dtype=float)
            base_vec = np.array([baseline_data.get(k, 0.0) for k in feature_keys], dtype=float)

            # Avoid division by zero — use baseline as scale
            scale = np.where(base_vec > 0, base_vec, 1.0)
            normalized_diff = np.abs(live_vec - base_vec) / scale

            # Euclidean distance of normalized differences
            distance = float(np.linalg.norm(normalized_diff))

            # Map to [0, 1] using sigmoid-like scaling
            # distance of 0 → score ~0, distance of 2+ → score ~0.9+
            risk_score = float(1.0 - np.exp(-distance * 0.8))

            # Also factor in WPM deviation
            live_wpm = live_data.get("wpm", 0)
            base_wpm = baseline_data.get("wpm", 1)
            if base_wpm > 0:
                wpm_ratio = abs(live_wpm - base_wpm) / base_wpm
                wpm_penalty = min(wpm_ratio * 0.3, 0.3)  # Max 0.3 penalty from WPM
                risk_score = min(1.0, risk_score * 0.7 + wpm_penalty)

            risk_score = self._clamp(risk_score)

            self._last_evidence = {
                "reason": "Keystroke pattern deviation from baseline",
                "distance": round(distance, 4),
                "live_features": {k: round(live_data.get(k, 0), 2) for k in feature_keys},
                "baseline_features": {k: round(baseline_data.get(k, 0), 2) for k in feature_keys},
                "live_wpm": round(live_wpm, 1),
                "baseline_wpm": round(base_wpm, 1),
                "key_count": key_count,
                "score": round(risk_score, 4),
            }

            return risk_score

        except Exception as e:
            self._last_evidence = {"reason": f"Scoring error: {str(e)}", "score": 0.5}
            return 0.5

    def get_evidence(self) -> Dict[str, Any]:
        return self._last_evidence
