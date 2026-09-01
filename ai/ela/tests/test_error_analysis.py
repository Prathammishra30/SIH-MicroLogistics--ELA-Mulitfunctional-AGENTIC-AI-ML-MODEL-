# Error Analysis & Discrepancy Diagnosis Unit Tests (Phase 6 Universal Intelligence Fusion)
import pytest
from ai.ela.learning.error_analysis import (
    ErrorAnalysisEngine,
    OperationalDiscrepancy,
    ErrorAnalysisDiagnosis,
)


def test_data_quality_issue_detection():
    disc = ErrorAnalysisEngine.record_discrepancy(
        session_id="test-err-dq",
        model_name="ETAPredictionModel",
        model_version="v1.2",
        target_metric="ETA_MINUTES",
        predicted_value=348.0,
        actual_value=-15.0,  # Invalid negative telemetry
        route="Nashik-Pune",
        distance_km=210.0,
    )

    diag = ErrorAnalysisEngine.diagnose_error(disc)
    assert diag.error_category == "DATA_QUALITY_ISSUE"
    assert diag.is_retraining_trigger_recommended is False
    assert "Invalid non-positive" in diag.root_cause_explanation


def test_route_anomaly_weather_detection():
    disc = ErrorAnalysisEngine.record_discrepancy(
        session_id="test-err-weather",
        model_name="ETAPredictionModel",
        model_version="v1.2",
        target_metric="ETA_MINUTES",
        predicted_value=348.0,
        actual_value=510.0,
        route="Nashik-Pune-Ghats",
        distance_km=210.0,
        weather_context="Severe Monsoon Flash Flood",
    )

    diag = ErrorAnalysisEngine.diagnose_error(disc)
    assert diag.error_category == "ROUTE_ANOMALY"
    assert diag.is_retraining_trigger_recommended is False
    assert "weather" in diag.root_cause_explanation.lower()


def test_systematic_model_error_detection_and_retraining_trigger():
    # Clear / record 3 consecutive high-error runs on same corridor
    for i in range(3):
        disc = ErrorAnalysisEngine.record_discrepancy(
            session_id=f"test-sys-err-{i}",
            model_name="ETAPredictionModel",
            model_version="v1.2",
            target_metric="ETA_MINUTES",
            predicted_value=200.0,
            actual_value=280.0,  # 40% error consistently
            route="Baramati-Pune-Corridor",
            distance_km=110.0,
        )

    diag = ErrorAnalysisEngine.diagnose_error(disc)
    assert diag.error_category == "SYSTEMATIC_MODEL_ERROR"
    assert diag.is_retraining_trigger_recommended is True
    assert "Systematic" in diag.root_cause_explanation or "Consistent" in diag.root_cause_explanation
    assert "Baramati-Pune-Corridor" in ErrorAnalysisEngine.get_systematic_error_routes()
