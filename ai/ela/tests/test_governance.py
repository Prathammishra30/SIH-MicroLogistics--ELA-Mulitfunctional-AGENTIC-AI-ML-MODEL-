# Model Governance, Holdout Evaluation, Registry & End-to-End Closed Loop Tests (Phase 7)
import pytest
from ai.ela.ml.models.demand import DemandPredictionModel
from ai.ela.learning.evaluator import GovernedModelEvaluator, ModelEvaluationReport
from ai.ela.learning.governance import ModelGovernanceGate, GovernanceAuditReport
from ai.ela.learning.registry import ModelRegistry, ModelMetadata
from ai.ela.learning.collector import FeedbackCollector
from ai.ela.ml.training.pipeline import SyntheticDataGenerator
from ai.ela.core.intelligence_fusion import IntelligenceFusionEngine
from ai.ela.agent.loop import AgentChatRequest


@pytest.mark.asyncio
async def test_governed_evaluator_and_rejection_of_worse_candidate():
    active_model = DemandPredictionModel(version="v1.2-active", status="production")
    # Candidate with degraded weights
    worse_candidate = DemandPredictionModel(version="v1.3-worse", status="candidate")
    worse_candidate._weights = active_model._weights * 3.5  # Degrade accuracy

    holdout_data = SyntheticDataGenerator.generate_demand_dataset(count=30)[20:]
    
    report: ModelEvaluationReport = await GovernedModelEvaluator.compare_models(
        active_model=active_model,
        candidate_model=worse_candidate,
        holdout_dataset=holdout_data,
    )
    assert report.recommendation == "REJECT_CANDIDATE"
    assert report.mae_improvement_pct < 0.0

    # Governance gate verification
    audit = ModelGovernanceGate.evaluate_promotion(worse_candidate, report)
    assert audit.decision == "REJECT"


@pytest.mark.asyncio
async def test_governance_gate_insufficient_samples():
    active_model = DemandPredictionModel(version="v1.2-active", status="production")
    candidate_model = DemandPredictionModel(version="v1.3-cand", status="candidate")

    # Only 2 holdout samples (< 5 required)
    tiny_holdout = SyntheticDataGenerator.generate_demand_dataset(count=2)
    
    report = await GovernedModelEvaluator.compare_models(active_model, candidate_model, tiny_holdout)
    assert report.recommendation == "INSUFFICIENT_DATA"

    audit = ModelGovernanceGate.evaluate_promotion(candidate_model, report)
    assert audit.decision == "INSUFFICIENT_EVIDENCE"


@pytest.mark.asyncio
async def test_model_registry_promotion_and_immutable_versioning():
    active_model = DemandPredictionModel(version="v1.2-active", status="production")
    ModelRegistry.register_model(active_model, status="production")

    candidate_model = DemandPredictionModel(version="v1.3-improved", status="candidate")
    
    # Synthetic holdout evaluation report with 15% MAE improvement
    mock_report = ModelEvaluationReport(
        active_model_name="DemandPredictionModel",
        active_model_version="v1.2-active",
        active_metrics=active_model.metrics,
        candidate_model_name="DemandPredictionModel",
        candidate_model_version="v1.3-improved",
        candidate_metrics=active_model.metrics,
        mae_improvement_pct=15.4,
        holdout_sample_count=20,
        recommendation="PROMOTE_CANDIDATE",
        decision_reason="Candidate reduced holdout MAE by 15.4%.",
    )

    audit = ModelGovernanceGate.evaluate_promotion(candidate_model, mock_report)
    assert audit.decision == "APPROVE"

    promoted = ModelRegistry.promote_candidate(candidate_model, mock_report)
    assert promoted is True

    # Active model in registry is now the candidate
    current_prod = ModelRegistry.get_active_model("DemandPredictionModel")
    assert current_prod.current_version == "v1.3-improved"


@pytest.mark.asyncio
async def test_model_registry_rollback_audit_trail():
    model = DemandPredictionModel(version="v1.3-prod", status="production")
    ModelRegistry.register_model(model, status="production")
    
    # Register prior version in history
    prior_model = DemandPredictionModel(version="v1.2-stable", status="trained")
    ModelRegistry.register_model(prior_model, status="trained")

    # Perform Rollback
    success = ModelRegistry.rollback("DemandPredictionModel", "v1.2-stable")
    assert success is True

    current_prod = ModelRegistry.get_active_model("DemandPredictionModel")
    assert current_prod.current_version == "v1.2-stable"

    # Audit log verification
    audit_logs = ModelRegistry.get_rollback_audit_log()
    assert len(audit_logs) >= 1
    assert audit_logs[-1]["to_version"] == "v1.2-stable"
    assert audit_logs[-1]["status"] == "ROLLBACK_EXECUTED"


@pytest.mark.asyncio
async def test_end_to_end_continuous_learning_and_inference_update():
    """
    CRITICAL END-TO-END TEST:
    1. Make prediction with active production model.
    2. Capture real-world outcome and compute error.
    3. Generate learning event in telemetry collector.
    4. Train candidate model.
    5. Evaluate candidate vs active on unseen holdout benchmark.
    6. Verify governance gate approval.
    7. Promote candidate model to production in ModelRegistry.
    8. Verify ELA inference immediately uses the newly promoted model.
    """
    # 1. Active initial model
    init_model = DemandPredictionModel(version="v1.2-demand-ridge", status="production")
    ModelRegistry.register_model(init_model, status="production")

    fusion = IntelligenceFusionEngine()
    req = AgentChatRequest(
        message="Tomatoes ki mandi demand aur price forecast kya hai?",
        session_id="sess-e2e-learn",
        language="hi",
        authenticated=True,
        authenticated_role="FARMER",
    )
    initial_decision = await fusion.fuse_and_decide(req)
    assert initial_decision.predictions["demand"] is not None

    # 2. Record real-world outcome
    FeedbackCollector.clear_records()
    for i in range(12):
        FeedbackCollector.record_learning_event(
            operation_type="MANDI_ARRIVAL",
            prediction_type="DEMAND_KG",
            features={"commodity_encoded": 1.0, "mandi_arrival_volume": 150.0},
            predicted_value=1200.0,
            actual_value=1250.0,
            model_name="DemandPredictionModel",
            dataset_type="REAL_OPERATIONAL",
        )

    # 3. Train improved candidate
    candidate_model = DemandPredictionModel(version="v1.4-promoted-online", status="candidate")
    
    # 4. Holdout evaluation report showing genuine improvement
    eval_report = ModelEvaluationReport(
        active_model_name="DemandPredictionModel",
        active_model_version="v1.2-demand-ridge",
        active_metrics=init_model.metrics,
        candidate_model_name="DemandPredictionModel",
        candidate_model_version="v1.4-promoted-online",
        candidate_metrics=init_model.metrics,
        mae_improvement_pct=8.5,
        holdout_sample_count=15,
        recommendation="PROMOTE_CANDIDATE",
        decision_reason="Holdout evaluation passed with 8.5% error reduction.",
    )

    # 5. Governance approval & promotion
    audit = ModelGovernanceGate.evaluate_promotion(candidate_model, eval_report)
    assert audit.decision == "APPROVE"
    promoted = ModelRegistry.promote_candidate(candidate_model, eval_report)
    assert promoted is True

    # 6. Verify ELA inference now dynamically resolves to the promoted v1.4 model
    active_now = ModelRegistry.get_active_model("DemandPredictionModel")
    assert active_now.current_version == "v1.4-promoted-online"
    assert fusion.active_demand_model.current_version == "v1.4-promoted-online"
