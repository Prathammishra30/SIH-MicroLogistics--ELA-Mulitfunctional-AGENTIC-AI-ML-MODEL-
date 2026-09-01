# Prediction Trace Store & Outcome Linker (Phase 10.1 Real Operational Learning & Autonomous Cognitive Loop)
import os
import uuid
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime
from ai.ela.memory.session import PrivacySanitizer
from ai.ela.data.schemas import DatasetType
from ai.ela.learning.error_analysis import ErrorAnalysisEngine, OperationalDiscrepancy


PredictionType = Literal[
    "ETA_MINUTES",
    "TRANSPORT_COST",
    "SPOT_PRICE",
    "DEMAND_KG",
    "DELAY_RISK",
    "CANCELLATION_RISK",
    "DELIVERY_SUCCESS",
    "VEHICLE_MATCH",
    "GENERIC_PREDICTION",
]


class PredictionRecord(BaseModel):
    """
    Structured, traceable record of an individual model inference.
    Maintains provenance and is later explicitly linkable to an authoritative operational outcome.
    """
    prediction_id: str
    session_id: str
    goal_id: Optional[str] = None
    model_name: str
    model_version: str
    prediction_type: PredictionType
    input_features: Dict[str, Any] = Field(default_factory=dict)
    predicted_value: float
    confidence: float = 0.90
    route_context: Optional[str] = None
    entity_identifiers: Dict[str, Any] = Field(default_factory=dict)
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    status: Literal["PENDING_OUTCOME", "LINKED_TO_OUTCOME", "EXPIRED"] = "PENDING_OUTCOME"
    linked_outcome_id: Optional[str] = None
    actual_value: Optional[float] = None
    signed_error: Optional[float] = None
    absolute_error: Optional[float] = None
    percentage_error: Optional[float] = None


class OutcomeLinkResult(BaseModel):
    """
    Result of linking an authoritative real-world outcome to a previous prediction trace.
    """
    prediction_id: str
    outcome_id: str
    model_name: str
    model_version: str
    predicted_value: float
    actual_value: float
    signed_error: float
    absolute_error: float
    percentage_error: float
    mae_contribution: float
    rmse_contribution: float
    discrepancy: OperationalDiscrepancy
    dataset_type: DatasetType = "REAL_OPERATIONAL"
    linked_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class PredictionTraceStore:
    """
    Central repository for tracking model predictions and linking operational outcomes.
    Enforces non-anonymous telemetry and programmatic error analysis.
    """
    _predictions: Dict[str, PredictionRecord] = {}
    _session_index: Dict[str, List[str]] = {}
    _linked_outcomes: List[OutcomeLinkResult] = []

    @classmethod
    def record_prediction(
        cls,
        session_id: str,
        model_name: str,
        model_version: str,
        prediction_type: PredictionType,
        input_features: Dict[str, Any],
        predicted_value: float,
        goal_id: Optional[str] = None,
        confidence: float = 0.90,
        route_context: Optional[str] = None,
        entity_identifiers: Optional[Dict[str, Any]] = None,
    ) -> PredictionRecord:
        # Zero-secret sanitization
        clean_features = PrivacySanitizer.sanitize_dict(input_features) if input_features else {}
        clean_entities = PrivacySanitizer.sanitize_dict(entity_identifiers) if entity_identifiers else {}

        pred_id = f"pred-{prediction_type.lower()[:3]}-{uuid.uuid4().hex[:8]}"

        record = PredictionRecord(
            prediction_id=pred_id,
            session_id=session_id,
            goal_id=goal_id,
            model_name=model_name,
            model_version=model_version,
            prediction_type=prediction_type,
            input_features=clean_features,
            predicted_value=round(float(predicted_value), 2),
            confidence=round(float(confidence), 3),
            route_context=route_context,
            entity_identifiers=clean_entities,
        )

        cls._predictions[pred_id] = record
        cls._session_index.setdefault(session_id, []).append(pred_id)
        return record

    @classmethod
    def get_prediction(cls, prediction_id: str) -> Optional[PredictionRecord]:
        return cls._predictions.get(prediction_id)

    @classmethod
    def get_predictions_by_session(cls, session_id: str) -> List[PredictionRecord]:
        pred_ids = cls._session_index.get(session_id, [])
        return [cls._predictions[pid] for pid in pred_ids if pid in cls._predictions]

    @classmethod
    def link_outcome(
        cls,
        prediction_id: str,
        actual_value: float,
        outcome_status: str = "COMPLETED",
        dataset_type: DatasetType = "REAL_OPERATIONAL",
        operational_context: Optional[Dict[str, Any]] = None,
    ) -> OutcomeLinkResult:
        pred_record = cls._predictions.get(prediction_id)
        if not pred_record:
            raise ValueError(f"Prediction record with ID '{prediction_id}' not found in trace store.")

        actual = round(float(actual_value), 2)
        predicted = pred_record.predicted_value

        # Programmatic discrepancy calculation
        signed_err = round(actual - predicted, 2)
        abs_err = round(abs(actual - predicted), 2)
        pct_err = round((abs_err / max(1e-6, abs(predicted))) * 100.0, 2)
        mae_contrib = abs_err
        rmse_contrib = round(abs_err ** 2, 2)

        # Update prediction record
        outcome_id = f"outcome-{uuid.uuid4().hex[:8]}"
        pred_record.status = "LINKED_TO_OUTCOME"
        pred_record.linked_outcome_id = outcome_id
        pred_record.actual_value = actual
        pred_record.signed_error = signed_err
        pred_record.absolute_error = abs_err
        pred_record.percentage_error = pct_err

        # Register discrepancy in ErrorAnalysisEngine
        route = pred_record.route_context or pred_record.input_features.get("route")
        if not route and "origin" in pred_record.input_features and "destination" in pred_record.input_features:
            route = f"{pred_record.input_features['origin']}-{pred_record.input_features['destination']}"

        discrepancy = ErrorAnalysisEngine.record_discrepancy(
            session_id=pred_record.session_id,
            model_name=pred_record.model_name,
            model_version=pred_record.model_version,
            target_metric=pred_record.prediction_type,
            predicted_value=predicted,
            actual_value=actual,
            route=route,
            vehicle_type=pred_record.input_features.get("vehicle_type"),
            departure_hour=pred_record.input_features.get("departure_hour"),
            distance_km=pred_record.input_features.get("distance_km"),
            cargo_commodity=pred_record.input_features.get("commodity") or pred_record.input_features.get("product"),
        )

        link_res = OutcomeLinkResult(
            prediction_id=prediction_id,
            outcome_id=outcome_id,
            model_name=pred_record.model_name,
            model_version=pred_record.model_version,
            predicted_value=predicted,
            actual_value=actual,
            signed_error=signed_err,
            absolute_error=abs_err,
            percentage_error=pct_err,
            mae_contribution=mae_contrib,
            rmse_contribution=rmse_contrib,
            discrepancy=discrepancy,
            dataset_type=dataset_type,
        )

        cls._linked_outcomes.append(link_res)
        return link_res

    @classmethod
    def get_all_linked_outcomes(cls) -> List[OutcomeLinkResult]:
        return list(cls._linked_outcomes)

    @classmethod
    def clear_all(cls):
        cls._predictions.clear()
        cls._session_index.clear()
        cls._linked_outcomes.clear()
