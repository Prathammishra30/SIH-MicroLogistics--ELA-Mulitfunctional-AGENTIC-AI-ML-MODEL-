# Feature & Concept Drift Detector (Phase 7 Real-World Learning & Continuous Intelligence)
import math
import numpy as np
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime


DriftType = Literal[
    "FEATURE_DRIFT",
    "CONCEPT_DRIFT",
    "DATA_DISTRIBUTION_SHIFT",
    "MODEL_PERFORMANCE_DEGRADATION",
    "NO_DRIFT",
]


class DriftMetricDetail(BaseModel):
    feature_or_metric_name: str
    baseline_mean: float
    recent_mean: float
    shift_ratio: float  # |recent_mean - baseline_mean| / max(baseline_mean, 1e-4)
    drift_detected: bool
    description: str


class DriftAnalysisReport(BaseModel):
    model_name: str
    drift_type: DriftType
    is_retraining_warranted: bool
    confidence: float
    baseline_sample_count: int
    recent_sample_count: int
    baseline_mae: float
    recent_mae: float
    degradation_percentage: float
    detailed_metrics: List[DriftMetricDetail] = Field(default_factory=list)
    summary: str
    analyzed_at: str = Field(default_factory=lambda: datetime.now().isoformat())


class DriftDetector:
    """
    Continuous statistical drift detector comparing reference baseline distributions
    against streaming operational telemetry windows.
    """

    DRIFT_SHIFT_THRESHOLD = 0.25  # 25% shift considered significant drift
    PERFORMANCE_DEGRADATION_THRESHOLD = 0.20  # 20% MAE increase flags degradation

    @classmethod
    def detect_drift(
        cls,
        model_name: str,
        baseline_records: List[Dict[str, Any]],
        recent_records: List[Dict[str, Any]],
        feature_names: Optional[List[str]] = None,
    ) -> DriftAnalysisReport:
        if len(baseline_records) < 5 or len(recent_records) < 5:
            return DriftAnalysisReport(
                model_name=model_name,
                drift_type="NO_DRIFT",
                is_retraining_warranted=False,
                confidence=0.50,
                baseline_sample_count=len(baseline_records),
                recent_sample_count=len(recent_records),
                baseline_mae=0.0,
                recent_mae=0.0,
                degradation_percentage=0.0,
                summary="Insufficient sample count to statistically evaluate drift.",
            )

        # 1. Evaluate Performance Drift (MAE degradation)
        base_errors = [
            abs(float(r.get("actual_value", r.get("actual", 0))) - float(r.get("predicted_value", r.get("predicted", 0))))
            for r in baseline_records
        ]
        recent_errors = [
            abs(float(r.get("actual_value", r.get("actual", 0))) - float(r.get("predicted_value", r.get("predicted", 0))))
            for r in recent_records
        ]

        base_mae = float(np.mean(base_errors)) if base_errors else 10.0
        recent_mae = float(np.mean(recent_errors)) if recent_errors else 10.0

        deg_pct = 0.0
        if base_mae > 0:
            deg_pct = ((recent_mae - base_mae) / base_mae) * 100.0

        # 2. Evaluate Feature Distribution Shifts
        feat_details: List[DriftMetricDetail] = []
        features_to_check = feature_names or ["distance_km", "cargo_weight_kg", "departure_hour", "weather_risk"]

        has_feature_drift = False
        for feat in features_to_check:
            base_vals = [
                float(r.get("features", {}).get(feat, 0)) for r in baseline_records if feat in r.get("features", {})
            ]
            recent_vals = [
                float(r.get("features", {}).get(feat, 0)) for r in recent_records if feat in r.get("features", {})
            ]

            if len(base_vals) >= 5 and len(recent_vals) >= 5:
                b_mean = float(np.mean(base_vals))
                r_mean = float(np.mean(recent_vals))
                denom = max(abs(b_mean), 1e-4)
                shift = abs(r_mean - b_mean) / denom

                is_drift = shift >= cls.DRIFT_SHIFT_THRESHOLD
                if is_drift:
                    has_feature_drift = True

                feat_details.append(
                    DriftMetricDetail(
                        feature_or_metric_name=feat,
                        baseline_mean=round(b_mean, 2),
                        recent_mean=round(r_mean, 2),
                        shift_ratio=round(shift, 3),
                        drift_detected=is_drift,
                        description=f"{feat} shifted by {shift * 100:.1f}% ({b_mean:.2f} -> {r_mean:.2f}).",
                    )
                )

        # 3. Determine Drift Type
        drift_type: DriftType = "NO_DRIFT"
        retrain_warranted = False

        if deg_pct >= (cls.PERFORMANCE_DEGRADATION_THRESHOLD * 100.0):
            drift_type = "MODEL_PERFORMANCE_DEGRADATION"
            retrain_warranted = True
            summary = f"Severe performance degradation detected (MAE rose {deg_pct:.1f}%: {base_mae:.1f} -> {recent_mae:.1f}). Candidate retraining recommended."
        elif has_feature_drift:
            drift_type = "FEATURE_DRIFT"
            retrain_warranted = True
            summary = "Significant operational feature distribution shift detected in input streams. Retraining recommended."
        else:
            summary = "No significant drift detected. Model performance remains stable within normal variance."

        return DriftAnalysisReport(
            model_name=model_name,
            drift_type=drift_type,
            is_retraining_warranted=retrain_warranted,
            confidence=0.92,
            baseline_sample_count=len(baseline_records),
            recent_sample_count=len(recent_records),
            baseline_mae=round(base_mae, 2),
            recent_mae=round(recent_mae, 2),
            degradation_percentage=round(deg_pct, 2),
            detailed_metrics=feat_details,
            summary=summary,
        )
