# Telemetry & Feedback Collector for Controlled Learning (Phase 4 Python Core)
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime
from ai.ela.memory.session import PrivacySanitizer


class TelemetryRecord(BaseModel):
    record_id: str
    session_id: str
    user_id: Optional[str] = None
    action_type: str
    prediction_made: Optional[Dict[str, Any]] = None
    actual_outcome: Optional[Dict[str, Any]] = None
    error_delta: Optional[float] = None
    user_rating: Optional[int] = None
    feedback_text: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class FeedbackCollector:
    _records: List[TelemetryRecord] = []

    @classmethod
    def record_feedback(
        cls,
        session_id: str,
        action_type: str,
        user_id: Optional[str] = None,
        prediction_made: Optional[Dict[str, Any]] = None,
        actual_outcome: Optional[Dict[str, Any]] = None,
        user_rating: Optional[int] = None,
        feedback_text: Optional[str] = None,
    ) -> TelemetryRecord:
        # Sanitize any accidental secrets
        clean_pred = PrivacySanitizer.sanitize_dict(prediction_made) if prediction_made else None
        clean_outcome = PrivacySanitizer.sanitize_dict(actual_outcome) if actual_outcome else None

        error_delta = None
        if clean_pred and clean_outcome and "predicted" in clean_pred and "actual" in clean_outcome:
            try:
                error_delta = abs(float(clean_pred["predicted"]) - float(clean_outcome["actual"]))
            except Exception:
                pass

        record = TelemetryRecord(
            record_id=f"telemetry-{len(cls._records) + 1}",
            session_id=session_id,
            user_id=user_id,
            action_type=action_type,
            prediction_made=clean_pred,
            actual_outcome=clean_outcome,
            error_delta=error_delta,
            user_rating=user_rating,
            feedback_text=feedback_text,
        )
        cls._records.append(record)
        return record

    @classmethod
    def get_candidate_training_dataset(cls) -> List[Dict[str, Any]]:
        dataset = []
        for r in cls._records:
            if r.prediction_made and r.actual_outcome and "actual" in r.actual_outcome:
                dataset.append({
                    "features": r.prediction_made.get("features", {}),
                    "target": r.actual_outcome["actual"],
                    "source": "governed_telemetry",
                })
        return dataset
