# ELA Governed Learning Events (Phase 12.4)
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid

from ai.ela.learning.outcomes import ElaVerifiedOutcome, OutcomeManager, ProvenanceType
from ai.ela.learning.deviations import DeviationResult, ErrorCategory
from ai.ela.memory.session import PrivacySanitizer


class ElaLearningEvent(BaseModel):
    """
    Standardized, governed learning event traceable back to an authoritative verified outcome.
    RULE: Every learning event must have a valid source_outcome_id. No orphan learning events allowed.
    """
    event_id: str = Field(default_factory=lambda: f"le-{uuid.uuid4().hex[:8]}")
    source_outcome_id: str
    operation_id: Optional[str] = None
    booking_id: Optional[str] = None

    model_name: str
    model_version: str = "v1.0"
    feature_version: str = "f-v1.0"

    metric_name: str
    prediction: Any
    actual_value: Any
    residual_or_error: Optional[float] = None
    error_category: ErrorCategory = "UNKNOWN"

    domain: str = "LOGISTICS"
    corridor: Optional[str] = None
    role: str = "GUEST"

    context: Dict[str, Any] = Field(default_factory=dict)
    provenance: ProvenanceType = "REAL_OPERATIONAL"

    confidence_if_calibrated: Optional[float] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())


class LearningEventManager:
    """
    Manages generation, sanitization, storage, and retrieval of governed learning events.
    Enforces strict real vs synthetic stream separation and zero-secret data hygiene.
    """
    _events: Dict[str, ElaLearningEvent] = {}
    _events_by_outcome: Dict[str, List[str]] = {}  # outcome_id -> event_ids

    @classmethod
    def reset_for_testing(cls):
        cls._events.clear()
        cls._events_by_outcome.clear()

    @classmethod
    def create_learning_event_from_deviation(
        cls,
        outcome: ElaVerifiedOutcome,
        deviation: DeviationResult,
        model_name: str = "ETAPredictionModel",
        model_version: str = "v1.0",
        feature_version: str = "f-v1.0",
        domain: str = "LOGISTICS",
        corridor: Optional[str] = None,
        role: str = "GUEST",
        confidence: Optional[float] = None,
    ) -> Optional[ElaLearningEvent]:
        # 1. Authority Check: Never create learning events from unverified or quarantined outcomes
        if outcome.verification_status not in ["VERIFIED"]:
            return None

        # 2. Extract and sanitize context (zero secret persistence)
        raw_ctx = {
            **outcome.expected_result,
            **outcome.actual_result,
            **deviation.details,
        }
        clean_ctx = PrivacySanitizer.sanitize_dict(raw_ctx)

        # 3. Derive corridor if not supplied
        if not corridor:
            origin = outcome.expected_result.get("origin") or outcome.expected_result.get("pickupLocation")
            destination = outcome.expected_result.get("destination")
            if origin and destination:
                corridor = f"{origin}-{destination}"

        event = ElaLearningEvent(
            source_outcome_id=outcome.outcome_id,
            operation_id=outcome.operation_id,
            booking_id=outcome.booking_id,
            model_name=model_name,
            model_version=model_version,
            feature_version=feature_version,
            metric_name=deviation.metric_name,
            prediction=deviation.predicted_value,
            actual_value=deviation.actual_value,
            residual_or_error=deviation.residual_or_error,
            error_category=deviation.error_category,
            domain=domain,
            corridor=corridor,
            role=role,
            context=clean_ctx,
            provenance=outcome.provenance,
            confidence_if_calibrated=confidence,
        )

        cls._events[event.event_id] = event
        cls._events_by_outcome.setdefault(outcome.outcome_id, []).append(event.event_id)

        # Link in OutcomeManager
        OutcomeManager.link_prediction_and_learning_event(
            outcome_id=outcome.outcome_id,
            model_name=model_name,
            model_version=model_version,
            learning_event_id=event.event_id,
        )

        return event

    @classmethod
    def get_event(cls, event_id: str) -> Optional[ElaLearningEvent]:
        return cls._events.get(event_id)

    @classmethod
    def get_events_for_outcome(cls, outcome_id: str) -> List[ElaLearningEvent]:
        event_ids = cls._events_by_outcome.get(outcome_id, [])
        return [cls._events[eid] for eid in event_ids if eid in cls._events]

    @classmethod
    def get_events(
        cls,
        model_name: Optional[str] = None,
        corridor: Optional[str] = None,
        provenance: Optional[ProvenanceType] = None,
        error_category: Optional[ErrorCategory] = None,
    ) -> List[ElaLearningEvent]:
        results = list(cls._events.values())
        if model_name:
            results = [e for e in results if e.model_name == model_name]
        if corridor:
            results = [e for e in results if e.corridor == corridor]
        if provenance:
            results = [e for e in results if e.provenance == provenance]
        if error_category:
            results = [e for e in results if e.error_category == error_category]
        return results

    @classmethod
    def get_all_events(cls) -> List[ElaLearningEvent]:
        return list(cls._events.values())
