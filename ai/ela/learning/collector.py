# Telemetry & Operational Learning Collector (Phase 7 Real-World Learning & Continuous Intelligence)
import math
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from ai.ela.memory.session import PrivacySanitizer
from ai.ela.data.schemas import (
    LearningEvent,
    ExplicitUserFeedback,
    ImplicitOperationalFeedback,
    BusinessOutcomeFeedback,
    DatasetType,
    DatasetPartition,
    UserRoleType,
    FeedbackSourceType,
)


class TelemetryRecord(BaseModel):
    """
    Backwards-compatible telemetry record.
    """
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
    """
    Central Feedback & Learning Event Collector.
    Captures Explicit User Feedback, Implicit Operational Telemetry, and Business Outcomes.
    Strictly enforces zero-secret security and prevents credential persistence.
    """
    _records: List[TelemetryRecord] = []
    _learning_events: List[LearningEvent] = []
    _explicit_feedbacks: List[ExplicitUserFeedback] = []
    _operational_feedbacks: List[ImplicitOperationalFeedback] = []
    _business_outcomes: List[BusinessOutcomeFeedback] = []

    @classmethod
    def record_learning_event(
        cls,
        operation_type: str,
        prediction_type: str,
        features: Dict[str, Any],
        predicted_value: Any,
        actual_value: Optional[Any] = None,
        user_role: UserRoleType = "GUEST",
        outcome: Optional[str] = None,
        feedback_text: Optional[str] = None,
        user_rating: Optional[int] = None,
        route_context: Optional[str] = None,
        model_name: str = "GenericModel",
        model_version: str = "v1.0",
        confidence: float = 0.90,
        dataset_type: DatasetType = "REAL_OPERATIONAL",
        dataset_partition: DatasetPartition = "TRAIN",
    ) -> LearningEvent:
        # Zero-secret sanitization
        clean_features = PrivacySanitizer.sanitize_dict(features) if features else {}
        clean_feedback = PrivacySanitizer.sanitize_text(feedback_text) if feedback_text else None

        error_delta = None
        error_percentage = None
        if actual_value is not None and isinstance(actual_value, (int, float)) and isinstance(predicted_value, (int, float)):
            try:
                error_delta = abs(float(actual_value) - float(predicted_value))
                denom = max(1e-6, abs(float(predicted_value)))
                error_percentage = (error_delta / denom) * 100.0
            except Exception:
                pass

        event = LearningEvent(
            event_id=f"event-{len(cls._learning_events) + 1}",
            user_role=user_role,
            operation_type=operation_type,
            prediction_type=prediction_type,
            features=clean_features,
            predicted_value=predicted_value,
            actual_value=actual_value,
            error_delta=round(error_delta, 2) if error_delta is not None else None,
            error_percentage=round(error_percentage, 2) if error_percentage is not None else None,
            outcome=outcome,
            feedback_text=clean_feedback,
            user_rating=user_rating,
            route_context=route_context,
            model_name=model_name,
            model_version=model_version,
            confidence=confidence,
            dataset_partition=dataset_partition,
            dataset_type=dataset_type,
        )
        cls._learning_events.append(event)
        return event

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
        clean_text = PrivacySanitizer.sanitize_text(feedback_text) if feedback_text else None

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
            feedback_text=clean_text,
        )
        cls._records.append(record)

        # Mirror into LearningEvent
        if clean_pred and clean_outcome:
            cls.record_learning_event(
                operation_type=action_type,
                prediction_type=clean_pred.get("prediction_type", "GENERIC_PREDICTION"),
                features=clean_pred.get("features", {}),
                predicted_value=clean_pred.get("predicted"),
                actual_value=clean_outcome.get("actual"),
                user_role=clean_pred.get("role", "GUEST"),
                outcome=clean_outcome.get("outcome", "COMPLETED"),
                feedback_text=clean_text,
                user_rating=user_rating,
                route_context=clean_pred.get("route"),
                model_name=clean_pred.get("model_name", "DemandPredictionModel"),
                model_version=clean_pred.get("model_version", "v1.0"),
                dataset_type="REAL_OPERATIONAL",
            )

        return record

    @classmethod
    def record_explicit_user_feedback(cls, feedback: ExplicitUserFeedback) -> ExplicitUserFeedback:
        clean_text = PrivacySanitizer.sanitize_text(feedback.feedback_text)
        sanitized = ExplicitUserFeedback(
            session_id=feedback.session_id,
            user_id=feedback.user_id,
            user_role=feedback.user_role,
            model_name=feedback.model_name,
            rating=feedback.rating,
            feedback_category=feedback.feedback_category,
            feedback_text=clean_text,
            timestamp=feedback.timestamp,
        )
        cls._explicit_feedbacks.append(sanitized)
        return sanitized

    @classmethod
    def record_operational_feedback(cls, feedback: ImplicitOperationalFeedback) -> ImplicitOperationalFeedback:
        cls._operational_feedbacks.append(feedback)
        # Also register learning event
        cls.record_learning_event(
            operation_type="OPERATIONAL_TRIP",
            prediction_type=feedback.model_name,
            features={"route": feedback.route, "vehicle_type": feedback.vehicle_type},
            predicted_value=feedback.predicted_value,
            actual_value=feedback.actual_value,
            route_context=feedback.route,
            model_name=feedback.model_name,
            model_version=feedback.model_version,
            dataset_type="REAL_OPERATIONAL",
        )
        return feedback

    @classmethod
    def record_operational_outcome(
        cls,
        outcome_event_type: str,
        actual_value: Any,
        predicted_value: Optional[Any] = None,
        model_name: str = "ETAPredictionModel",
        model_version: str = "v1.2",
        prediction_id: Optional[str] = None,
        route_context: Optional[str] = None,
        features: Optional[Dict[str, Any]] = None,
        dataset_type: DatasetType = "REAL_OPERATIONAL",
        operational_status: str = "COMPLETED",
    ) -> LearningEvent:
        """
        Records an authoritative real-world operational outcome and links it to a prediction trace if provided.
        Supports ETA_OUTCOME, FREIGHT_OUTCOME, PRICE_OUTCOME, DEMAND_OUTCOME, CANCELLATION_OUTCOME, DELIVERY_OUTCOME, VEHICLE_MATCH_OUTCOME.
        """
        if prediction_id:
            from ai.ela.learning.trace_store import PredictionTraceStore
            try:
                PredictionTraceStore.link_outcome(
                    prediction_id=prediction_id,
                    actual_value=float(actual_value) if isinstance(actual_value, (int, float)) else 1.0,
                    outcome_status=operational_status,
                    dataset_type=dataset_type,
                )
            except Exception:
                pass

        return cls.record_learning_event(
            operation_type=outcome_event_type,
            prediction_type=outcome_event_type,
            features=features or {},
            predicted_value=predicted_value,
            actual_value=actual_value,
            outcome=operational_status,
            route_context=route_context,
            model_name=model_name,
            model_version=model_version,
            dataset_type=dataset_type,
        )

    @classmethod
    def record_business_outcome(cls, outcome: BusinessOutcomeFeedback) -> BusinessOutcomeFeedback:
        cls._business_outcomes.append(outcome)
        return outcome

    @classmethod
    def get_events_for_model(
        cls,
        model_name: str,
        partition: Optional[DatasetPartition] = None,
        dataset_type: Optional[DatasetType] = None,
    ) -> List[LearningEvent]:
        events = [e for e in cls._learning_events if e.model_name.lower() == model_name.lower()]
        if partition:
            events = [e for e in events if e.dataset_partition == partition]
        if dataset_type:
            events = [e for e in events if e.dataset_type == dataset_type]
        return events

    @classmethod
    def get_candidate_training_dataset(cls, model_name: Optional[str] = None) -> List[Dict[str, Any]]:
        dataset = []
        events = cls._learning_events
        if model_name:
            events = [e for e in events if e.model_name.lower() == model_name.lower()]

        for e in events:
            if e.actual_value is not None:
                dataset.append({
                    "event_id": e.event_id,
                    "features": e.features,
                    "target": e.actual_value,
                    "actual_value": e.actual_value,
                    "predicted_value": e.predicted_value,
                    "route": e.route_context,
                    "source": "governed_learning_events",
                    "timestamp": e.timestamp,
                    "dataset_type": e.dataset_type,
                    "dataset_partition": e.dataset_partition,
                })
        return dataset

    @classmethod
    def get_all_learning_events(cls) -> List[LearningEvent]:
        return list(cls._learning_events)

    @classmethod
    def clear_records(cls):
        """Testing utility to reset telemetry state."""
        cls._records.clear()
        cls._learning_events.clear()
        cls._explicit_feedbacks.clear()
        cls._operational_feedbacks.clear()
        cls._business_outcomes.clear()
