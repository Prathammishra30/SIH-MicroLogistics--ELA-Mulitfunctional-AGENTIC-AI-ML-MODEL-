# Phase 12.4 Adaptive Execution & Closed-Loop Learning Verification Suite
import pytest
import asyncio
from datetime import datetime, timezone

from ai.ela.learning.outcomes import (
    ElaVerifiedOutcome,
    OutcomeLinkageChain,
    OutcomeManager,
)
from ai.ela.learning.deviations import (
    DeviationResult,
    DeviationAnalyzer,
    ErrorCategorizer,
)
from ai.ela.learning.events import (
    ElaLearningEvent,
    LearningEventManager,
    PrivacySanitizer,
)
from ai.ela.learning.adaptation import (
    ElaAdaptationProposal,
    CorridorAdjustmentSignal,
    AdaptationEngine,
)
from ai.ela.learning.evaluator import GovernedModelEvaluator
from ai.ela.learning.governance import ModelGovernanceGate
from ai.ela.learning.registry import ModelRegistry
from ai.ela.learning.candidate_trainer import CandidateModelTrainer
from ai.ela.planner.models import ElaPlan, ElaPlanStep, ElaPlanObservation
from ai.ela.planner.observation import ObservationEngine
from ai.ela.agent.brain import ElaUniversalBrain
from ai.ela.agent.loop import AgentChatRequest


@pytest.fixture(autouse=True)
def reset_state():
    OutcomeManager.reset_for_testing()
    LearningEventManager.reset_for_testing()
    AdaptationEngine.reset_for_testing()
    ObservationEngine.reset_for_testing()
    ModelRegistry.reset_for_testing()
    yield
    OutcomeManager.reset_for_testing()
    LearningEventManager.reset_for_testing()
    AdaptationEngine.reset_for_testing()
    ObservationEngine.reset_for_testing()
    ModelRegistry.reset_for_testing()


# =============================================================================
# 1. Authoritative Verified Outcome Tests
# =============================================================================
def test_verified_outcome_creation_and_fields():
    outcome = OutcomeManager.record_outcome(
        expected_result={"eta_minutes": 180, "cost": 2800},
        actual_result={"eta_minutes": 210, "cost": 2850, "booking_id": "BK-TEST-101"},
        outcome_type="DELIVERY",
        verification_source="JAVA_AUTHORITY",
        plan_id="plan-test-1",
        step_id="step-exec-1",
        goal_id="goal-test-1",
        session_id="sess-test-1",
        booking_id="BK-TEST-101",
        provenance="REAL_OPERATIONAL",
    )
    assert outcome.outcome_id.startswith("out-")
    assert outcome.verification_status == "VERIFIED"
    assert outcome.booking_id == "BK-TEST-101"
    assert outcome.provenance == "REAL_OPERATIONAL"
    assert outcome.linkage.plan_id == "plan-test-1"
    assert outcome.linkage.step_id == "step-exec-1"


def test_non_authoritative_outcome_quarantine():
    # Natural language claims or unverified step outcomes without authoritative backing cannot be VERIFIED
    outcome = OutcomeManager.record_outcome(
        expected_result={"eta_minutes": 120},
        actual_result={"message": "Driver says arrived", "status": "COMPLETED"},
        outcome_type="DELIVERY",
        verification_source="UNVERIFIED_CLAIM",
        plan_id="plan-unverified",
        step_id="step-1",
        provenance="REAL_OPERATIONAL",
    )
    assert outcome.verification_status == "QUARANTINED"
    assert "AUTHORITY" not in outcome.verification_source


def test_outcome_duplicate_protection_idempotency():
    outcome1 = OutcomeManager.record_outcome(
        expected_result={"eta_minutes": 180},
        actual_result={"eta_minutes": 195, "booking_id": "BK-IDEM-001"},
        outcome_type="DELIVERY",
        verification_source="JAVA_AUTHORITY",
        plan_id="plan-idem",
        step_id="step-idem",
        booking_id="BK-IDEM-001",
    )
    # Re-recording identical booking should return same outcome ID without duplicate entry
    outcome2 = OutcomeManager.record_outcome(
        expected_result={"eta_minutes": 180},
        actual_result={"eta_minutes": 195, "booking_id": "BK-IDEM-001"},
        outcome_type="DELIVERY",
        verification_source="JAVA_AUTHORITY",
        plan_id="plan-idem",
        step_id="step-idem",
        booking_id="BK-IDEM-001",
    )
    assert outcome1.outcome_id == outcome2.outcome_id
    assert len(OutcomeManager.get_all_outcomes()) == 1


# =============================================================================
# 2. Expected vs. Actual Deviation & Error Categorization Tests
# =============================================================================
def test_expected_vs_actual_residuals():
    expected = {"eta_minutes": 120.0, "cost": 2500.0, "success_probability": 0.95}
    actual = {"eta_minutes": 155.0, "cost": 3100.0, "success_probability": 0.80}

    deviations = DeviationAnalyzer.analyze_outcome(
        outcome_id="out-dev-1",
        expected=expected,
        actual=actual,
    )
    dev_map = {d.metric_name: d for d in deviations}

    assert "eta_minutes" in dev_map
    assert dev_map["eta_minutes"].expected_value == 120.0
    assert dev_map["eta_minutes"].actual_value == 155.0
    assert dev_map["eta_minutes"].residual == 35.0
    assert dev_map["eta_minutes"].is_significant is True

    assert "cost" in dev_map
    assert dev_map["cost"].residual == 600.0
    assert dev_map["cost"].percentage_error == 24.0
    assert dev_map["cost"].is_significant is True


def test_error_categorization_logic():
    # Severe delay with road closure context -> EXOGENOUS_EVENT
    cat_exo = ErrorCategorizer.categorize(
        metric_name="eta_minutes",
        expected=120.0,
        actual=240.0,
        residual=120.0,
        operational_context={"road_block": True, "weather": "heavy_rain"},
    )
    assert cat_exo == "EXOGENOUS_EVENT"

    # Severe operational breakdown
    cat_ops = ErrorCategorizer.categorize(
        metric_name="eta_minutes",
        expected=120.0,
        actual=300.0,
        residual=180.0,
        operational_context={"engine_breakdown": True},
    )
    assert cat_ops == "OPERATIONAL_FAILURE"

    # Unexplained moderate model residual -> MODEL_ERROR
    cat_model = ErrorCategorizer.categorize(
        metric_name="eta_minutes",
        expected=120.0,
        actual=145.0,
        residual=25.0,
        operational_context={},
    )
    assert cat_model == "MODEL_ERROR"


# =============================================================================
# 3. Normalized Learning Events & Privacy Sanitization Tests
# =============================================================================
def test_privacy_sanitizer_zero_credentials():
    dirty_context = {
        "user_phone": "9876543210",
        "api_key": "AIzaSySecretApiKey123",
        "password": "SuperSecretPassword!",
        "route": "Nashik to Pune",
        "weight_kg": 500,
    }
    sanitized = PrivacySanitizer.sanitize(dirty_context)
    assert "api_key" not in sanitized
    assert "password" not in sanitized
    assert sanitized["user_phone"] == "[REDACTED_PHONE]"
    assert sanitized["route"] == "Nashik to Pune"


def test_provenance_stream_isolation():
    # Record real operational outcome
    real_outcome = OutcomeManager.record_outcome(
        expected_result={"eta_minutes": 100},
        actual_result={"eta_minutes": 125, "booking_id": "BK-REAL-1"},
        outcome_type="DELIVERY",
        verification_source="JAVA_AUTHORITY",
        plan_id="p-real",
        step_id="s-real",
        booking_id="BK-REAL-1",
        provenance="REAL_OPERATIONAL",
    )
    # Record synthetic test outcome
    synth_outcome = OutcomeManager.record_outcome(
        expected_result={"eta_minutes": 100},
        actual_result={"eta_minutes": 125, "booking_id": "BK-SYNTH-1"},
        outcome_type="DELIVERY",
        verification_source="JAVA_AUTHORITY",
        plan_id="p-synth",
        step_id="s-synth",
        booking_id="BK-SYNTH-1",
        provenance="SYNTHETIC_TEST",
    )

    dev_real = DeviationResult(
        outcome_id=real_outcome.outcome_id,
        metric_name="eta_minutes",
        expected_value=100.0,
        actual_value=125.0,
        residual=25.0,
        error_category="MODEL_ERROR",
    )
    dev_synth = DeviationResult(
        outcome_id=synth_outcome.outcome_id,
        metric_name="eta_minutes",
        expected_value=100.0,
        actual_value=125.0,
        residual=25.0,
        error_category="MODEL_ERROR",
    )

    ev_real = LearningEventManager.create_learning_event_from_deviation(
        outcome=real_outcome,
        deviation=dev_real,
        model_name="ETAPredictionModel",
        corridor="Nashik-Pune",
    )
    ev_synth = LearningEventManager.create_learning_event_from_deviation(
        outcome=synth_outcome,
        deviation=dev_synth,
        model_name="ETAPredictionModel",
        corridor="Nashik-Pune",
    )

    real_events = LearningEventManager.get_events(provenance="REAL_OPERATIONAL")
    synth_events = LearningEventManager.get_events(provenance="SYNTHETIC_TEST")

    assert len(real_events) == 1
    assert len(synth_events) == 1
    assert real_events[0].event_id == ev_real.event_id
    assert synth_events[0].event_id == ev_synth.event_id
    # Real event stream must not contain synthetic event
    assert not any(e.provenance == "SYNTHETIC_TEST" for e in real_events)


# =============================================================================
# 4. Preliminary vs. Statistically Confident Adaptation Evidence Tests
# =============================================================================
def test_preliminary_vs_confident_adaptation_signal():
    # 1. Single sample should yield PRELIMINARY confidence category
    outcome1 = OutcomeManager.record_outcome(
        expected_result={"eta_minutes": 100},
        actual_result={"eta_minutes": 125, "booking_id": "BK-CORR-1"},
        outcome_type="DELIVERY",
        verification_source="JAVA_AUTHORITY",
        plan_id="p-1",
        step_id="s-1",
        booking_id="BK-CORR-1",
    )
    dev1 = DeviationResult(
        outcome_id=outcome1.outcome_id,
        metric_name="eta_minutes",
        expected_value=100.0,
        actual_value=125.0,
        residual=25.0,
        error_category="MODEL_ERROR",
    )
    LearningEventManager.create_learning_event_from_deviation(
        outcome=outcome1,
        deviation=dev1,
        model_name="ETAPredictionModel",
        corridor="Nashik-Mumbai",
    )

    sig_prelim = AdaptationEngine.evaluate_corridor_evidence(corridor="Nashik-Mumbai")
    assert sig_prelim is not None
    assert sig_prelim.confidence_category == "PRELIMINARY"
    assert sig_prelim.sample_count == 1
    assert sig_prelim.delay_offset_minutes == 25.0

    # Under 5 samples, no formal retraining proposal should be posted yet
    assert len(AdaptationEngine.get_all_proposals()) == 0

    # 2. Add up to 10 samples to reach STATISTICALLY_CONFIDENT threshold
    for i in range(2, 12):
        out_i = OutcomeManager.record_outcome(
            expected_result={"eta_minutes": 100},
            actual_result={"eta_minutes": 122 + (i % 5), "booking_id": f"BK-CORR-{i}"},
            outcome_type="DELIVERY",
            verification_source="JAVA_AUTHORITY",
            plan_id=f"p-{i}",
            step_id=f"s-{i}",
            booking_id=f"BK-CORR-{i}",
        )
        dev_i = DeviationResult(
            outcome_id=out_i.outcome_id,
            metric_name="eta_minutes",
            expected_value=100.0,
            actual_value=float(122 + (i % 5)),
            residual=float(22 + (i % 5)),
            error_category="MODEL_ERROR",
        )
        LearningEventManager.create_learning_event_from_deviation(
            outcome=out_i,
            deviation=dev_i,
            model_name="ETAPredictionModel",
            corridor="Nashik-Mumbai",
        )

    sig_conf = AdaptationEngine.evaluate_corridor_evidence(corridor="Nashik-Mumbai")
    assert sig_conf is not None
    assert sig_conf.confidence_category == "STATISTICALLY_CONFIDENT"
    assert sig_conf.sample_count == 11
    assert sig_conf.delay_offset_minutes >= 20.0

    # Systematic bias >= 15 mins with >= 5 samples triggers formal adaptation proposal
    proposals = AdaptationEngine.get_all_proposals()
    assert len(proposals) >= 1
    prop = proposals[0]
    assert prop.target_model == "ETAPredictionModel"
    assert prop.supporting_sample_count >= 5
    assert prop.status == "PROPOSED"


# =============================================================================
# 5. Production Model Immutability & Candidate Training Gate Tests
# =============================================================================
@pytest.mark.asyncio
async def test_production_immutability_and_candidate_gate():
    ModelRegistry.ensure_defaults()
    baseline_eta = ModelRegistry.get_active_model("ETAPredictionModel")
    assert baseline_eta is not None
    baseline_version = baseline_eta.current_version

    # Simulate operational telemetry
    operational_records = [
        {
            "features": {"distance_km": 150.0 + (i * 2), "load_weight_kg": 500.0, "route_type": "HIGHWAY", "weather_condition": "CLEAR"},
            "actual_value": 200.0 + (i * 2.5),
            "timestamp": f"2026-09-04T10:{i:02d}:00Z",
        }
        for i in range(20)
    ]

    holdout_records = [
        {
            "features": {"distance_km": 160.0 + (i * 3), "load_weight_kg": 600.0, "route_type": "HIGHWAY", "weather_condition": "CLEAR"},
            "actual_value": 210.0 + (i * 3.5),
            "timestamp": f"2026-09-04T11:{i:02d}:00Z",
        }
        for i in range(6)
    ]

    # Candidate training run
    result = await CandidateModelTrainer.train_candidate(
        model_name="ETAPredictionModel",
        operational_records=operational_records,
        holdout_records=holdout_records,
    )

    assert result.model_name == "ETAPredictionModel"
    assert result.parent_version == baseline_version
    assert result.candidate_version != baseline_version
    assert result.artifact_checksum != ""
    assert result.evaluation_report is not None

    # If candidate failed holdout improvement criteria, production model must remain untouched
    if result.governance_decision == "REJECT":
        assert ModelRegistry.get_active_model("ETAPredictionModel").current_version == baseline_version
        assert result.promoted_to_production is False


# =============================================================================
# 6. Model Rollback Audit Test
# =============================================================================
def test_model_registry_rollback():
    ModelRegistry.ensure_defaults()
    from ai.ela.ml.models.eta import ETAPredictionModel

    original_active = ModelRegistry.get_active_model("ETAPredictionModel")
    orig_ver = original_active.current_version

    # Promote a new candidate
    new_candidate = ETAPredictionModel(version="v2.0-candidate-test", status="production")
    ModelRegistry.register_model(new_candidate, status="production", parent_version=orig_ver)
    assert ModelRegistry.get_active_model("ETAPredictionModel").current_version == "v2.0-candidate-test"

    # Roll back
    rollback_meta = ModelRegistry.rollback_model("ETAPredictionModel", target_version=orig_ver)
    assert rollback_meta is not None
    assert rollback_meta.version == orig_ver
    assert ModelRegistry.get_active_model("ETAPredictionModel").current_version == orig_ver

    # Audit log entry exists
    audit_log = ModelRegistry.get_rollback_audit_log()
    assert len(audit_log) >= 1
    assert audit_log[-1]["rolled_back_to"] == orig_ver


# =============================================================================
# 7. Planner Integration with Corridor Adjustment Signals Tests
# =============================================================================
@pytest.mark.asyncio
async def test_planner_consumes_corridor_signal_in_execution_trace():
    brain = ElaUniversalBrain()

    # Pre-register a confident corridor adjustment signal on Nashik to Pune APMC Mandi
    corridor_key = "Nashik-Pune APMC Mandi"
    # Seed 10 events to generate a statistically confident signal
    for i in range(10):
        out_i = OutcomeManager.record_outcome(
            expected_result={"eta_minutes": 180},
            actual_result={"eta_minutes": 215, "booking_id": f"BK-PUNE-{i}"},
            outcome_type="DELIVERY",
            verification_source="JAVA_AUTHORITY",
            plan_id=f"plan-{i}",
            step_id=f"step-{i}",
            booking_id=f"BK-PUNE-{i}",
        )
        dev_i = DeviationResult(
            outcome_id=out_i.outcome_id,
            metric_name="eta_minutes",
            expected_value=180.0,
            actual_value=215.0,
            residual=35.0,
            error_category="MODEL_ERROR",
        )
        LearningEventManager.create_learning_event_from_deviation(
            outcome=out_i,
            deviation=dev_i,
            model_name="ETAPredictionModel",
            corridor=corridor_key,
        )

    sig = AdaptationEngine.evaluate_corridor_evidence(corridor=corridor_key)
    assert sig is not None
    assert sig.confidence_category == "STATISTICALLY_CONFIDENT"

    # Send a request on that corridor
    req = AgentChatRequest(
        message="Book 500kg tomatoes from Nashik to Pune APMC Mandi fast",
        user_id="farmer-pune-test",
        authenticated_role="FARMER",
        authenticated=True,
        language="en",
    )
    resp = await brain.process_chat(req)
    assert resp.status in ["SUCCESS", "CONFIRMATION_REQUIRED"]
    assert resp.trace is not None
    assert resp.trace.learning is not None
    assert resp.trace.learning.get("corridor_adjustment_applied") is True
    assert resp.trace.learning.get("corridor") == corridor_key
    assert resp.trace.learning.get("corridor_signal") is not None
    assert resp.trace.learning["corridor_signal"]["delay_offset_minutes"] == 35.0


# =============================================================================
# 8. Transformer Neural Core Closed-Loop Candidate Evaluation Test
# =============================================================================
@pytest.mark.asyncio
async def test_transformer_candidate_evaluation():
    from ai.ela.neural.transformer.inference import TransformerNeuralCore
    from ai.ela.neural.transformer.config import TransformerConfig

    core = TransformerNeuralCore.get_instance()
    eval_dataset = [
        {
            "features": {"role": "FARMER", "commodity": "Tomatoes", "weight_kg": 500, "origin": "Nashik", "destination": "Pune"},
            "actual_value": 0.85,
        }
        for _ in range(5)
    ]
    metrics = await core.evaluate(eval_dataset)
    assert metrics.sample_count == 5
    assert metrics.mae >= 0.0
    assert metrics.rmse >= 0.0


# =============================================================================
# 9. Linkage Chain Traversal & Full Traceability Test
# =============================================================================
def test_outcome_linkage_chain_traversal():
    outcome = OutcomeManager.record_outcome(
        expected_result={"eta_minutes": 150},
        actual_result={"eta_minutes": 170, "booking_id": "BK-LINK-99"},
        outcome_type="DELIVERY",
        verification_source="JAVA_AUTHORITY",
        plan_id="plan-link-1",
        step_id="step-link-1",
        goal_id="goal-link-1",
        session_id="sess-link-1",
        booking_id="BK-LINK-99",
    )
    dev = DeviationResult(
        outcome_id=outcome.outcome_id,
        metric_name="eta_minutes",
        expected_value=150.0,
        actual_value=170.0,
        residual=20.0,
        error_category="MODEL_ERROR",
    )
    event = LearningEventManager.create_learning_event_from_deviation(
        outcome=outcome,
        deviation=dev,
        model_name="ETAPredictionModel",
        corridor="Nashik-Pune",
    )
    assert event is not None
    # Verify traversal from event to outcome to linkage
    assert event.source_outcome_id == outcome.outcome_id
    linkage = outcome.linkage
    assert linkage is not None
    assert linkage.plan_id == "plan-link-1"
    assert linkage.step_id == "step-link-1"
    assert linkage.goal_id == "goal-link-1"
    assert linkage.session_id == "sess-link-1"
    assert linkage.booking_id == "BK-LINK-99"
    assert linkage.learning_event_id == event.event_id


# =============================================================================
# 10. Complete Error Categorization Matrix Test
# =============================================================================
def test_all_error_categories():
    # EXOGENOUS_EVENT
    assert ErrorCategorizer.categorize("eta", operational_context={"weather": "storm"}) == "EXOGENOUS_EVENT"
    # OPERATIONAL_FAILURE
    assert ErrorCategorizer.categorize("eta", operational_context={"carrier_refusal": True}) == "OPERATIONAL_FAILURE"
    # INPUT_ERROR
    assert ErrorCategorizer.categorize("eta", operational_context={"bad_origin": True}) == "INPUT_ERROR"
    # PLAN_ERROR
    assert ErrorCategorizer.categorize("eta", operational_context={"plan_cycle": True}) == "PLAN_ERROR"
    # EXECUTION_ERROR
    assert ErrorCategorizer.categorize("eta", operational_context={"tool_execution_failed": True}) == "EXECUTION_ERROR"
    # CONTEXT_SHIFT
    assert ErrorCategorizer.categorize("eta", operational_context={"diwali_surge": True}) == "CONTEXT_SHIFT"
    # MODEL_ERROR (normal operating conditions)
    assert ErrorCategorizer.categorize("eta", operational_context={}) == "MODEL_ERROR"


# =============================================================================
# 11. Governance Gate Strict Approval and Rejection Tests
# =============================================================================
@pytest.mark.asyncio
async def test_candidate_governance_approval_on_improvement():
    ModelRegistry.ensure_defaults()
    from ai.ela.learning.evaluator import ModelEvaluationReport
    from ai.ela.ml.types import ModelMetrics
    from ai.ela.data.validation import DataQualityReport
    from ai.ela.learning.leakage_audit import LeakageAuditReport

    # Synthetic evaluation report where candidate is strictly better (>5% MAE improvement)
    eval_report = ModelEvaluationReport(
        active_model_name="ETAPredictionModel",
        active_model_version="v1.2-transit-hybrid",
        active_metrics=ModelMetrics(mae=20.0, rmse=25.0, sample_count=30),
        candidate_model_name="ETAPredictionModel",
        candidate_model_version="v1.2-cand-better",
        candidate_metrics=ModelMetrics(mae=15.0, rmse=18.0, sample_count=30),
        mae_improvement_pct=25.0,
        rmse_improvement_pct=28.0,
        holdout_sample_count=30,
        recommendation="PROMOTE_CANDIDATE",
        decision_reason="Candidate achieved 25.00% MAE improvement on holdout.",
    )
    dq_report = DataQualityReport(
        total_records_checked=50,
        valid_records_count=50,
        invalid_records_count=0,
        outliers_detected=0,
        leakage_detected=False,
        temporal_order_valid=True,
        validation_status="PASSED",
    )
    leakage_report = LeakageAuditReport(
        model_name="ETAPredictionModel",
        overall_status="PASS",
    )

    decision = ModelGovernanceGate.evaluate_promotion(
        candidate_model_or_report=eval_report,
        data_quality_report=dq_report,
        leakage_report=leakage_report,
    )
    assert decision.final_decision == "APPROVE"
    assert decision.promotable is True


@pytest.mark.asyncio
async def test_candidate_governance_rejection_on_degradation():
    ModelRegistry.ensure_defaults()
    from ai.ela.learning.evaluator import ModelEvaluationReport
    from ai.ela.ml.types import ModelMetrics
    from ai.ela.data.validation import DataQualityReport
    from ai.ela.learning.leakage_audit import LeakageAuditReport

    # Candidate has worse MAE (regression)
    eval_report = ModelEvaluationReport(
        active_model_name="ETAPredictionModel",
        active_model_version="v1.2-transit-hybrid",
        active_metrics=ModelMetrics(mae=20.0, rmse=25.0, sample_count=30),
        candidate_model_name="ETAPredictionModel",
        candidate_model_version="v1.2-cand-worse",
        candidate_metrics=ModelMetrics(mae=25.0, rmse=30.0, sample_count=30),
        mae_improvement_pct=-25.0,
        rmse_improvement_pct=-20.0,
        holdout_sample_count=30,
        recommendation="REJECT_CANDIDATE",
        decision_reason="Candidate degraded performance by 25%.",
    )
    dq_report = DataQualityReport(
        total_records_checked=50,
        valid_records_count=50,
        invalid_records_count=0,
        outliers_detected=0,
        leakage_detected=False,
        temporal_order_valid=True,
        validation_status="PASSED",
    )
    leakage_report = LeakageAuditReport(
        model_name="ETAPredictionModel",
        overall_status="PASS",
    )

    decision = ModelGovernanceGate.evaluate_promotion(
        candidate_model_or_report=eval_report,
        data_quality_report=dq_report,
        leakage_report=leakage_report,
    )
    assert decision.final_decision == "REJECT"
    assert decision.promotable is False


# =============================================================================
# 12. Observation Engine Traceability & Graceful Degradation Test
# =============================================================================
def test_observation_engine_and_graceful_degradation():
    obs = ObservationEngine.record_observation(
        plan_id="plan-obs-1",
        step_id="step-obs-1",
        expected_result={"eta_minutes": 120, "cost": 2500},
        actual_result={"eta_minutes": 140, "cost": 2700, "booking_id": "BK-OBS-01"},
        outcome_status="SUCCEEDED",
        evidence={"backend": "Spring Boot"},
        world_state_delta={"status": "BOOKED"},
    )
    assert obs is not None
    assert obs.evidence.get("outcome_id") is not None
    assert obs.evidence.get("verification_status") == "VERIFIED"
    assert obs.evidence.get("deviations_count") >= 1
    assert len(obs.evidence.get("learning_event_ids", [])) >= 1

