# Phase 7 Real-World Learning & Continuous Intelligence Unit Tests
import pytest
from datetime import datetime, timedelta
from ai.ela.data.schemas import (
    LearningEvent,
    ExplicitUserFeedback,
    ImplicitOperationalFeedback,
    BusinessOutcomeFeedback,
)
from ai.ela.data.validation import DataQualityValidator
from ai.ela.learning.collector import FeedbackCollector
from ai.ela.learning.error_analysis import ErrorAnalysisEngine, OperationalDiscrepancy
from ai.ela.learning.pattern_miner import PatternMiner
from ai.ela.learning.drift import DriftDetector
from ai.ela.learning.retraining import RetrainingTriggerEngine


def test_data_quality_validator_and_anti_leakage():
    # 1. Valid records
    valid_data = [
        {"event_id": "e1", "features": {"distance_km": 150.0, "cargo_weight_kg": 500.0}, "actual_value": 240.0, "timestamp": "2026-08-30T10:00:00"},
        {"event_id": "e2", "features": {"distance_km": 210.0, "cargo_weight_kg": 750.0}, "actual_value": 350.0, "timestamp": "2026-08-30T11:00:00"},
        {"event_id": "e3", "features": {"distance_km": 80.0, "cargo_weight_kg": 300.0}, "actual_value": 140.0, "timestamp": "2026-08-30T12:00:00"},
    ]
    cleaned, report = DataQualityValidator.validate_dataset(valid_data)
    assert len(cleaned) == 3
    assert report.validation_status == "PASSED"
    assert report.leakage_detected is False
    assert report.temporal_order_valid is True

    # 2. Target Leakage Detection (Features containing future target outcome)
    leaked_data = [
        {"event_id": "e4", "features": {"distance_km": 150.0, "actual_eta": 240.0}, "actual_value": 240.0},
    ]
    cleaned_leak, leak_report = DataQualityValidator.validate_dataset(leaked_data)
    assert len(cleaned_leak) == 0
    assert leak_report.leakage_detected is True
    assert leak_report.validation_status == "FAILED"

    # 3. Impossible non-positive value filtering
    impossible_data = [
        {"event_id": "e5", "features": {"distance_km": -50.0, "cargo_weight_kg": 500.0}, "actual_value": 240.0},
        {"event_id": "e6", "features": {"distance_km": 100.0, "cargo_weight_kg": 500.0}, "actual_value": -10.0},
    ]
    cleaned_imp, imp_report = DataQualityValidator.validate_dataset(impossible_data)
    assert len(cleaned_imp) == 0
    assert imp_report.invalid_records_count == 2


def test_temporal_train_test_split_anti_leakage():
    t0 = datetime(2026, 8, 30, 8, 0, 0)
    records = [
        {"event_id": f"t-{i}", "timestamp": (t0 + timedelta(hours=i)).isoformat(), "features": {"distance_km": 100 + i}, "actual_value": 150 + i}
        for i in range(10)
    ]
    train, val, holdout = DataQualityValidator.temporal_train_test_split(records, 0.6, 0.2, 0.2)
    assert len(train) == 6
    assert len(val) == 2
    assert len(holdout) == 2

    # Verify chronological strictness: train timestamps < val timestamps < holdout timestamps
    assert train[-1]["timestamp"] < val[0]["timestamp"]
    assert val[-1]["timestamp"] < holdout[0]["timestamp"]


def test_feedback_collector_multi_channel_and_sanitization():
    FeedbackCollector.clear_records()

    # 1. Ingest Learning Event with Secret Shield check
    event = FeedbackCollector.record_learning_event(
        operation_type="LOGISTICS_REQUEST",
        prediction_type="ETA_MINUTES",
        features={"distance_km": 210.0, "password": "SuperSecretPassword123!"},
        predicted_value=348.0,
        actual_value=360.0,
        user_role="FARMER",
        route_context="Nashik-Pune",
        feedback_text="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 ETA was close",
    )
    assert "password" not in event.features or event.features["password"] == "[REDACTED_SECRET]"
    assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in str(event.feedback_text)
    assert event.error_delta == 12.0

    # 2. Ingest Explicit User Feedback
    user_fb = FeedbackCollector.record_explicit_user_feedback(
        ExplicitUserFeedback(
            session_id="sess-fb-1",
            user_id="usr-farmer-1",
            user_role="FARMER",
            model_name="ETAPredictionModel",
            rating=5,
            feedback_category="ACCURACY",
            feedback_text="Accurate timing prediction",
        )
    )
    assert user_fb.rating == 5

    # 3. Ingest Implicit Operational Feedback
    op_fb = FeedbackCollector.record_operational_feedback(
        ImplicitOperationalFeedback(
            operation_id="op-101",
            session_id="sess-101",
            model_name="ETAPredictionModel",
            model_version="v1.2",
            predicted_value=348.0,
            actual_value=390.0,
            route="Nashik-Pune",
        )
    )
    assert op_fb.actual_value == 390.0
    assert len(FeedbackCollector.get_all_learning_events()) >= 2


def test_error_analysis_diagnostics_and_bias():
    disc = ErrorAnalysisEngine.record_discrepancy(
        session_id="test-err-bias",
        model_name="TransportCostModel",
        model_version="v1.2",
        target_metric="TRANSPORT_COST",
        predicted_value=4500.0,
        actual_value=5100.0,
        route="Nashik-Pune",
        departure_hour=18,
    )
    assert disc.error_delta == 600.0
    assert disc.bias_direction == "UNDER_PREDICTION"
    assert disc.mae_contribution == 600.0
    assert disc.rmse_contribution == 360000.0

    diag = ErrorAnalysisEngine.diagnose_error(disc)
    assert diag.confidence >= 0.85


def test_data_driven_pattern_mining():
    # Construct historical dataset with elevated delay pattern on Nashik-Pune corridor
    records = []
    for i in range(5):
        records.append({
            "event_id": f"p-{i}",
            "route": "Nashik-Pune",
            "features": {"route": "Nashik-Pune", "departure_hour": 18},
            "predicted_value": 200.0,
            "actual_value": 260.0,  # 60 mins delay
        })
    # Add normal control route
    for i in range(5):
        records.append({
            "event_id": f"c-{i}",
            "route": "Pune-Solapur",
            "features": {"route": "Pune-Solapur", "departure_hour": 10},
            "predicted_value": 150.0,
            "actual_value": 152.0,
        })

    patterns = PatternMiner.mine_patterns(records)
    assert len(patterns) >= 1
    route_pat = [p for p in patterns if p.dimension_value == "Nashik-Pune"]
    assert len(route_pat) == 1
    assert route_pat[0].pattern_type == "ROUTE_PATTERN"
    assert route_pat[0].mean_delay_minutes >= 50.0


def test_drift_detection_and_performance_degradation():
    baseline_records = [
        {"features": {"distance_km": 200.0, "cargo_weight_kg": 500.0}, "predicted_value": 300.0, "actual_value": 310.0}
        for _ in range(10)
    ]
    # Severe recent degradation (actual error jumps from 10 to 60)
    recent_records = [
        {"features": {"distance_km": 200.0, "cargo_weight_kg": 500.0}, "predicted_value": 300.0, "actual_value": 365.0}
        for _ in range(10)
    ]

    report = DriftDetector.detect_drift(
        model_name="ETAPredictionModel",
        baseline_records=baseline_records,
        recent_records=recent_records,
    )
    assert report.drift_type == "MODEL_PERFORMANCE_DEGRADATION"
    assert report.is_retraining_warranted is True
    assert report.degradation_percentage > 20.0


def test_retraining_trigger_proposal_emission():
    FeedbackCollector.clear_records()
    ErrorAnalysisEngine.clear_history()
    # Populate 12 valid operational records
    for i in range(12):
        FeedbackCollector.record_learning_event(
            operation_type="TRIP",
            prediction_type="DEMAND_KG",
            features={"commodity_encoded": 1.0, "mandi_arrival_volume": 120.0 + i},
            predicted_value=500.0 + (i * 5),
            actual_value=520.0 + (i * 5),
            model_name="DemandPredictionModel",
        )

    proposal = RetrainingTriggerEngine.evaluate_retraining_trigger(
        model_name="DemandPredictionModel",
        current_version="v1.2",
    )
    assert proposal.is_governed_retrain_ready is True
    assert proposal.eligible_samples_count >= 10
    assert proposal.trigger_reason == "SUFFICIENT_NEW_DATA"
