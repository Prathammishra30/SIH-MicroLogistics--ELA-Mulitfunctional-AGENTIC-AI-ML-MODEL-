# Error Analysis & Model Discrepancy Diagnostics (Phase 7 Real-World Learning & Continuous Intelligence)
import math
import numpy as np
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime


ErrorCategory = Literal[
    "RANDOM_NOISE",
    "DATA_QUALITY_ISSUE",
    "ROUTE_ANOMALY",
    "WEATHER_ANOMALY",
    "TRAFFIC_ANOMALY",
    "SEASONAL_SHIFT",
    "SYSTEMATIC_MODEL_ERROR",
    "FEATURE_DRIFT",
    "CONCEPT_DRIFT",
    "MODEL_DEGRADATION",
    "DISTRIBUTION_SHIFT",
    "SENSOR_INPUT_ERROR",
    "EXECUTION_VARIANCE",
]


class OperationalDiscrepancy(BaseModel):
    """
    Detailed metric discrepancy record capturing predicted vs actual outcomes.
    """
    discrepancy_id: str
    session_id: str
    model_name: str
    model_version: str
    target_metric: str  # ETA_MINUTES, TRANSPORT_COST, DEMAND_KG, SPOT_PRICE, DELAY_RISK
    predicted_value: float
    actual_value: float
    error_delta: float  # Absolute error |actual - predicted|
    error_percentage: float  # (|actual - predicted| / |predicted|) * 100
    bias_direction: Literal["OVER_PREDICTION", "UNDER_PREDICTION", "ACCURATE"]
    bias_delta: float  # signed (actual - predicted)
    mae_contribution: float
    rmse_contribution: float
    route: Optional[str] = None
    vehicle_type: Optional[str] = None
    departure_hour: Optional[int] = None
    distance_km: Optional[float] = None
    cargo_commodity: Optional[str] = None
    traffic_context: Optional[str] = None
    weather_context: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class ErrorAnalysisDiagnosis(BaseModel):
    discrepancy_id: str
    error_category: ErrorCategory
    confidence: float
    root_cause_explanation: str
    is_retraining_trigger_recommended: bool
    suggested_feature_calibration: Optional[str] = None
    pattern_cluster_key: Optional[str] = None
    recurring_error_count_in_cluster: int = 1
    diagnosed_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class ErrorAnalysisEngine:
    """
    Comprehensive Diagnostic Engine for Operational ML Discrepancies.
    Classifies errors into 10 distinct categories, measures statistical bias & error contributions,
    and identifies recurring corridor/temporal clusters.
    """
    _discrepancy_history: List[OperationalDiscrepancy] = []

    @classmethod
    def record_discrepancy(
        cls,
        session_id: str,
        model_name: str,
        model_version: str,
        target_metric: str,
        predicted_value: float,
        actual_value: float,
        route: Optional[str] = None,
        vehicle_type: Optional[str] = None,
        departure_hour: Optional[int] = None,
        distance_km: Optional[float] = None,
        cargo_commodity: Optional[str] = None,
        traffic_context: Optional[str] = None,
        weather_context: Optional[str] = None,
    ) -> OperationalDiscrepancy:
        delta = abs(actual_value - predicted_value)
        signed_bias = actual_value - predicted_value
        pct = (delta / max(1e-6, abs(predicted_value))) * 100.0

        direction: Literal["OVER_PREDICTION", "UNDER_PREDICTION", "ACCURATE"] = (
            "ACCURATE" if delta < 1e-4 else ("UNDER_PREDICTION" if signed_bias > 0 else "OVER_PREDICTION")
        )

        mae_contrib = delta
        rmse_contrib = delta ** 2

        discrepancy = OperationalDiscrepancy(
            discrepancy_id=f"disc-{len(cls._discrepancy_history) + 1}",
            session_id=session_id,
            model_name=model_name,
            model_version=model_version,
            target_metric=target_metric,
            predicted_value=round(predicted_value, 2),
            actual_value=round(actual_value, 2),
            error_delta=round(delta, 2),
            error_percentage=round(pct, 2),
            bias_direction=direction,
            bias_delta=round(signed_bias, 2),
            mae_contribution=round(mae_contrib, 2),
            rmse_contribution=round(rmse_contrib, 2),
            route=route,
            vehicle_type=vehicle_type,
            departure_hour=departure_hour,
            distance_km=distance_km,
            cargo_commodity=cargo_commodity,
            traffic_context=traffic_context,
            weather_context=weather_context,
        )
        cls._discrepancy_history.append(discrepancy)
        return discrepancy

    @classmethod
    def diagnose_error(cls, discrepancy: OperationalDiscrepancy) -> ErrorAnalysisDiagnosis:
        pct = discrepancy.error_percentage
        
        # 1. Check for Data Quality Issue (extreme impossible values)
        if discrepancy.actual_value <= 0 or (discrepancy.distance_km and discrepancy.distance_km <= 0):
            return ErrorAnalysisDiagnosis(
                discrepancy_id=discrepancy.discrepancy_id,
                error_category="DATA_QUALITY_ISSUE",
                confidence=0.98,
                root_cause_explanation="Invalid non-positive operational telemetry reported by client or sensor.",
                is_retraining_trigger_recommended=False,
                suggested_feature_calibration="Sanitize raw input feed before telemetry ingestion.",
            )

        # 2. Check for Weather / Route Anomaly (severe monsoon, flash flood, cyclones)
        if discrepancy.weather_context and any(w in discrepancy.weather_context.lower() for w in ["severe", "monsoon", "flood", "cyclone", "landslide"]):
            return ErrorAnalysisDiagnosis(
                discrepancy_id=discrepancy.discrepancy_id,
                error_category="ROUTE_ANOMALY",
                confidence=0.92,
                root_cause_explanation=f"Severe weather disturbance ({discrepancy.weather_context}) caused transit deviation on route {discrepancy.route}.",
                is_retraining_trigger_recommended=False,
                suggested_feature_calibration="Incorporate dynamic weather impact coefficient.",
            )

        # 3. Check for Traffic Anomaly (road construction, accident, peak blockade)
        if discrepancy.traffic_context and any(t in discrepancy.traffic_context.lower() for t in ["gridlock", "blockade", "accident", "construction"]):
            return ErrorAnalysisDiagnosis(
                discrepancy_id=discrepancy.discrepancy_id,
                error_category="TRAFFIC_ANOMALY",
                confidence=0.91,
                root_cause_explanation=f"Traffic anomaly ({discrepancy.traffic_context}) caused transient delay on {discrepancy.route}.",
                is_retraining_trigger_recommended=False,
                suggested_feature_calibration="Poll real-time road incident alerts.",
            )

        # 4. Check for Cluster / Corridor Systematic Pattern
        # Cluster key: (model_name, route, vehicle_type, time_window)
        hour_window = f"{discrepancy.departure_hour//3*3}-{(discrepancy.departure_hour//3*3)+3}" if discrepancy.departure_hour is not None else "ALL"
        cluster_key = f"{discrepancy.model_name}:{discrepancy.route}:{discrepancy.vehicle_type or 'ALL'}:{hour_window}"
        
        matching_cluster_discrepancies = [
            d for d in cls._discrepancy_history
            if d.model_name == discrepancy.model_name
            and d.route == discrepancy.route
            and (d.vehicle_type == discrepancy.vehicle_type or not discrepancy.vehicle_type)
        ]

        cluster_count = len(matching_cluster_discrepancies)

        # If 3 or more recurring high-error trips occur in the same cluster
        if cluster_count >= 3:
            avg_cluster_error = sum(d.error_percentage for d in matching_cluster_discrepancies[-3:]) / 3.0
            if avg_cluster_error >= 15.0:
                return ErrorAnalysisDiagnosis(
                    discrepancy_id=discrepancy.discrepancy_id,
                    error_category="SYSTEMATIC_MODEL_ERROR",
                    confidence=0.95,
                    root_cause_explanation=(
                        f"Consistent directional systematic error observed on cluster '{cluster_key}' "
                        f"(3-trip avg error: {avg_cluster_error:.1f}%, bias: {discrepancy.bias_direction}). Model underestimating corridor resistance."
                    ),
                    is_retraining_trigger_recommended=True,
                    suggested_feature_calibration=f"Trigger candidate model retraining with weighted telemetry from {discrepancy.route}.",
                    pattern_cluster_key=cluster_key,
                    recurring_error_count_in_cluster=cluster_count,
                )

        # 5. Large isolated spike (> 35%) -> Route Anomaly
        if pct >= 35.0:
            return ErrorAnalysisDiagnosis(
                discrepancy_id=discrepancy.discrepancy_id,
                error_category="ROUTE_ANOMALY",
                confidence=0.85,
                root_cause_explanation=f"Isolated operational deviation ({pct:.1f}%) on route {discrepancy.route}.",
                is_retraining_trigger_recommended=False,
                suggested_feature_calibration="Monitor corridor over next 5 trips before triggering retrain.",
                pattern_cluster_key=cluster_key,
                recurring_error_count_in_cluster=cluster_count,
            )

        # 6. Low / Moderate Error -> Random Noise
        return ErrorAnalysisDiagnosis(
            discrepancy_id=discrepancy.discrepancy_id,
            error_category="RANDOM_NOISE",
            confidence=0.90,
            root_cause_explanation=f"Normal operational variance ({pct:.1f}% deviation) within acceptable tolerance.",
            is_retraining_trigger_recommended=False,
            suggested_feature_calibration=None,
            pattern_cluster_key=cluster_key,
            recurring_error_count_in_cluster=cluster_count,
        )

    @classmethod
    def get_systematic_error_routes(cls) -> List[str]:
        route_errors: Dict[str, List[float]] = {}
        for d in cls._discrepancy_history:
            if d.route:
                route_errors.setdefault(d.route, []).append(d.error_percentage)
        
        systematic_routes = []
        for r, errs in route_errors.items():
            if len(errs) >= 3 and (sum(errs[-3:]) / 3.0) >= 15.0:
                systematic_routes.append(r)
        return systematic_routes

    @classmethod
    def clear_history(cls):
        cls._discrepancy_history.clear()
