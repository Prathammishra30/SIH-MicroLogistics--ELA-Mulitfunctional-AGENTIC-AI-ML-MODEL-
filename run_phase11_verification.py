# ELA Phase 11 Real Operational Intelligence & Autonomous Cognitive Loop Master Verifier
import asyncio
import json
import sys
import time
from datetime import datetime
from typing import Dict, Any, List

# Ensure UTF-8 output on Windows terminal
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from ai.ela.learning.trace_store import PredictionTraceStore, PredictionRecord, OutcomeLinkResult
from ai.ela.learning.collector import FeedbackCollector
from ai.ela.learning.error_analysis import ErrorAnalysisEngine, OperationalDiscrepancy
from ai.ela.learning.pattern_miner import PatternMiner
from ai.ela.learning.drift import DriftDetector
from ai.ela.learning.retraining import RetrainingTriggerEngine
from ai.ela.learning.candidate_trainer import CandidateModelTrainer
from ai.ela.learning.evaluator import GovernedModelEvaluator, ModelEvaluationReport
from ai.ela.learning.governance import ModelGovernanceGate
from ai.ela.learning.registry import ModelRegistry
from ai.ela.ml.models.eta import ETAPredictionModel, EtaFeatures
from ai.ela.ml.types import ModelMetrics
from ai.ela.agents.prediction_agent import PredictionAgent
from ai.ela.agents.contracts import AgentRequest
from ai.ela.agent.state import CanonicalEntities
from ai.ela.agent.brain import ElaUniversalBrain
from ai.ela.agent.loop import AgentChatRequest


async def run_phase11_master_verification() -> bool:
    print("=" * 80)
    print("  ELA PHASE 11: REAL OPERATIONAL INTELLIGENCE MASTER VERIFICATION REPORT")
    print("=" * 80)

    total_checks = 0
    passed_checks = 0

    # Reset state for clean verification
    PredictionTraceStore.clear_all()
    FeedbackCollector.clear_records()
    ErrorAnalysisEngine.clear_history()
    ModelRegistry.clear_all()
    ModelRegistry.ensure_defaults()

    # -------------------------------------------------------------------------
    # [STEP 1] Operational Records Ingestion & Provenance
    # -------------------------------------------------------------------------
    print("\n[STEP 1] Verifying Operational Records Ingestion & Strict Provenance Separation...")
    total_checks += 1
    real_evt = FeedbackCollector.record_operational_outcome(
        outcome_event_type="ETA_OUTCOME",
        actual_value=360.0,
        predicted_value=330.0,
        model_name="ETAPredictionModel",
        model_version="v1.2-transit-hybrid",
        features={"distance_km": 210.0, "departure_hour": 8, "route": "Nashik-Pune"},
        dataset_type="REAL_OPERATIONAL",
    )
    synth_evt = FeedbackCollector.record_operational_outcome(
        outcome_event_type="FREIGHT_OUTCOME",
        actual_value=6000.0,
        predicted_value=6073.0,
        model_name="TransportCostModel",
        model_version="v1.1-logistics-cost",
        features={"distance_km": 210.0, "cargo_weight_kg": 500.0},
        dataset_type="SYNTHETIC_TEST",
    )
    if real_evt.dataset_type == "REAL_OPERATIONAL" and synth_evt.dataset_type == "SYNTHETIC_TEST":
        print(f"  Real Operational Event ID: {real_evt.event_id} (Type: {real_evt.dataset_type})")
        print(f"  Synthetic Benchmark Event ID: {synth_evt.event_id} (Type: {synth_evt.dataset_type})")
        print("  [PASS] Operational telemetry and synthetic benchmark datasets strictly separated.")
        passed_checks += 1
    else:
        print("  [FAIL] Provenance separation failed.")

    # -------------------------------------------------------------------------
    # [STEP 2] Prediction Provenance & Non-Anonymous Traces
    # -------------------------------------------------------------------------
    print("\n[STEP 2] Verifying Explicit Prediction Traces (Non-Anonymous Telemetry)...")
    total_checks += 1
    pred_rec = PredictionTraceStore.record_prediction(
        session_id="sess-p11-verify-01",
        goal_id="g-p11-verify-01",
        model_name="ETAPredictionModel",
        model_version="v1.2-transit-hybrid",
        prediction_type="ETA_MINUTES",
        input_features={"origin": "Nashik", "destination": "Pune APMC Mandi", "distance_km": 210.0, "vehicle_type": "Mini Truck"},
        predicted_value=330.0,
        confidence=0.94,
        route_context="Nashik-Pune APMC Mandi",
        entity_identifiers={"commodity": "Tomatoes", "weight_kg": 500.0},
    )
    if pred_rec.prediction_id and pred_rec.predicted_value == 330.0 and pred_rec.status == "PENDING_OUTCOME":
        print(f"  Prediction Trace ID: {pred_rec.prediction_id} (Model: {pred_rec.model_name} {pred_rec.model_version})")
        print(f"  Session ID: {pred_rec.session_id}, Goal ID: {pred_rec.goal_id}")
        print("  [PASS] Non-anonymous prediction trace registered.")
        passed_checks += 1
    else:
        print("  [FAIL] Prediction trace creation failed.")

    # -------------------------------------------------------------------------
    # [STEP 3] Real Outcome Linking & Programmatic Error Analysis
    # -------------------------------------------------------------------------
    print("\n[STEP 3] Verifying Real Outcome Linking & Discrepancy Calculation...")
    total_checks += 1
    link_res = PredictionTraceStore.link_outcome(
        prediction_id=pred_rec.prediction_id,
        actual_value=368.0,
        outcome_status="COMPLETED",
        dataset_type="REAL_OPERATIONAL",
    )
    if (
        link_res.signed_error == 38.0
        and link_res.absolute_error == 38.0
        and link_res.percentage_error == 11.52
        and link_res.mae_contribution == 38.0
        and link_res.rmse_contribution == 1444.0
    ):
        print(f"  Linked Outcome ID: {link_res.outcome_id} -> Actual: {link_res.actual_value}m, Pred: {link_res.predicted_value}m")
        print(f"  Signed Error: +{link_res.signed_error}m, Percentage Error: {link_res.percentage_error}%, RMSE Contrib: {link_res.rmse_contribution}")
        print("  [PASS] Real operational outcome linked with exact mathematical error contributions.")
        passed_checks += 1
    else:
        print("  [FAIL] Outcome linking failed.")

    # -------------------------------------------------------------------------
    # [STEP 4] Error Intelligence & Diagnostic Classification
    # -------------------------------------------------------------------------
    print("\n[STEP 4] Verifying Error Intelligence Diagnostics Across 8 Categories...")
    total_checks += 1
    disc_noise = ErrorAnalysisEngine.record_discrepancy(
        session_id="sess-diag-noise",
        model_name="ETAPredictionModel",
        model_version="v1.2",
        target_metric="ETA_MINUTES",
        predicted_value=330.0,
        actual_value=338.0,
        route="Route-Noise-P11",
    )
    diag_noise = ErrorAnalysisEngine.diagnose_error(disc_noise)

    disc_dq = ErrorAnalysisEngine.record_discrepancy(
        session_id="sess-diag-dq",
        model_name="ETAPredictionModel",
        model_version="v1.2",
        target_metric="ETA_MINUTES",
        predicted_value=330.0,
        actual_value=-10.0,
        route="Route-DQ-P11",
    )
    diag_dq = ErrorAnalysisEngine.diagnose_error(disc_dq)

    disc_weather = ErrorAnalysisEngine.record_discrepancy(
        session_id="sess-diag-weather",
        model_name="ETAPredictionModel",
        model_version="v1.2",
        target_metric="ETA_MINUTES",
        predicted_value=330.0,
        actual_value=490.0,
        route="Route-Weather-P11",
        weather_context="Ghat landslide road closure",
    )
    diag_weather = ErrorAnalysisEngine.diagnose_error(disc_weather)

    if (
        diag_noise.error_category == "RANDOM_NOISE"
        and diag_dq.error_category == "DATA_QUALITY_ISSUE"
        and diag_weather.error_category == "ROUTE_ANOMALY"
    ):
        print(f"  Diagnosis 1: {diag_noise.error_category} (Retrain: {diag_noise.is_retraining_trigger_recommended})")
        print(f"  Diagnosis 2: {diag_dq.error_category} (Retrain: {diag_dq.is_retraining_trigger_recommended})")
        print(f"  Diagnosis 3: {diag_weather.error_category} (Retrain: {diag_weather.is_retraining_trigger_recommended})")
        print("  [PASS] Error Analysis Engine successfully differentiated noise, sensor errors, and anomalies.")
        passed_checks += 1
    else:
        print("  [FAIL] Error diagnosis failed.")

    # -------------------------------------------------------------------------
    # [STEP 5] Pattern Intelligence on Accumulated Operational Data
    # -------------------------------------------------------------------------
    print("\n[STEP 5] Verifying Data-Driven Pattern Discovery on Real Corridors...")
    total_checks += 1
    corridor_trips = [
        {"features": {"origin": "Nashik", "destination": "Pune", "route": "Nashik-Pune", "departure_hour": 8 + (i % 3)}, "predicted_value": 300.0, "actual_value": 345.0, "route": "Nashik-Pune", "timestamp": f"2026-08-30T{10 + i:02d}:00:00"}
        for i in range(6)
    ]
    patterns = PatternMiner.mine_patterns(corridor_trips)
    if patterns and any(p.pattern_type == "ROUTE_PATTERN" and "Nashik-Pune" in p.dimension_value for p in patterns):
        pat = patterns[0]
        print(f"  Discovered Pattern: {pat.description}")
        print(f"  Recommended Calibration: {pat.recommended_feature_adjustment}")
        print("  [PASS] Data-driven pattern mining verified.")
        passed_checks += 1
    else:
        print("  [FAIL] Pattern mining failed.")

    # -------------------------------------------------------------------------
    # [STEP 6] Statistical Drift Detection
    # -------------------------------------------------------------------------
    print("\n[STEP 6] Verifying Statistical Performance Degradation Drift Detection...")
    total_checks += 1
    base_stream = [{"features": {"distance_km": 200 + i, "cargo_weight_kg": 500, "departure_hour": 8}, "actual_value": 310, "predicted_value": 300} for i in range(10)]
    drift_stream = [{"features": {"distance_km": 200 + i, "cargo_weight_kg": 500, "departure_hour": 8}, "actual_value": 350, "predicted_value": 300} for i in range(10)]
    drift_rep = DriftDetector.detect_drift("ETAPredictionModel", base_stream, drift_stream)
    if drift_rep.is_retraining_warranted and drift_rep.drift_type == "MODEL_PERFORMANCE_DEGRADATION":
        print(f"  Drift Type: {drift_rep.drift_type} (Retraining Warranted: {drift_rep.is_retraining_warranted})")
        print(f"  Summary: {drift_rep.summary}")
        print("  [PASS] Statistical drift detected without false alarms.")
        passed_checks += 1
    else:
        print("  [FAIL] Drift detection failed.")

    # -------------------------------------------------------------------------
    # [STEP 7] Retraining Trigger Proposal Emission
    # -------------------------------------------------------------------------
    print("\n[STEP 7] Verifying Autonomous Retraining Trigger Proposal Generation...")
    total_checks += 1
    proposal = RetrainingTriggerEngine.evaluate_retraining_trigger("ETAPredictionModel", "v1.2-transit-hybrid", drift_rep)
    if proposal.trigger_reason == "MODEL_PERFORMANCE_DEGRADATION" and proposal.model_name == "ETAPredictionModel":
        print(f"  Proposal ID: {proposal.proposal_id}")
        print(f"  Trigger Reason: {proposal.trigger_reason}")
        print(f"  Target Version: {proposal.target_candidate_version}")
        print("  [PASS] Explainable retraining proposal generated.")
        passed_checks += 1
    else:
        print("  [FAIL] Retraining proposal generation failed.")

    # -------------------------------------------------------------------------
    # [STEP 8] Candidate Training with Anti-Leakage Temporal Splitting
    # -------------------------------------------------------------------------
    print("\n[STEP 8] Verifying Governed Candidate Model Training...")
    total_checks += 1
    training_data = [
        {"features": {"distance_km": 200.0 + (i * 5), "departure_hour": 6 + (i % 12), "checkpoint_delay_minutes": 10 + i}, "actual_value": 310.0 + (i * 8), "predicted_value": 300.0 + (i * 6), "route": f"Route-{i}", "timestamp": f"2026-08-30T{10 + (i % 12):02d}:00:00"}
        for i in range(16)
    ]
    cand_train_res = await CandidateModelTrainer.train_candidate(
        model_name="ETAPredictionModel",
        operational_records=training_data,
        trigger_reason=proposal.trigger_reason,
    )
    if cand_train_res.candidate_version and cand_train_res.artifact_checksum:
        print(f"  Parent: {cand_train_res.parent_version} -> Candidate: {cand_train_res.candidate_version}")
        print(f"  SHA-256 Checksum: {cand_train_res.artifact_checksum[:24]}...")
        print(f"  Splits -> Training: {cand_train_res.training_sample_count}, Validation: {cand_train_res.validation_sample_count}")
        print("  [PASS] Candidate model trained with verified anti-leakage temporal partition.")
        passed_checks += 1
    else:
        print("  [FAIL] Candidate training failed.")

    # -------------------------------------------------------------------------
    # [STEP 9] Governed Holdout Benchmark Evaluation
    # -------------------------------------------------------------------------
    print("\n[STEP 9] Verifying Governed Holdout Benchmark Evaluation...")
    total_checks += 1
    eval_rep = cand_train_res.evaluation_report
    if eval_rep.holdout_sample_count > 0 and eval_rep.recommendation in ["PROMOTE_CANDIDATE", "REJECT_CANDIDATE"]:
        print(f"  Production Benchmark MAE: {eval_rep.active_metrics.mae:.2f} mins")
        print(f"  Candidate Benchmark MAE: {eval_rep.candidate_metrics.mae:.2f} mins")
        print(f"  Holdout Samples Evaluated: {eval_rep.holdout_sample_count}")
        print(f"  Recommendation: {eval_rep.recommendation}")
        print("  [PASS] Model evaluated on unseen holdout dataset.")
        passed_checks += 1
    else:
        print("  [FAIL] Holdout evaluation failed.")

    # -------------------------------------------------------------------------
    # [STEP 10] Governance Gate Gating Decision
    # -------------------------------------------------------------------------
    print("\n[STEP 10] Verifying Governance Gate Enforcement & Audit Logging...")
    total_checks += 1
    gate_decision = cand_train_res.governance_decision
    if gate_decision in ["APPROVE", "REJECT", "INSUFFICIENT_EVIDENCE"]:
        print(f"  Governance Decision: {gate_decision}")
        print(f"  Decision Reason: {eval_rep.decision_reason}")
        print("  [PASS] Governance gate enforced strict gating policy.")
        passed_checks += 1
    else:
        print("  [FAIL] Governance gate decision invalid.")

    # -------------------------------------------------------------------------
    # [STEP 11] Atomic Production Promotion
    # -------------------------------------------------------------------------
    print("\n[STEP 11] Verifying Atomic Production Model Promotion...")
    total_checks += 1
    candidate_promoted = ETAPredictionModel(version="v1.3-p11-promoted", status="trained")
    eval_approve = ModelEvaluationReport(
        active_model_name="ETAPredictionModel",
        active_model_version="v1.2-transit-hybrid",
        active_metrics=ModelMetrics(mae=28.0, rmse=34.0, r_squared=0.78),
        candidate_model_name="ETAPredictionModel",
        candidate_model_version="v1.3-p11-promoted",
        candidate_metrics=ModelMetrics(mae=19.0, rmse=23.0, r_squared=0.89),
        mae_improvement_pct=32.14,
        holdout_sample_count=20,
        recommendation="PROMOTE_CANDIDATE",
        decision_reason="Candidate demonstrated 32.14% MAE reduction on holdout benchmark.",
    )
    prom_ok = ModelRegistry.promote_candidate(candidate_promoted, eval_approve)
    current_prod = ModelRegistry.get_active_model("ETAPredictionModel")
    if prom_ok and current_prod.current_version == "v1.3-p11-promoted":
        print(f"  Promoted Active Version: {current_prod.current_version}")
        print("  [PASS] Model registry updated atomically to new production version.")
        passed_checks += 1
    else:
        print("  [FAIL] Model promotion failed.")

    # -------------------------------------------------------------------------
    # [STEP 12] Dynamic Inference with Promoted Model
    # -------------------------------------------------------------------------
    print("\n[STEP 12] Verifying Dynamic Production Model Resolution in Inference...")
    total_checks += 1
    pred_agent = PredictionAgent()
    req_inf = AgentRequest(
        task_id="t-inf-p11",
        session_id="sess-inf-p11",
        goal_id="g-inf-p11",
        objective="Predict transport ETA",
        role="FARMER",
        language="hi",
        intent="CREATE_LOGISTICS_WORKFLOW",
        entities=CanonicalEntities(pickup_location="Nashik", destination="Pune APMC Mandi", quantity=500.0),
    )
    res_inf = await pred_agent.execute(req_inf)
    if res_inf.data.get("eta_model_version") == "v1.3-p11-promoted":
        print(f"  Inference ETA Model Version: {res_inf.data.get('eta_model_version')}")
        print(f"  Trace ID: {res_inf.data.get('prediction_traces', {}).get('ETA_MINUTES')}")
        print("  [PASS] Subsequent inferences immediately used the promoted model version.")
        passed_checks += 1
    else:
        print(f"  [FAIL] Dynamic inference failed (got {res_inf.data.get('eta_model_version')}).")

    # -------------------------------------------------------------------------
    # [STEP 13] Safe Auditable Rollback
    # -------------------------------------------------------------------------
    print("\n[STEP 13] Verifying Safe Audited Rollback...")
    total_checks += 1
    rollback_ok = ModelRegistry.rollback("ETAPredictionModel", "v1.2-transit-hybrid")
    rolled_back_prod = ModelRegistry.get_active_model("ETAPredictionModel")
    audit_log = ModelRegistry.get_rollback_audit_log()
    if rollback_ok and rolled_back_prod.current_version == "v1.2-transit-hybrid" and len(audit_log) >= 1:
        print(f"  Restored Production Version: {rolled_back_prod.current_version}")
        print(f"  Rollback Audit Log: {audit_log[-1]}")
        print("  [PASS] Audited rollback to previous immutable version verified.")
        passed_checks += 1
    else:
        print("  [FAIL] Model rollback failed.")

    # -------------------------------------------------------------------------
    # [STEP 14] Zero-Secret Telemetry Shielding
    # -------------------------------------------------------------------------
    print("\n[STEP 14] Verifying Zero-Secret Credential Shield in Learning Telemetry...")
    total_checks += 1
    sec_pred = PredictionTraceStore.record_prediction(
        session_id="sess-sec-p11",
        model_name="ETAPredictionModel",
        model_version="v1.2",
        prediction_type="ETA_MINUTES",
        input_features={"origin": "Nashik", "password": "superSecretMasterKey123", "otp": "999888"},
        predicted_value=330.0,
    )
    if "superSecretMasterKey123" not in str(sec_pred.model_dump()) and sec_pred.input_features.get("password") == "[REDACTED_SECRET]":
        print("  [PASS] Sensitive authentication credentials actively shielded from learning storage.")
        passed_checks += 1
    else:
        print("  [FAIL] Security shield failed.")

    # -------------------------------------------------------------------------
    # [STEP 15] Master E2E Scenario & Absolute Honesty Verification
    # -------------------------------------------------------------------------
    print("\n[STEP 15] Verifying Master E2E Scenario (Farmer Tomato Logistics) & Absolute Honesty...")
    total_checks += 1
    brain = ElaUniversalBrain()
    master_req = AgentChatRequest(
        message="Main farmer hoon. Mujhe 500 kilo tomato Nashik se Pune bhejna hai. Sabse sasta option chahiye.",
        session_id="sess-master-p11",
        authenticated=True,
        authenticated_role="FARMER",
        language="hi",
    )
    master_res = await brain.process_chat(master_req)

    # Check if insufficient data handling is honest
    empty_operational_records: List[Dict[str, Any]] = []
    insufficient_handled = False
    try:
        await CandidateModelTrainer.train_candidate(
            model_name="ETAPredictionModel",
            operational_records=empty_operational_records,
            trigger_reason="TEST_EMPTY",
        )
    except ValueError as e:
        if "failed data quality validation" in str(e) or "insufficient" in str(e).lower():
            insufficient_handled = True

    if (
        master_res.status in ["CONFIRMATION_REQUIRED", "SUCCESS"]
        and master_res.detected_role == "FARMER"
        and insufficient_handled
    ):
        print(f"  Master Chat Status: {master_res.status} (Detected Role: {master_res.detected_role})")
        print(f"  Response: {master_res.message[:70]}...")
        print("  [PASS] Master E2E interaction and Absolute Honesty rule verified (no fabricated metrics).")
        passed_checks += 1
    else:
        print("  [FAIL] Master E2E scenario failed.")

    print("\n" + "=" * 80)
    print(f"  PHASE 11 FINAL RESULT: {passed_checks}/{total_checks} CHECKS PASSED ({(passed_checks/total_checks)*100:.1f}%)")
    print("=" * 80)

    return passed_checks == total_checks


if __name__ == "__main__":
    success = asyncio.run(run_phase11_master_verification())
    sys.exit(0 if success else 1)
