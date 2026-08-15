"""Score fusion service — combines all individual scorer outputs.

This service takes the three individual risk scores (keystroke, face, gaze)
and produces a single composite risk score per time window.

STUB IMPLEMENTATION: Configurable weighted average.

TO REPLACE: Swap with a learned fusion model such as:
- Logistic regression on the score vector
- Gradient-boosted tree (XGBoost/LightGBM)
- Small neural network
- Any model that learns optimal score combination from labeled data
"""

from typing import Any, Dict, Optional

from app.config import settings
from app.scoring.keystroke_scorer import KeystrokeScorer
from app.scoring.face_scorer import FaceScorer
from app.scoring.gaze_scorer import GazeScorer


class FusionService:
    """Combines individual scorer outputs into a composite risk score."""

    def __init__(self):
        self.keystroke_scorer = KeystrokeScorer()
        self.face_scorer = FaceScorer()
        self.gaze_scorer = GazeScorer()
        self._last_evidence: Dict[str, Any] = {}

    async def compute_composite_score(
        self,
        keystroke_data: Dict[str, Any],
        face_data: Dict[str, Any],
        gaze_data: Dict[str, Any],
        baseline_data: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Run all three scorers and fuse into a composite score.

        Args:
            keystroke_data: Per-window keystroke features
            face_data: Per-window face detection/embedding data
            gaze_data: Per-window gaze direction data
            baseline_data: Student's enrollment baseline

        Returns:
            Dict with individual scores, composite score, flag status, and evidence.
        """
        # Run individual scorers
        keystroke_baseline = baseline_data.get("keystroke_baseline") if baseline_data else None
        face_baseline = baseline_data.get("face_baseline") if baseline_data else None

        keystroke_score = await self.keystroke_scorer.score(keystroke_data, keystroke_baseline)
        face_score = await self.face_scorer.score(face_data, face_baseline)
        gaze_score = await self.gaze_scorer.score(gaze_data)

        # Weighted average fusion
        composite = (
            settings.WEIGHT_KEYSTROKE * keystroke_score
            + settings.WEIGHT_FACE * face_score
            + settings.WEIGHT_GAZE * gaze_score
        )
        composite = max(0.0, min(1.0, composite))

        # Determine flag status
        is_flagged = composite >= settings.RISK_THRESHOLD_MEDIUM

        # Risk level label
        if composite < settings.RISK_THRESHOLD_LOW:
            risk_level = "low"
        elif composite < settings.RISK_THRESHOLD_MEDIUM:
            risk_level = "medium"
        elif composite < settings.RISK_THRESHOLD_HIGH:
            risk_level = "high"
        else:
            risk_level = "critical"

        # Collect evidence
        evidence = {
            "keystroke": self.keystroke_scorer.get_evidence(),
            "face": self.face_scorer.get_evidence(),
            "gaze": self.gaze_scorer.get_evidence(),
            "fusion": {
                "weights": {
                    "keystroke": settings.WEIGHT_KEYSTROKE,
                    "face": settings.WEIGHT_FACE,
                    "gaze": settings.WEIGHT_GAZE,
                },
                "method": "weighted_average",
            },
        }

        self._last_evidence = evidence

        return {
            "keystroke_score": round(keystroke_score, 4),
            "face_score": round(face_score, 4),
            "gaze_score": round(gaze_score, 4),
            "composite_score": round(composite, 4),
            "risk_level": risk_level,
            "is_flagged": is_flagged,
            "evidence": evidence,
        }

    def get_evidence(self) -> Dict[str, Any]:
        return self._last_evidence
