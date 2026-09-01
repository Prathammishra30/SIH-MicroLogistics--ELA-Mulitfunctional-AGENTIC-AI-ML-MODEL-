# ELA Phase 11.1: ML Scientific Validation, Data Leakage Audit & Generalization Test Suite
import pytest
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, List

from ai.ela.learning.leakage_audit import LeakageAuditor, LeakageAuditReport
from ai.ela.learning.candidate_trainer import CandidateModelTrainer
from ai.ela.learning.evaluator import GovernedModelEvaluator
from ai.ela.learning.governance import ModelGovernanceGate
from ai.ela.learning.pattern_miner import PatternMiner
from ai.ela.learning.registry import ModelRegistry
from ai.ela.ml.models.eta import ETAPredictionModel, EtaFeatures
from ai.ela.ml.models.transport import TransportCostModel, TransportCostFeatures
from ai.ela.ml.models.demand import DemandPredictionModel, DemandFeatures
from ai.ela.ml.models.price import PricePredictionModel, PriceFeatures


@pytest.fixture(autouse=True)
def setup_registry():
    ModelRegistry.reset_for_testing()
    ModelRegistry.ensure_defaults()


# -----------------------------------------------------------------------------
# 1. Target Leakage Detection Test
# -----------------------------------------------------------------------------
def test_target_leakage_detection():
    """Verify that LeakageAuditor fails if post-trip target data is embedded in features."""
    train_records = [
        {"features": {"distance_km": 200.0, "actual_duration_mins": 310.0}, "actual_value": 310.0, "timestamp": "2026-08-30T10:00:00"},
        {"features": {"distance_km": 210.0, "post_trip_delay": 15.0}, "actual_value": 320.0, "timestamp": "2026-08-30T11:00:00"},
    ]
    report = LeakageAuditor.audit_dataset(train_records=train_records)
    assert report.target_leakage == "FAIL"
    assert report.overall_status == "FAIL"
    assert len(report.findings) >= 2


# -----------------------------------------------------------------------------
# 2. Temporal Leakage Detection Test
# -----------------------------------------------------------------------------
def test_temporal_leakage_detection():
    """Verify that LeakageAuditor fails if training data occurs chronologically after validation or holdout data."""
    train_records = [
        {"features": {"distance_km": 200.0}, "actual_value": 300.0, "timestamp": "2026-08-31T15:00:00"},  # Future
    ]
    val_records = [
        {"features": {"distance_km": 210.0}, "actual_value": 310.0, "timestamp": "2026-08-30T10:00:00"},  # Past
    ]
    report = LeakageAuditor.audit_dataset(train_records=train_records, val_records=val_records)
    assert report.temporal_leakage == "FAIL"
    assert report.overall_status == "FAIL"
    assert any("Temporal Leakage" in f for f in report.findings)


# -----------------------------------------------------------------------------
# 3. Duplicate / Trip Leakage Detection Test
# -----------------------------------------------------------------------------
def test_duplicate_trip_leakage_detection():
    """Verify that LeakageAuditor detects identical feature signatures between train and holdout partitions."""
    shared_features = {"origin": "Nashik", "destination": "Pune APMC", "distance_km": 210.0, "departure_hour": 8}
    train_records = [
        {"features": shared_features, "actual_value": 310.0, "timestamp": "2026-08-28T08:00:00"}
    ]
    holdout_records = [
        {"features": shared_features, "actual_value": 325.0, "timestamp": "2026-08-30T08:00:00"}
    ]
    report = LeakageAuditor.audit_dataset(train_records=train_records, holdout_records=holdout_records)
    assert report.duplicate_leakage == "FAIL"
    assert report.overall_status == "FAIL"
    assert any("Duplicate Leakage" in f for f in report.findings)


# -----------------------------------------------------------------------------
# 4. Clean Leakage Audit Pass
# -----------------------------------------------------------------------------
def test_clean_leakage_audit_pass():
    """Verify that a properly partitioned dataset with distinct features and chronological ordering passes cleanly."""
    train_records = [
        {"features": {"distance_km": 150.0, "departure_hour": 6}, "actual_value": 240.0, "timestamp": "2026-08-28T06:00:00"},
        {"features": {"distance_km": 160.0, "departure_hour": 7}, "actual_value": 255.0, "timestamp": "2026-08-28T07:00:00"},
    ]
    val_records = [
        {"features": {"distance_km": 170.0, "departure_hour": 8}, "actual_value": 270.0, "timestamp": "2026-08-29T08:00:00"}
    ]
    holdout_records = [
        {"features": {"distance_km": 180.0, "departure_hour": 9}, "actual_value": 285.0, "timestamp": "2026-08-30T09:00:00"}
    ]
    report = LeakageAuditor.audit_dataset(train_records=train_records, val_records=val_records, holdout_records=holdout_records)
    assert report.target_leakage == "PASS"
    assert report.temporal_leakage == "PASS"
    assert report.duplicate_leakage == "PASS"
    assert report.overall_status == "PASS"
    assert len(report.findings) == 0


# -----------------------------------------------------------------------------
# 5. Reproducibility Test
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_training_reproducibility():
    """Verify that candidate training on identical data produces identical model weights and deterministic checksums."""
    records = [
        {"features": {"distance_km": 180.0 + (i * 10), "departure_hour": 7 + (i % 4), "checkpoint_delay_minutes": 10}, "actual_value": 280.0 + (i * 15), "timestamp": f"2026-08-25T0{i}:00:00"}
        for i in range(8)
    ]
    m1 = ETAPredictionModel(version="cand-test-1", status="trained")
    m2 = ETAPredictionModel(version="cand-test-2", status="trained")

    await m1.train(records)
    await m2.train(records)

    np.testing.assert_allclose(m1._residual_weights, m2._residual_weights, rtol=1e-5)


# -----------------------------------------------------------------------------
# 6. Domain Baseline Comparison Test
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_baseline_comparison_computation():
    """Verify that domain kinematic baseline, active production model, and candidate model are compared mathematically."""
    model = ETAPredictionModel(version="v1.2-transit-hybrid", status="trained")
    test_data = [
        {"features": {"distance_km": 200.0, "departure_hour": 8, "checkpoint_delay_minutes": 15, "loading_time_minutes": 30}, "actual_value": 320.0},
        {"features": {"distance_km": 250.0, "departure_hour": 10, "checkpoint_delay_minutes": 15, "loading_time_minutes": 30}, "actual_value": 380.0},
        {"features": {"distance_km": 300.0, "departure_hour": 14, "checkpoint_delay_minutes": 20, "loading_time_minutes": 30}, "actual_value": 450.0},
        {"features": {"distance_km": 180.0, "departure_hour": 9, "checkpoint_delay_minutes": 10, "loading_time_minutes": 30}, "actual_value": 290.0},
        {"features": {"distance_km": 220.0, "departure_hour": 17, "checkpoint_delay_minutes": 15, "loading_time_minutes": 30}, "actual_value": 350.0},
    ]

    baseline_metrics = await model.evaluate_baseline(test_data)
    model_metrics = await model.evaluate(test_data)

    assert baseline_metrics.sample_count == 5
    assert baseline_metrics.mae > 0.0
    assert model_metrics.sample_count == 5
    assert model_metrics.mae > 0.0


# -----------------------------------------------------------------------------
# 7. Pattern Miner Statistical Confidence Categories
# -----------------------------------------------------------------------------
def test_pattern_miner_statistical_confidence():
    """Verify that PatternMiner distinguishes preliminary observations (n < 10) from confident patterns (n >= 10)."""
    # 6 trips -> PRELIMINARY_OBSERVATION
    small_records = [
        {"features": {"origin": "Nashik", "destination": "Pune", "route": "Nashik-Pune"}, "predicted_value": 300.0, "actual_value": 345.0}
        for _ in range(6)
    ]
    patterns_small = PatternMiner.mine_patterns(small_records)
    assert len(patterns_small) == 1
    assert patterns_small[0].confidence_category == "PRELIMINARY_OBSERVATION"
    assert patterns_small[0].standard_error_minutes >= 0.0

    # 12 trips -> STATISTICALLY_CONFIDENT_PATTERN
    large_records = [
        {"features": {"origin": "Nashik", "destination": "Pune", "route": "Nashik-Pune"}, "predicted_value": 300.0, "actual_value": 345.0}
        for _ in range(12)
    ]
    patterns_large = PatternMiner.mine_patterns(large_records)
    assert len(patterns_large) == 1
    assert patterns_large[0].confidence_category == "STATISTICALLY_CONFIDENT_PATTERN"


# -----------------------------------------------------------------------------
# 8. Governance Gate Rejection on Data Leakage
# -----------------------------------------------------------------------------
def test_governance_rejection_on_leakage():
    """Verify that ModelGovernanceGate rejects candidate promotion if data leakage is detected."""
    eval_report = GovernedModelEvaluator.compare_models
    leakage_fail_report = LeakageAuditReport(
        target_leakage="FAIL",
        overall_status="FAIL",
        findings=["Target Leakage: feature 'actual_duration' contains target."],
    )

    from ai.ela.learning.evaluator import ModelEvaluationReport
    from ai.ela.ml.types import ModelMetrics

    mock_eval = ModelEvaluationReport(
        active_model_name="ETAPredictionModel",
        active_model_version="v1.2",
        active_metrics=ModelMetrics(mae=25.0, rmse=30.0, sample_count=10),
        candidate_model_name="ETAPredictionModel",
        candidate_model_version="v1.2-cand-1",
        candidate_metrics=ModelMetrics(mae=15.0, rmse=20.0, sample_count=10),
        mae_improvement_pct=40.0,
        holdout_sample_count=10,
        recommendation="PROMOTE_CANDIDATE",
        decision_reason="Candidate achieved 40% MAE improvement.",
    )

    gov_decision = ModelGovernanceGate.evaluate_promotion(
        candidate_model_or_report=mock_eval,
        leakage_report=leakage_fail_report,
    )

    assert gov_decision.decision == "REJECT"
    assert gov_decision.leakage_passed is False
    assert "data leakage" in gov_decision.decision_reason.lower()


# -----------------------------------------------------------------------------
# 9. Governance Gate Approval with Valid Evidence
# -----------------------------------------------------------------------------
def test_governance_approval_with_valid_evidence():
    """Verify that ModelGovernanceGate approves promotion only when all criteria pass cleanly."""
    from ai.ela.learning.evaluator import ModelEvaluationReport
    from ai.ela.ml.types import ModelMetrics

    clean_leakage = LeakageAuditReport(overall_status="PASS")
    mock_eval = ModelEvaluationReport(
        active_model_name="ETAPredictionModel",
        active_model_version="v1.2",
        active_metrics=ModelMetrics(mae=30.0, rmse=35.0, sample_count=8),
        candidate_model_name="ETAPredictionModel",
        candidate_model_version="v1.2-cand-2",
        candidate_metrics=ModelMetrics(mae=20.0, rmse=25.0, sample_count=8),
        mae_improvement_pct=33.33,
        holdout_sample_count=8,
        recommendation="PROMOTE_CANDIDATE",
        decision_reason="Candidate achieved 33.33% MAE improvement.",
    )

    gov_decision = ModelGovernanceGate.evaluate_promotion(
        candidate_model_or_report=mock_eval,
        leakage_report=clean_leakage,
    )

    assert gov_decision.decision == "APPROVE"
    assert gov_decision.evaluation_passed is True
    assert gov_decision.leakage_passed is True
    assert gov_decision.sample_size_passed is True


# -----------------------------------------------------------------------------
# 10. Insufficient Holdout Samples Rejection
# -----------------------------------------------------------------------------
def test_insufficient_holdout_samples_rejection():
    """Verify that fewer than 5 holdout samples returns INSUFFICIENT_EVIDENCE without promoting."""
    from ai.ela.learning.evaluator import ModelEvaluationReport
    from ai.ela.ml.types import ModelMetrics

    small_eval = ModelEvaluationReport(
        active_model_name="ETAPredictionModel",
        active_model_version="v1.2",
        active_metrics=ModelMetrics(mae=30.0, sample_count=3),
        candidate_model_name="ETAPredictionModel",
        candidate_model_version="v1.2-cand-3",
        candidate_metrics=ModelMetrics(mae=10.0, sample_count=3),
        mae_improvement_pct=66.67,
        holdout_sample_count=3,
        recommendation="INSUFFICIENT_DATA",
        decision_reason="Holdout evaluation dataset is too small (3/5 required).",
    )

    gov_decision = ModelGovernanceGate.evaluate_promotion(candidate_model_or_report=small_eval)
    assert gov_decision.decision == "INSUFFICIENT_EVIDENCE"
    assert gov_decision.sample_size_passed is False


# -----------------------------------------------------------------------------
# 11. Governed Candidate Model Trainer End-to-End Execution
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_governed_candidate_trainer_e2e():
    """Verify candidate training, automatic leakage audit, holdout evaluation, and metadata generation."""
    operational_records = [
        {
            "features": {
                "distance_km": 150.0 + (i * 12),
                "departure_hour": 6 + (i % 8),
                "checkpoint_delay_minutes": 10 + (i % 5),
                "loading_time_minutes": 30,
            },
            "actual_value": 240.0 + (i * 18),
            "timestamp": f"2026-08-2{i % 10:01d}T{10 + (i % 8):02d}:00:00",
            "route": f"Route-{i % 3}",
        }
        for i in range(16)
    ]

    result = await CandidateModelTrainer.train_candidate(
        model_name="ETAPredictionModel",
        operational_records=operational_records,
        dataset_type="REAL_OPERATIONAL",
    )

    assert result.model_name == "ETAPredictionModel"
    assert result.training_sample_count > 0
    assert result.holdout_sample_count >= 3
    assert result.leakage_audit is not None
    assert result.leakage_audit.overall_status == "PASS"
    assert result.dataset_hash != ""
    assert result.artifact_checksum != ""
    assert result.evaluation_report.candidate_metrics.mae >= 0.0
    assert result.evaluation_report.active_metrics.mae > 0.0


# -----------------------------------------------------------------------------
# 12. Transport, Demand, and Price Model Target Extraction
# -----------------------------------------------------------------------------
@pytest.mark.asyncio
async def test_multimodel_target_extraction():
    """Verify that all models extract actual_value ground truth correctly and compute baselines."""
    # Transport Cost Model
    t_model = TransportCostModel()
    t_data = [
        {"features": {"distance_km": 200.0, "weight_kg": 1000.0, "diesel_price_per_litre": 95.0, "toll_charges": 200.0}, "actual_value": 3500.0}
        for _ in range(5)
    ]
    t_base = await t_model.evaluate_baseline(t_data)
    assert t_base.sample_count == 5
    assert t_base.mae > 0.0

    # Demand Prediction Model
    d_model = DemandPredictionModel()
    d_data = [
        {"features": {"commodity": "Tomato", "mandi_location": "Pune APMC", "historical_avg_kg": 2500.0, "month": 8}, "actual_value": 2700.0}
        for _ in range(5)
    ]
    d_base = await d_model.evaluate_baseline(d_data)
    assert d_base.sample_count == 5
    assert d_base.mae > 0.0

    # Price Prediction Model
    p_model = PricePredictionModel()
    p_data = [
        {"features": {"commodity": "Tomato", "mandi_location": "Nashik", "modal_price_historical": 40.0, "grade": "A"}, "actual_value": 42.50}
        for _ in range(5)
    ]
    p_base = await p_model.evaluate_baseline(p_data)
    assert p_base.sample_count == 5
    assert p_base.mae > 0.0
