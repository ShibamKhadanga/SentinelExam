"""Face-match confidence scorer.

★ ML INTEGRATION POINT 2 ★

STUB IMPLEMENTATION: Uses cosine similarity between face embedding vectors.
The embeddings are extracted client-side by MediaPipe and sent as JSON arrays.

TO REPLACE: Swap with a trained face-verification model such as:
- FaceNet (triplet loss trained)
- ArcFace / CosFace
- Any model producing 128/512-dim face embeddings
  
The replacement model could run server-side (receive raw images) or
client-side (send embeddings only, as the current stub does).
"""

from typing import Any, Dict, Optional
import numpy as np

from app.scoring.base import ScoringModelInterface


class FaceScorer(ScoringModelInterface):
    """Compares live webcam face embedding against enrollment reference."""

    def __init__(self):
        self._last_evidence: Dict[str, Any] = {}

    async def score(
        self,
        live_data: Dict[str, Any],
        baseline_data: Optional[Dict[str, Any]] = None,
    ) -> float:
        """Score face match using cosine similarity.

        Expected live_data keys:
            face_detected (bool), face_count (int), face_embedding (list[float])

        Expected baseline_data keys:
            face_embedding (list[float]) — from enrollment
        """
        face_detected = live_data.get("face_detected", False)
        face_count = live_data.get("face_count", 0)

        # Case 1: No face detected — high risk
        if not face_detected or face_count == 0:
            self._last_evidence = {
                "reason": "No face detected in snapshot",
                "face_detected": False,
                "face_count": 0,
                "score": 0.85,
            }
            return 0.85

        # Case 2: Multiple faces detected — moderate risk
        if face_count > 1:
            self._last_evidence = {
                "reason": f"Multiple faces detected ({face_count})",
                "face_detected": True,
                "face_count": face_count,
                "score": 0.7,
            }
            return 0.7

        # Case 3: Compare embeddings
        live_embedding = live_data.get("face_embedding")
        base_embedding = baseline_data.get("face_embedding") if baseline_data else None

        if not live_embedding or not base_embedding:
            self._last_evidence = {
                "reason": "Missing embedding data for comparison",
                "score": 0.5,
            }
            return 0.5

        try:
            live_vec = np.array(live_embedding, dtype=float)
            base_vec = np.array(base_embedding, dtype=float)

            # Cosine similarity
            dot_product = np.dot(live_vec, base_vec)
            norm_product = np.linalg.norm(live_vec) * np.linalg.norm(base_vec)

            if norm_product == 0:
                similarity = 0.0
            else:
                similarity = float(dot_product / norm_product)

            # similarity 1.0 = perfect match → risk 0.0
            # similarity 0.0 = no match → risk 1.0
            # Threshold: similarity < 0.6 is suspicious
            risk_score = self._clamp(1.0 - similarity)

            self._last_evidence = {
                "reason": "Face embedding comparison",
                "cosine_similarity": round(similarity, 4),
                "face_detected": True,
                "face_count": face_count,
                "match_quality": (
                    "high" if similarity > 0.8 else
                    "medium" if similarity > 0.6 else
                    "low"
                ),
                "score": round(risk_score, 4),
            }

            return risk_score

        except Exception as e:
            self._last_evidence = {"reason": f"Scoring error: {str(e)}", "score": 0.5}
            return 0.5

    def get_evidence(self) -> Dict[str, Any]:
        return self._last_evidence
