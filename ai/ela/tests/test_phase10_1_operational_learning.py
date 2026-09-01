# ELA Phase 10.1 Real Operational Learning & Autonomous Cognitive Loop Test Suite
import pytest
import asyncio
from typing import Dict, Any, List

from ai.ela.learning.trace_store import PredictionTraceStore, PredictionRecord, OutcomeLinkResult
from ai.ela.learning.collector import FeedbackCollector
from ai.ela.learning.error_analysis import ErrorAnalysisEngine, OperationalDiscrepancy
from ai.ela.learning.pattern_miner import PatternMiner
from ai.ela.learning.drift import DriftDetector
from ai.ela.learning.retraining import RetrainingTriggerEngine
from ai.ela.learning.candidate_trainer import CandidateModelTrainer
from ai.ela.learning.evaluator import GovernedModelEvaluator
from ai.ela.learning.governance import ModelGovernanceGate
from ai.ela.learning.registry import ModelRegistry
from ai.ela.ml.models.eta import ETAPredictionModel, EtaFeatures
from ai.ela.agents.prediction_agent import PredictionAgent
from ai.ela.agents.contracts import AgentRequest
from ai.ela.agent.brain import ElaUniversalBrain
from ai.ela.agent.loop import AgentChatRequest


@pytest.fixture(autouse=True)
def reset_learning_state():
    """Resets all telemetry and registry state before each test."""
    PredictionTraceStore.clear_all()
    FeedbackCollector.clear_records()
    ErrorAnalysisEngine.clear_history()
    ModelRegistry.clear_all()
    ModelRegistry.ensure_defaults()
    yield
    PredictionTraceStore.clear_all()
    FeedbackCollector.clear_records()
    ErrorAnalysisEngine.clear_history()


def test_prediction_trace_recording():
    """Test 1: Every model prediction creates an explicit, non-anonymous PredictionRecord."""
    record = PredictionTraceStore.record_prediction(
        session_id="sess-trace-01",
        model_name="ETAPredictionModel",
        model_version="v1.2-transit-hybrid",
        prediction_type="ETA_MINUTES",
        input_features={"origin": "Nashik", "destination": "Pune APMC Mandi", "distance_km": 210.0, "vehicle_type": "Mini Truck"},
        predicted_value=330.0,
        confidence=0.92,
        route_context="Nashik-Pune APMC Mandi",
        entity_identifiers={"commodity": "Tomatoes", "weight_kg": 500.0},
    )

    assert record.prediction_id.startswith("pred-eta-")
    assert record.model_name == "ETAPredictionModel"
    assert record.predicted_value == 330.0
    assert record.status == "PENDING_OUTCOME"
    assert record.route_context == "Nashik-Pune APMC Mandi"

    retrieved = PredictionTraceStore.get_prediction(record.prediction_id)
    assert retrieved is not None
    assert retrieved.prediction_id == record.prediction_id


def test_outcome_linking_and_error_calculation():
    """Test 2: Authoritative outcome linking programmatically calculates discrepancies."""
    record = PredictionTraceStore.record_prediction(
        session_id="sess-link-01",
        model_name="ETAPredictionModel",
        model_version="v1.2-transit-hybrid",
        prediction_type="ETA_MINUTES",
        input_features={"origin": "Nashik", "destination": "Pune", "distance_km": 210.0},
        predicted_value=330.0,
        confidence=0.90,
    )

    # Actual outcome is 368 minutes (38 minutes delayed)
    link_res = PredictionTraceStore.link_outcome(
        prediction_id=record.prediction_id,
        actual_value=368.0,
        outcome_status="COMPLETED",
        dataset_type="REAL_OPERATIONAL",
    )

    assert link_res.signed_error == 38.0
    assert link_res.absolute_error == 38.0
    assert link_res.percentage_error == round((38.0 / 330.0) * 100.0, 2)
    assert link_res.mae_contribution == 38.0
    assert link_res.rmse_contribution == 38.0 ** 2
    assert record.status == "LINKED_TO_OUTCOME"
    assert record.actual_value == 368.0


def test_operational_feedback_collector_event_types():
    """Test 3: FeedbackCollector supports real operational events with explicit data labeling."""
    event_eta = FeedbackCollector.record_operational_outcome(
        outcome_event_type="ETA_OUTCOME",
        actual_value=345.0,
        predicted_value=330.0,
        model_name="ETAPredictionModel",
        model_version="v1.2",
        dataset_type="REAL_OPERATIONAL",
    )
    assert event_eta.operation_type == "ETA_OUTCOME"
    assert event_eta.dataset_type == "REAL_OPERATIONAL"
    assert event_eta.error_delta == 15.0

    event_freight = FeedbackCollector.record_operational_outcome(
        outcome_event_type="FREIGHT_OUTCOME",
        actual_value=6200.0,
        predicted_value=6073.0,
        model_name="TransportCostModel",
        model_version="v1.1",
        dataset_type="SYNTHETIC_TEST",
    )
    assert event_freight.operation_type == "FREIGHT_OUTCOME"
    assert event_freight.dataset_type == "SYNTHETIC_TEST"
    assert event_freight.error_delta == 127.0


def test_error_analysis_diagnostics_and_classification():
    """Test 4: ErrorAnalysisEngine classifies errors rigorously without blaming model for noise or sensor errors."""
    # Data quality / sensor error
    disc_bad = ErrorAnalysisEngine.record_discrepancy(
        session_id="sess-dq",
        model_name="ETAPredictionModel",
        model_version="v1.2",
        target_metric="ETA_MINUTES",
        predicted_value=330.0,
        actual_value=-10.0,
        route="Route-DQ",
    )
    diag_bad = ErrorAnalysisEngine.diagnose_error(disc_bad)
    assert diag_bad.error_category == "DATA_QUALITY_ISSUE"
    assert not diag_bad.is_retraining_trigger_recommended

    # Weather anomaly
    disc_weather = ErrorAnalysisEngine.record_discrepancy(
        session_id="sess-weather",
        model_name="ETAPredictionModel",
        model_version="v1.2",
        target_metric="ETA_MINUTES",
        predicted_value=330.0,
        actual_value=480.0,
        route="Route-Weather",
        weather_context="Severe monsoon cloudburst",
    )
    diag_weather = ErrorAnalysisEngine.diagnose_error(disc_weather)
    assert diag_weather.error_category == "ROUTE_ANOMALY"

    # Normal noise (3% deviation)
    disc_noise = ErrorAnalysisEngine.record_discrepancy(
        session_id="sess-noise",
        model_name="ETAPredictionModel",
        model_version="v1.2",
        target_metric="ETA_MINUTES",
        predicted_value=330.0,
        actual_value=338.0,
        route="Route-Noise",
    )
    diag_noise = ErrorAnalysisEngine.diagnose_error(disc_noise)
    assert diag_noise.error_category == "RANDOM_NOISE"
    assert not diag_noise.is_retraining_trigger_recommended


def test_pattern_mining_on_operational_data():
    """Test 5: PatternMiner discovers recurring corridor discrepancies with statistical grounding."""
    records = []
    # 5 trips on Nashik-Pune with recurrent 45-minute delay
    for i in range(5):
        records.append({
            "features": {"origin": "Nashik", "destination": "Pune", "route": "Nashik-Pune", "departure_hour": 8 + i},
            "predicted_value": 300.0,
            "actual_value": 345.0,
            "route": "Nashik-Pune",
            "timestamp": f"2026-08-30T{10 + i:02d}:00:00",
        })
    # 5 trips on Mumbai-Pune with normal 5-minute variance
    for i in range(5):
        records.append({
            "features": {"origin": "Mumbai", "destination": "Pune", "route": "Mumbai-Pune", "departure_hour": 8 + i},
            "predicted_value": 180.0,
            "actual_value": 185.0,
            "route": "Mumbai-Pune",
            "timestamp": f"2026-08-30T{10 + i:02d}:00:00",
        })

    patterns = PatternMiner.mine_patterns(records)
    assert len(patterns) >= 1
    nashik_pattern = next((p for p in patterns if "Nashik-Pune" in p.dimension_value), None)
    assert nashik_pattern is not None
    assert nashik_pattern.pattern_type == "ROUTE_PATTERN"
    assert nashik_pattern.sample_count == 5
    assert nashik_pattern.mean_delay_minutes == 45.0
    assert "suggested_buffer_minutes" in nashik_pattern.recommended_feature_adjustment


def test_drift_detection_and_no_false_positives():
    """Test 6: DriftDetector identifies performance degradation and avoids false triggers on normal noise."""
    baseline = [
        {"features": {"distance_km": 200 + i, "cargo_weight_kg": 500, "departure_hour": 8}, "actual_value": 310, "predicted_value": 300}
        for i in range(10)
    ]
    # Normal noise (recent MAE matches baseline)
    recent_stable = [
        {"features": {"distance_km": 200 + i, "cargo_weight_kg": 500, "departure_hour": 8}, "actual_value": 310, "predicted_value": 300}
        for i in range(10)
    ]
    report_stable = DriftDetector.detect_drift("ETAPredictionModel", baseline, recent_stable)
    assert report_stable.drift_type == "NO_DRIFT"
    assert not report_stable.is_retraining_warranted

    # Severe degradation (MAE increases from 10 to 45 mins)
    recent_drift = [
        {"features": {"distance_km": 200 + i, "cargo_weight_kg": 500, "departure_hour": 8}, "actual_value": 345, "predicted_value": 300}
        for i in range(10)
    ]
    report_drift = DriftDetector.detect_drift("ETAPredictionModel", baseline, recent_drift)
    assert report_drift.is_retraining_warranted
    assert report_drift.drift_type == "MODEL_PERFORMANCE_DEGRADATION"


@pytest.mark.asyncio
async def test_candidate_training_and_governance_decision():
    """Test 7 & 8: CandidateModelTrainer trains candidate, evaluates on holdout, and applies governance gating."""
    # Create 15 validated operational samples with distinct features
    operational_records = []
    for i in range(15):
        operational_records.append({
            "features": {"distance_km": 200.0 + (i * 5), "departure_hour": 6 + (i % 12), "checkpoint_delay_minutes": 10 + i},
            "actual_value": 310.0 + (i * 8),
            "predicted_value": 300.0 + (i * 6),
            "route": f"Route-{i}",
            "timestamp": f"2026-08-30T{10 + (i % 12):02d}:00:00",
        })

    result = await CandidateModelTrainer.train_candidate(
        model_name="ETAPredictionModel",
        operational_records=operational_records,
        trigger_reason="SUFFICIENT_NEW_DATA",
    )

    assert result.model_name == "ETAPredictionModel"
    assert result.training_sample_count > 0
    assert result.candidate_version.startswith("v1.2-transit-hybrid-cand-")
    assert result.artifact_checksum is not None
    assert result.governance_decision in ["APPROVE", "REJECT", "INSUFFICIENT_EVIDENCE"]
    assert result.candidate_version.startswith("v1.2-transit-hybrid-cand-")
    assert result.artifact_checksum is not None
    assert result.governance_decision in ["APPROVE", "REJECT"]


def test_model_promotion_and_rollback():
    """Test 9 & 10: ModelRegistry promotes candidate and supports explicit auditable rollback."""
    ModelRegistry.ensure_defaults()
    initial_model = ModelRegistry.get_active_model("ETAPredictionModel")
    initial_ver = initial_model.current_version

    # Create candidate model
    candidate = ETAPredictionModel(version="v1.3-approved-candidate", status="trained")
    
    # Mock approved evaluation report
    from ai.ela.learning.evaluator import ModelEvaluationReport
    from ai.ela.ml.types import ModelMetrics
    eval_report = ModelEvaluationReport(
        active_model_name="ETAPredictionModel",
        active_model_version=initial_ver,
        active_metrics=ModelMetrics(mae=25.0, rmse=30.0, r_squared=0.80),
        candidate_model_name="ETAPredictionModel",
        candidate_model_version="v1.3-approved-candidate",
        candidate_metrics=ModelMetrics(mae=18.0, rmse=22.0, r_squared=0.90),
        mae_improvement_pct=28.0,
        holdout_sample_count=20,
        recommendation="PROMOTE_CANDIDATE",
        decision_reason="Candidate achieved 28% MAE improvement on 20 holdout samples.",
    )

    # 1. Promote
    promoted = ModelRegistry.promote_candidate(candidate, eval_report)
    assert promoted is True
    active_model = ModelRegistry.get_active_model("ETAPredictionModel")
    assert active_model.current_version == "v1.3-approved-candidate"

    # 2. Rollback to initial version
    rolled_back = ModelRegistry.rollback("ETAPredictionModel", initial_ver)
    assert rolled_back is True
    audit_logs = ModelRegistry.get_rollback_audit_log()
    assert len(audit_logs) >= 1
    assert audit_logs[-1]["to_version"] == initial_ver
    assert ModelRegistry.get_active_model("ETAPredictionModel").current_version == initial_ver


@pytest.mark.asyncio
async def test_future_inference_uses_promoted_model_version():
    """Test 11: Future ELA inference dynamically loads and uses newly promoted model version."""
    from ai.ela.agent.state import CanonicalEntities
    ModelRegistry.ensure_defaults()
    agent = PredictionAgent()

    # Step 1: Baseline prediction using v1.2
    req1 = AgentRequest(
        task_id="t-inf-1",
        session_id="sess-inf-1",
        goal_id="g-inf-1",
        objective="Predict Transport",
        role="FARMER",
        language="hi",
        intent="CREATE_LOGISTICS_WORKFLOW",
        entities=CanonicalEntities(pickup_location="Nashik", destination="Pune APMC Mandi", quantity=500.0, vehicle_type="Mini Truck (750 kg)"),
    )
    res1 = await agent.execute(req1)
    assert res1.data["eta_model_version"] == "v1.2-transit-hybrid"

    # Step 2: Promote candidate v1.3
    cand = ETAPredictionModel(version="v1.3-promoted-fleet", status="trained")
    from ai.ela.learning.evaluator import ModelEvaluationReport
    from ai.ela.ml.types import ModelMetrics
    eval_rep = ModelEvaluationReport(
        active_model_name="ETAPredictionModel",
        active_model_version="v1.2-transit-hybrid",
        active_metrics=ModelMetrics(mae=22.0, rmse=28.0, r_squared=0.82),
        candidate_model_name="ETAPredictionModel",
        candidate_model_version="v1.3-promoted-fleet",
        candidate_metrics=ModelMetrics(mae=15.0, rmse=19.0, r_squared=0.91),
        mae_improvement_pct=31.8,
        holdout_sample_count=15,
        recommendation="PROMOTE_CANDIDATE",
        decision_reason="Candidate achieved 31.8% MAE improvement.",
    )
    ModelRegistry.promote_candidate(cand, eval_rep)

    # Step 3: Verify the next inference automatically uses v1.3
    res2 = await agent.execute(req1)
    assert res2.data["eta_model_version"] == "v1.3-promoted-fleet"
    assert "ETAPredictionModel (v1.3-promoted-fleet)" in res2.models_used


@pytest.mark.asyncio
async def test_agentic_replanning_preserves_context():
    """Test 12: ELA adapts to changing operational facts without resetting conversation context."""
    brain = ElaUniversalBrain()

    # Turn 1: Farmer initiates logistics request
    req1 = AgentChatRequest(
        message="500 किलो टमाटर नाशिक से पुणे भेजने हैं",
        session_id="sess-replan-01",
        authenticated=True,
        authenticated_role="FARMER",
        language="hi",
    )
    res1 = await brain.process_chat(req1)
    assert res1.status in ["CONFIRMATION_REQUIRED", "SUCCESS"]
    assert res1.detected_role == "FARMER"

    # Turn 2: User informs that vehicle is unavailable / asks for alternative
    req2 = AgentChatRequest(
        message="गाड़ी उपलब्ध नहीं है, दूसरा विकल्प बताएं",
        session_id="sess-replan-01",
        authenticated=True,
        authenticated_role="FARMER",
        language="hi",
    )
    res2 = await brain.process_chat(req2)
    assert res2.status in ["CONFIRMATION_REQUIRED", "SUCCESS"]
    assert res2.detected_role == "FARMER"
    assert res2.language == "hi"


def test_zero_secret_shielding_in_learning_telemetry():
    """Test 13: Zero-secret security guarantees passwords, OTPs, PINs never enter learning storage."""
    rec = PredictionTraceStore.record_prediction(
        session_id="sess-sec-01",
        model_name="ETAPredictionModel",
        model_version="v1.2",
        prediction_type="ETA_MINUTES",
        input_features={"origin": "Nashik", "password": "superSecretPassword123!", "otp": "948210", "pin": "4432"},
        predicted_value=330.0,
    )
    # Verify sensitive secret values are stripped and redacted
    assert rec.input_features.get("password") == "[REDACTED_SECRET]"
    assert rec.input_features.get("otp") == "[REDACTED_SECRET]"
    assert "superSecretPassword123!" not in str(rec.model_dump())
    assert "948210" not in str(rec.model_dump())


@pytest.mark.asyncio
async def test_full_deterministic_e2e_learning_lifecycle():
    """Test 14: Complete 15-step operational learning lifecycle."""
    from ai.ela.agent.state import CanonicalEntities
    # 1. Prediction with trace
    agent = PredictionAgent()
    req = AgentRequest(
        task_id="t-e2e-1",
        session_id="sess-e2e-learning",
        goal_id="g-e2e-1",
        objective="Arrange transport for produce",
        role="FARMER",
        language="hi",
        intent="CREATE_LOGISTICS_WORKFLOW",
        entities=CanonicalEntities(pickup_location="Nashik", destination="Pune APMC Mandi", quantity=500.0),
    )
    res = await agent.execute(req)
    pred_id = res.data["prediction_traces"]["ETA_MINUTES"]
    assert pred_id is not None

    # 2. Outcome linking
    link_res = PredictionTraceStore.link_outcome(
        prediction_id=pred_id,
        actual_value=375.0,
        outcome_status="COMPLETED",
        dataset_type="REAL_OPERATIONAL",
    )
    assert link_res.absolute_error > 0

    # 3. Simulate accumulated telemetry for Nashik-Pune corridor
    sim_records = []
    for i in range(15):
        sim_records.append({
            "features": {"distance_km": 200.0 + (i * 4), "departure_hour": 6 + (i % 12), "checkpoint_delay_minutes": 15 + i},
            "actual_value": 350.0 + (i * 6),
            "predicted_value": 310.0 + (i * 4),
            "route": "Nashik-Pune",
            "timestamp": f"2026-08-30T{10 + (i % 12):02d}:00:00",
        })

    # 4. Pattern mining
    patterns = PatternMiner.mine_patterns(sim_records)
    assert len(patterns) >= 1

    # 5. Candidate training & promotion
    cand_res = await CandidateModelTrainer.train_candidate(
        model_name="ETAPredictionModel",
        operational_records=sim_records,
        trigger_reason="RECURRING_OPERATIONAL_PATTERN",
    )
    assert cand_res.candidate_version is not None
    assert cand_res.artifact_checksum is not None
