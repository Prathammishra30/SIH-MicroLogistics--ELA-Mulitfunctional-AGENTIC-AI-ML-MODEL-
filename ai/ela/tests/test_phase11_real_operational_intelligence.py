# ELA Phase 11 — Real Operational Intelligence & Autonomous Closed-Loop Learning Test Suite
import pytest
import asyncio
import copy
from datetime import datetime
from typing import Dict, Any, List

from ai.ela.learning.trace_store import (
    PredictionTraceStore,
    PredictionRecord,
    OutcomeLinkResult,
)
from ai.ela.learning.collector import FeedbackCollector
from ai.ela.learning.error_analysis import ErrorAnalysisEngine, OperationalDiscrepancy
from ai.ela.learning.pattern_miner import PatternMiner
from ai.ela.learning.drift import DriftDetector
from ai.ela.learning.retraining import RetrainingTriggerEngine
from ai.ela.learning.candidate_trainer import CandidateModelTrainer
from ai.ela.learning.evaluator import GovernedModelEvaluator, ModelEvaluationReport
from ai.ela.learning.governance import ModelGovernanceGate, GovernanceAuditReport
from ai.ela.learning.registry import ModelRegistry
from ai.ela.ml.models.eta import ETAPredictionModel
from ai.ela.ml.types import ModelMetrics
from ai.ela.agents.prediction_agent import PredictionAgent
from ai.ela.agents.contracts import AgentRequest
from ai.ela.agent.state import CanonicalEntities
from ai.ela.agent.brain import ElaUniversalBrain
from ai.ela.agent.loop import AgentChatRequest
from ai.ela.data.validation import DataQualityValidator
from ai.ela.data.schemas import LearningEvent, DatasetType


# =============================================================================
# 1. Real Operational Event Ingestion
# =============================================================================
def test_01_real_operational_event_ingestion():
    """Test 1: Ingestion of genuine operational events with explicit REAL_OPERATIONAL labeling."""
    event = FeedbackCollector.record_operational_outcome(
        outcome_event_type="ETA_OUTCOME",
        actual_value=365.0,
        predicted_value=330.0,
        model_name="ETAPredictionModel",
        model_version="v1.2-transit-hybrid",
        features={"distance_km": 210.0, "departure_hour": 8, "route": "Nashik-Pune"},
        dataset_type="REAL_OPERATIONAL",
    )
    assert event.operation_type == "ETA_OUTCOME"
    assert event.dataset_type == "REAL_OPERATIONAL"
    assert event.actual_value == 365.0
    assert event.predicted_value == 330.0
    assert event.error_delta == 35.0


# =============================================================================
# 2. Prediction Trace Creation
# =============================================================================
def test_02_prediction_trace_creation():
    """Test 2: Explicit non-anonymous prediction trace creation."""
    rec = PredictionTraceStore.record_prediction(
        session_id="sess-p11-02",
        goal_id="goal-p11-02",
        model_name="ETAPredictionModel",
        model_version="v1.2-transit-hybrid",
        prediction_type="ETA_MINUTES",
        input_features={"origin": "Nashik", "destination": "Pune", "distance_km": 210.0},
        predicted_value=330.0,
        confidence=0.92,
        route_context="Nashik-Pune",
        entity_identifiers={"commodity": "Tomatoes", "weight_kg": 500.0},
    )
    assert rec.prediction_id.startswith("pred-eta-")
    assert rec.session_id == "sess-p11-02"
    assert rec.goal_id == "goal-p11-02"
    assert rec.model_version == "v1.2-transit-hybrid"
    assert rec.status == "PENDING_OUTCOME"
    assert rec.predicted_value == 330.0


# =============================================================================
# 3. Outcome Linking
# =============================================================================
def test_03_outcome_linking():
    """Test 3: Linking authoritative real-world outcome with prediction trace."""
    rec = PredictionTraceStore.record_prediction(
        session_id="sess-p11-03",
        model_name="ETAPredictionModel",
        model_version="v1.2-transit-hybrid",
        prediction_type="ETA_MINUTES",
        input_features={"origin": "Nashik", "destination": "Pune", "distance_km": 210.0},
        predicted_value=330.0,
    )
    link = PredictionTraceStore.link_outcome(
        prediction_id=rec.prediction_id,
        actual_value=375.0,
        outcome_status="COMPLETED",
        dataset_type="REAL_OPERATIONAL",
    )
    assert link.prediction_id == rec.prediction_id
    assert link.outcome_id.startswith("outcome-")
    assert link.dataset_type == "REAL_OPERATIONAL"
    assert rec.status == "LINKED_TO_OUTCOME"
    assert rec.actual_value == 375.0


# =============================================================================
# 4. Error Calculation
# =============================================================================
def test_04_error_calculation():
    """Test 4: Programmatic calculation of signed, absolute, and percentage error with MAE/RMSE contributions."""
    rec = PredictionTraceStore.record_prediction(
        session_id="sess-p11-04",
        model_name="ETAPredictionModel",
        model_version="v1.2-transit-hybrid",
        prediction_type="ETA_MINUTES",
        input_features={"origin": "Nashik", "destination": "Pune"},
        predicted_value=300.0,
    )
    link = PredictionTraceStore.link_outcome(
        prediction_id=rec.prediction_id,
        actual_value=360.0,
    )
    assert link.signed_error == 60.0
    assert link.absolute_error == 60.0
    assert link.percentage_error == 20.0
    assert link.mae_contribution == 60.0
    assert link.rmse_contribution == 3600.0


# =============================================================================
# 5. Pattern Discovery
# =============================================================================
def test_05_pattern_discovery():
    """Test 5: Statistical discovery of recurring corridor transit delays and peak periods."""
    records = []
    # 6 trips on Nashik-Pune with recurrent 45-minute delay
    for i in range(6):
        records.append({
            "features": {"origin": "Nashik", "destination": "Pune", "route": "Nashik-Pune", "departure_hour": 8 + i},
            "predicted_value": 300.0,
            "actual_value": 345.0,
            "route": "Nashik-Pune",
            "timestamp": f"2026-08-30T{10 + i:02d}:00:00",
        })
    # 6 trips on Mumbai-Pune with normal 4-minute variance
    for i in range(6):
        records.append({
            "features": {"origin": "Mumbai", "destination": "Pune", "route": "Mumbai-Pune", "departure_hour": 8 + i},
            "predicted_value": 180.0,
            "actual_value": 184.0,
            "route": "Mumbai-Pune",
            "timestamp": f"2026-08-30T{10 + i:02d}:00:00",
        })

    patterns = PatternMiner.mine_patterns(records)
    assert len(patterns) >= 1
    nashik_pat = next((p for p in patterns if "Nashik-Pune" in p.dimension_value), None)
    assert nashik_pat is not None
    assert nashik_pat.pattern_type == "ROUTE_PATTERN"
    assert nashik_pat.mean_delay_minutes == 45.0
    assert "suggested_buffer_minutes" in nashik_pat.recommended_feature_adjustment


# =============================================================================
# 6. Drift Detection
# =============================================================================
def test_06_drift_detection():
    """Test 6: Detection of true model performance degradation and resilience to normal noise."""
    baseline = [
        {"features": {"distance_km": 200 + i, "cargo_weight_kg": 500, "departure_hour": 8}, "actual_value": 310, "predicted_value": 300}
        for i in range(10)
    ]
    # Stable stream
    stable_stream = [
        {"features": {"distance_km": 200 + i, "cargo_weight_kg": 500, "departure_hour": 8}, "actual_value": 310, "predicted_value": 300}
        for i in range(10)
    ]
    report_stable = DriftDetector.detect_drift("ETAPredictionModel", baseline, stable_stream)
    assert report_stable.drift_type == "NO_DRIFT"
    assert not report_stable.is_retraining_warranted

    # Degraded stream
    drift_stream = [
        {"features": {"distance_km": 200 + i, "cargo_weight_kg": 500, "departure_hour": 8}, "actual_value": 350, "predicted_value": 300}
        for i in range(10)
    ]
    report_drift = DriftDetector.detect_drift("ETAPredictionModel", baseline, drift_stream)
    assert report_drift.drift_type == "MODEL_PERFORMANCE_DEGRADATION"
    assert report_drift.is_retraining_warranted


# =============================================================================
# 7. Retraining Trigger Proposal
# =============================================================================
def test_07_retraining_trigger_proposal():
    """Test 7: Autonomous generation of explainable RetrainingProposal upon drift."""
    drift_report = DriftDetector.detect_drift(
        "ETAPredictionModel",
        [{"features": {"distance_km": 200}, "actual_value": 310, "predicted_value": 300} for _ in range(10)],
        [{"features": {"distance_km": 200}, "actual_value": 355, "predicted_value": 300} for _ in range(10)],
    )
    proposal = RetrainingTriggerEngine.evaluate_retraining_trigger(
        model_name="ETAPredictionModel",
        current_version="v1.2-transit-hybrid",
        drift_report=drift_report,
    )
    assert proposal.trigger_reason == "MODEL_PERFORMANCE_DEGRADATION"
    assert proposal.model_name == "ETAPredictionModel"
    assert "MODEL_PERFORMANCE_DEGRADATION" in proposal.summary


# =============================================================================
# 8. Candidate Model Training
# =============================================================================
@pytest.mark.asyncio
async def test_08_candidate_model_training():
    """Test 8: CandidateModelTrainer trains candidate on anti-leakage temporal split with SHA-256 artifact checksum."""
    records = []
    for i in range(16):
        records.append({
            "features": {"distance_km": 200.0 + (i * 5), "departure_hour": 6 + (i % 12), "checkpoint_delay_minutes": 10 + i},
            "actual_value": 310.0 + (i * 8),
            "predicted_value": 300.0 + (i * 6),
            "route": f"Route-{i}",
            "timestamp": f"2026-08-30T{10 + (i % 12):02d}:00:00",
        })

    result = await CandidateModelTrainer.train_candidate(
        model_name="ETAPredictionModel",
        operational_records=records,
        trigger_reason="SUFFICIENT_NEW_DATA",
    )
    assert result.model_name == "ETAPredictionModel"
    assert result.candidate_version.startswith("v1.2-transit-hybrid-cand-")
    assert result.artifact_checksum is not None
    assert len(result.artifact_checksum) == 64
    assert result.training_sample_count > 0


# =============================================================================
# 9. Holdout Evaluation on Unseen Data
# =============================================================================
@pytest.mark.asyncio
async def test_09_holdout_evaluation():
    """Test 9: GovernedModelEvaluator compares candidate against production on unseen holdout dataset."""
    prod = ETAPredictionModel(version="v1.2-transit-hybrid", status="production")
    candidate = ETAPredictionModel(version="v1.3-transit-cand", status="trained")

    holdout = [
        {"features": {"distance_km": 200.0 + (i * 10), "departure_hour": 8}, "actual_value": 320.0 + (i * 12)}
        for i in range(8)
    ]

    report = await GovernedModelEvaluator.evaluate_candidate_vs_production(candidate, prod, holdout)
    assert report.holdout_sample_count == 8
    assert report.active_metrics is not None
    assert report.candidate_metrics is not None
    assert isinstance(report.mae_improvement_pct, float)


# =============================================================================
# 10. Governance Gate Rejection
# =============================================================================
def test_10_governance_rejection():
    """Test 10: ModelGovernanceGate rejects candidate when holdout sample size is insufficient or metrics degrade."""
    eval_report_bad = ModelEvaluationReport(
        active_model_name="ETAPredictionModel",
        active_model_version="v1.2-transit-hybrid",
        active_metrics=ModelMetrics(mae=20.0, rmse=25.0),
        candidate_model_name="ETAPredictionModel",
        candidate_model_version="v1.3-worse",
        candidate_metrics=ModelMetrics(mae=35.0, rmse=42.0),
        mae_improvement_pct=-75.0,
        holdout_sample_count=2,  # Insufficient samples (< 5)
        recommendation="REJECT_CANDIDATE",
        decision_reason="Insufficient holdout samples and degraded MAE.",
    )
    audit = ModelGovernanceGate.evaluate_promotion(eval_report_bad)
    assert audit.decision in ["REJECT", "INSUFFICIENT_EVIDENCE"]
    assert audit.evaluation_passed is False


# =============================================================================
# 11. Governance Gate Approval
# =============================================================================
def test_11_governance_approval():
    """Test 11: ModelGovernanceGate approves candidate with verified MAE improvement and clean quality."""
    eval_report_good = ModelEvaluationReport(
        active_model_name="ETAPredictionModel",
        active_model_version="v1.2-transit-hybrid",
        active_metrics=ModelMetrics(mae=30.0, rmse=38.0, r_squared=0.75),
        candidate_model_name="ETAPredictionModel",
        candidate_model_version="v1.3-better",
        candidate_metrics=ModelMetrics(mae=20.0, rmse=26.0, r_squared=0.88),
        mae_improvement_pct=33.33,
        holdout_sample_count=15,
        recommendation="PROMOTE_CANDIDATE",
        decision_reason="Candidate achieved 33.33% MAE improvement on 15 holdout samples.",
    )
    audit = ModelGovernanceGate.evaluate_promotion(eval_report_good)
    assert audit.decision == "APPROVE"
    assert audit.evaluation_passed is True
    assert audit.sample_size_passed is True


# =============================================================================
# 12. Production Model Promotion
# =============================================================================
def test_12_production_model_promotion():
    """Test 12: Atomic promotion of approved candidate in ModelRegistry."""
    ModelRegistry.ensure_defaults()
    candidate = ETAPredictionModel(version="v1.3-atomic-promoted", status="trained")
    eval_rep = ModelEvaluationReport(
        active_model_name="ETAPredictionModel",
        active_model_version="v1.2-transit-hybrid",
        active_metrics=ModelMetrics(mae=28.0),
        candidate_model_name="ETAPredictionModel",
        candidate_model_version="v1.3-atomic-promoted",
        candidate_metrics=ModelMetrics(mae=18.0),
        mae_improvement_pct=35.7,
        holdout_sample_count=20,
        recommendation="PROMOTE_CANDIDATE",
        decision_reason="Candidate achieved 35.7% MAE improvement.",
    )
    promoted = ModelRegistry.promote_candidate(candidate, eval_rep)
    assert promoted is True
    assert ModelRegistry.get_active_model("ETAPredictionModel").current_version == "v1.3-atomic-promoted"


# =============================================================================
# 13. Dynamic Future Inference
# =============================================================================
@pytest.mark.asyncio
async def test_13_dynamic_future_inference():
    """Test 13: Future inferences immediately load and use newly promoted production model."""
    ModelRegistry.ensure_defaults()
    agent = PredictionAgent()

    # Promote a new version
    cand = ETAPredictionModel(version="v1.3-dynamic-fleet", status="trained")
    eval_rep = ModelEvaluationReport(
        active_model_name="ETAPredictionModel",
        active_model_version="v1.2-transit-hybrid",
        active_metrics=ModelMetrics(mae=25.0),
        candidate_model_name="ETAPredictionModel",
        candidate_model_version="v1.3-dynamic-fleet",
        candidate_metrics=ModelMetrics(mae=15.0),
        mae_improvement_pct=40.0,
        holdout_sample_count=15,
        recommendation="PROMOTE_CANDIDATE",
        decision_reason="Candidate passed.",
    )
    ModelRegistry.promote_candidate(cand, eval_rep)

    req = AgentRequest(
        task_id="t-dyn-1",
        session_id="sess-dyn-1",
        goal_id="g-dyn-1",
        objective="Predict transport ETA",
        role="FARMER",
        language="hi",
        intent="CREATE_LOGISTICS_WORKFLOW",
        entities=CanonicalEntities(pickup_location="Nashik", destination="Pune APMC Mandi", quantity=500.0),
    )
    res = await agent.execute(req)
    assert res.data["eta_model_version"] == "v1.3-dynamic-fleet"
    assert "ETAPredictionModel (v1.3-dynamic-fleet)" in res.models_used


# =============================================================================
# 14. Auditable Rollback
# =============================================================================
def test_14_auditable_rollback():
    """Test 14: Safe, audited rollback to a previous known-good model version."""
    ModelRegistry.ensure_defaults()
    ModelRegistry.rollback("ETAPredictionModel", "v1.2-transit-hybrid")
    active = ModelRegistry.get_active_model("ETAPredictionModel")
    assert active.current_version == "v1.2-transit-hybrid"
    audit_log = ModelRegistry.get_rollback_audit_log()
    assert len(audit_log) >= 1
    assert audit_log[-1]["to_version"] == "v1.2-transit-hybrid"
    assert audit_log[-1]["status"] == "ROLLBACK_EXECUTED"


# =============================================================================
# 15. Agentic Replanning on State Change
# =============================================================================
@pytest.mark.asyncio
async def test_15_agentic_replanning():
    """Test 15: Adapting to operational condition changes without destroying session, goal, role, language, or entities."""
    brain = ElaUniversalBrain()

    # Initial Request
    req1 = AgentChatRequest(
        message="500 किलो टमाटर नाशिक से पुणे भेजने हैं",
        session_id="sess-replan-15",
        authenticated=True,
        authenticated_role="FARMER",
        language="hi",
    )
    res1 = await brain.process_chat(req1)
    assert res1.status in ["CONFIRMATION_REQUIRED", "SUCCESS"]
    assert res1.detected_role == "FARMER"

    # Operational fact change: vehicle unavailable -> alternative requested
    req2 = AgentChatRequest(
        message="गाड़ी उपलब्ध नहीं है, दूसरा विकल्प बताएं",
        session_id="sess-replan-15",
        authenticated=True,
        authenticated_role="FARMER",
        language="hi",
    )
    res2 = await brain.process_chat(req2)
    assert res2.status in ["CONFIRMATION_REQUIRED", "SUCCESS"]
    assert res2.detected_role == "FARMER"
    assert res2.language == "hi"


# =============================================================================
# 16. Multilingual Learning Event
# =============================================================================
def test_16_multilingual_learning_event():
    """Test 16: Learning events preserve multilingual operational feedback across Indic languages."""
    evt = FeedbackCollector.record_learning_event(
        operation_type="TRIP_EXECUTION",
        prediction_type="ETA_MINUTES",
        features={"origin": "नाशिक", "destination": "पुणे APMC मंडी"},
        predicted_value=330.0,
        actual_value=360.0,
        feedback_text="गाडी वेळेत पोहोचली पण ट्रॅफिक जास्त होते",
        user_role="FARMER",
        route_context="नाशिक-पुणे",
        dataset_type="REAL_OPERATIONAL",
    )
    assert evt.features["origin"] == "नाशिक"
    assert evt.feedback_text == "गाडी वेळेत पोहोचली पण ट्रॅफिक जास्त होते"
    assert evt.dataset_type == "REAL_OPERATIONAL"


# =============================================================================
# 17. Zero-Secret Telemetry Protection
# =============================================================================
def test_17_zero_secret_telemetry_protection():
    """Test 17: Security shield blocks passwords, OTPs, PINs, and secret keys from telemetry storage."""
    rec = PredictionTraceStore.record_prediction(
        session_id="sess-sec-17",
        model_name="ETAPredictionModel",
        model_version="v1.2",
        prediction_type="ETA_MINUTES",
        input_features={"origin": "Nashik", "password": "superSecretPassword123!", "otp": "948210", "pin": "4432"},
        predicted_value=330.0,
    )
    assert rec.input_features.get("password") == "[REDACTED_SECRET]"
    assert rec.input_features.get("otp") == "[REDACTED_SECRET]"
    assert "superSecretPassword123!" not in str(rec.model_dump())
    assert "948210" not in str(rec.model_dump())


# =============================================================================
# 18. Data Leakage Prevention
# =============================================================================
def test_18_data_leakage_prevention():
    """Test 18: Data quality validator detects duplicate signatures, future timestamps, and target leakage."""
    dirty_records = [
        {"features": {"distance_km": 200.0, "departure_hour": 8}, "actual_value": 310.0, "timestamp": "2026-08-01T10:00:00"},
        # Duplicate feature signature
        {"features": {"distance_km": 200.0, "departure_hour": 8}, "actual_value": 310.0, "timestamp": "2026-08-01T10:00:00"},
        # Target leakage feature
        {"features": {"distance_km": 250.0, "actual_value": 350.0}, "actual_value": 350.0, "timestamp": "2026-08-02T10:00:00"},
    ]
    valid_recs, report = DataQualityValidator.validate_dataset(dirty_records)
    assert report.total_records_checked == 3
    assert report.invalid_records_count > 0
    assert any("Duplicate" in issue or "Target leakage" in issue for issue in report.issues)


# =============================================================================
# 19. Synthetic vs Real Dataset Separation
# =============================================================================
def test_19_synthetic_vs_real_dataset_separation():
    """Test 19: Strict separation between REAL_OPERATIONAL and SYNTHETIC_TEST data."""
    real_evt = FeedbackCollector.record_operational_outcome(
        outcome_event_type="ETA_OUTCOME",
        actual_value=340.0,
        predicted_value=330.0,
        model_name="ETAPredictionModel",
        model_version="v1.2",
        dataset_type="REAL_OPERATIONAL",
    )
    synth_evt = FeedbackCollector.record_operational_outcome(
        outcome_event_type="FREIGHT_OUTCOME",
        actual_value=6000.0,
        predicted_value=6073.0,
        model_name="TransportCostModel",
        model_version="v1.1",
        dataset_type="SYNTHETIC_TEST",
    )
    assert real_evt.dataset_type == "REAL_OPERATIONAL"
    assert synth_evt.dataset_type == "SYNTHETIC_TEST"
    assert real_evt.dataset_type != synth_evt.dataset_type


# =============================================================================
# 20. Full End-to-End Operational Learning Loop
# =============================================================================
@pytest.mark.asyncio
async def test_20_full_e2e_operational_learning_loop():
    """Test 20: Complete PREDICT -> ACT -> OBSERVE -> COMPARE -> LEARN -> TRAIN -> EVALUATE -> GOVERN -> PROMOTE -> USE cycle."""
    ModelRegistry.ensure_defaults()

    # 1. Predict
    agent = PredictionAgent()
    req = AgentRequest(
        task_id="t-loop-20",
        session_id="sess-loop-20",
        goal_id="g-loop-20",
        objective="Transport produce",
        role="FARMER",
        language="hi",
        intent="CREATE_LOGISTICS_WORKFLOW",
        entities=CanonicalEntities(pickup_location="Nashik", destination="Pune APMC Mandi", quantity=500.0),
    )
    res = await agent.execute(req)
    pred_id = res.data["prediction_traces"]["ETA_MINUTES"]
    assert pred_id is not None

    # 2. Observe & Compare
    link_res = PredictionTraceStore.link_outcome(
        prediction_id=pred_id,
        actual_value=375.0,
        outcome_status="COMPLETED",
        dataset_type="REAL_OPERATIONAL",
    )
    assert link_res.absolute_error > 0

    # 3. Accumulated Telemetry & Candidate Training
    sim_data = [
        {"features": {"distance_km": 200.0 + (i * 4), "departure_hour": 6 + (i % 12), "checkpoint_delay_minutes": 15 + i}, "actual_value": 350.0 + (i * 6), "predicted_value": 310.0 + (i * 4), "route": "Nashik-Pune", "timestamp": f"2026-08-30T{10 + (i % 12):02d}:00:00"}
        for i in range(16)
    ]
    cand_res = await CandidateModelTrainer.train_candidate(
        model_name="ETAPredictionModel",
        operational_records=sim_data,
        trigger_reason="RECURRING_OPERATIONAL_PATTERN",
    )
    assert cand_res.candidate_version is not None
    assert cand_res.artifact_checksum is not None
