"""Abstract base interface for all scoring models.

★ ML INTEGRATION POINT ★

To integrate a trained ML model into SentinelExam:

1. Create a new file in this `scoring/` directory (e.g., `my_keystroke_model.py`)
2. Subclass `ScoringModelInterface`
3. Implement the `score()` and `get_evidence()` methods
4. Register your class in `app/config.py` or swap it in `fusion.py`

The scoring pipeline will call your model's `score()` method with:
- `live_data`: The current time-window's features (dict)
- `baseline_data`: The student's enrollment baseline (dict, optional)

Your model must return a float between 0.0 (normal) and 1.0 (anomalous).
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class ScoringModelInterface(ABC):
    """Abstract interface that all scoring models must implement.
    
    This is the contract between the SentinelExam scoring pipeline and
    any ML model. The system ships with heuristic stubs — replace them
    with trained models for production accuracy.
    """

    @abstractmethod
    async def score(
        self,
        live_data: Dict[str, Any],
        baseline_data: Optional[Dict[str, Any]] = None,
    ) -> float:
        """Compute a risk score for a single time window.

        Args:
            live_data: Features extracted from the current time window.
            baseline_data: Student's enrollment baseline for comparison.

        Returns:
            Float between 0.0 (completely normal) and 1.0 (highly anomalous).
        """
        ...

    @abstractmethod
    def get_evidence(self) -> Dict[str, Any]:
        """Return human-readable evidence explaining the last computed score.

        Returns:
            Dictionary with explanation keys like 'reason', 'details',
            'metrics_compared', etc. This is shown to instructors in the
            evidence panel when reviewing flagged sessions.
        """
        ...

    def _clamp(self, value: float) -> float:
        """Clamp a value to [0.0, 1.0] range."""
        return max(0.0, min(1.0, value))
