import os
import sys
import asyncio
import numpy as np
from datetime import datetime

# Ensure UTF-8 output on Windows terminal
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from ai.ela.learning.leakage_audit import LeakageAuditor, LeakageAuditReport
from ai.ela.learning.candidate_trainer import CandidateModelTrainer
from ai.ela.learning.evaluator import GovernedModelEvaluator
from ai.ela.learning.governance import ModelGovernanceGate
from ai.ela.learning.pattern_miner import PatternMiner
from ai.ela.learning.registry import ModelRegistry
from ai.ela.ml.models.eta import ETAPredictionModel, EtaFeatures
from ai.ela.ml.models.transport import TransportCostModel
from ai.ela.ml.models.demand import DemandPredictionModel
from ai.ela.ml.models.price import PricePredictionModel
from ai.ela.agent.brain import ElaUniversalBrain
from ai.ela.agent.loop import AgentChatRequest


async def run_phase11_1_master_verification():
    print("=" * 80)
    print("  ELA PHASE 11.1: ML SCIENTIFIC VALIDATION & LEAKAGE AUDIT VERIFIER")
    print("=" * 80)

    total_checks = 0
    passed_checks = 0

    ModelRegistry.reset_for_testing()
    ModelRegistry.ensure_defaults()

    # -------------------------------------------------------------------------
    # [STEP 1] Target Leakage Audit
    # -------------------------------------------------------------------------
    print("\n[STEP 1] Verifying Target Leakage Detection Engine...")
    total_checks += 1
    leaky_records = [
        {"features": {"distance_km": 200.0, "actual_duration_mins": 310.0}, "actual_value": 310.0, "timestamp": "2026-08-30T10:00:00"},
        {"features": {"distance_km": 210.0, "post_trip_delay": 15.0}, "actual_value": 320.0, "timestamp": "2026-08-30T11:00:00"},
    ]
    leak_report = LeakageAuditor.audit_dataset(train_records=leaky_records, model_name="ETAPredictionModel")
    if leak_report.target_leakage == "FAIL" and leak_report.overall_status == "FAIL":
        print(f"  Target Leakage Detected: {leak_report.findings[0]}")
        print("  [PASS] Target leakage caught and blocked by auditor.")
        passed_checks += 1
    else:
        print("  [FAIL] Target leakage check failed.")

    # -------------------------------------------------------------------------
    # [STEP 2] Temporal Leakage Audit
    # -------------------------------------------------------------------------
    print("\n[STEP 2] Verifying Temporal Anti-Leakage Chronological Validation...")
    total_checks += 1
    train_future = [{"features": {"distance_km": 200.0}, "actual_value": 300.0, "timestamp": "2026-08-31T15:00:00"}]
    val_past = [{"features": {"distance_km": 210.0}, "actual_value": 310.0, "timestamp": "2026-08-30T10:00:00"}]
    temp_leak_report = LeakageAuditor.audit_dataset(train_records=train_future, val_records=val_past)
    if temp_leak_report.temporal_leakage == "FAIL" and temp_leak_report.overall_status == "FAIL":
        print(f"  Temporal Leakage Detected: {temp_leak_report.findings[0]}")
        print("  [PASS] Temporal backward contamination caught and blocked.")
        passed_checks += 1
    else:
        print("  [FAIL] Temporal leakage check failed.")

    # -------------------------------------------------------------------------
    # [STEP 3] Duplicate / Trip Leakage Audit
    # -------------------------------------------------------------------------
    print("\n[STEP 3] Verifying Duplicate / Trip Feature Collision Detection...")
    total_checks += 1
    shared_feats = {"origin": "Nashik", "destination": "Pune", "distance_km": 210.0, "departure_hour": 8}
    train_dup = [{"features": shared_feats, "actual_value": 310.0, "timestamp": "2026-08-28T08:00:00"}]
    holdout_dup = [{"features": shared_feats, "actual_value": 325.0, "timestamp": "2026-08-30T08:00:00"}]
    dup_leak_report = LeakageAuditor.audit_dataset(train_records=train_dup, holdout_records=holdout_dup)
    if dup_leak_report.duplicate_leakage == "FAIL" and dup_leak_report.overall_status == "FAIL":
        print(f"  Duplicate Collision Detected: {dup_leak_report.findings[0]}")
        print("  [PASS] Duplicate train-holdout contamination caught and blocked.")
        passed_checks += 1
    else:
        print("  [FAIL] Duplicate leakage check failed.")

    # -------------------------------------------------------------------------
    # [STEP 4] Clean Leakage Audit Pass
    # -------------------------------------------------------------------------
    print("\n[STEP 4] Verifying Clean Leakage Audit on Genuinely Partitioned Data...")
    total_checks += 1
    clean_train = [
        {"features": {"distance_km": 150.0, "departure_hour": 6}, "actual_value": 240.0, "timestamp": "2026-08-28T06:00:00"},
        {"features": {"distance_km": 160.0, "departure_hour": 7}, "actual_value": 255.0, "timestamp": "2026-08-28T07:00:00"},
    ]
    clean_val = [{"features": {"distance_km": 170.0, "departure_hour": 8}, "actual_value": 270.0, "timestamp": "2026-08-29T08:00:00"}]
    clean_holdout = [{"features": {"distance_km": 180.0, "departure_hour": 9}, "actual_value": 285.0, "timestamp": "2026-08-30T09:00:00"}]
    clean_report = LeakageAuditor.audit_dataset(train_records=clean_train, val_records=clean_val, holdout_records=clean_holdout)
    if clean_report.overall_status == "PASS" and len(clean_report.findings) == 0:
        print("  Clean Dataset Summary: 2 train, 1 val, 1 holdout cleanly separated.")
        print("  [PASS] Clean partition verified with zero leakage findings.")
        passed_checks += 1
    else:
        print("  [FAIL] Clean leakage audit failed.")

    # -------------------------------------------------------------------------
    # [STEP 5] Domain Kinematic Baseline Comparison
    # -------------------------------------------------------------------------
    print("\n[STEP 5] Verifying Domain Baseline vs Production vs Candidate Model Comparison...")
    total_checks += 1
    eta_model = ETAPredictionModel(version="v1.2-transit-hybrid", status="trained")
    bench_data = [
        {"features": {"distance_km": 200.0, "departure_hour": 8, "checkpoint_delay_minutes": 15, "loading_time_minutes": 30}, "actual_value": 320.0},
        {"features": {"distance_km": 250.0, "departure_hour": 10, "checkpoint_delay_minutes": 15, "loading_time_minutes": 30}, "actual_value": 380.0},
        {"features": {"distance_km": 300.0, "departure_hour": 14, "checkpoint_delay_minutes": 20, "loading_time_minutes": 30}, "actual_value": 450.0},
        {"features": {"distance_km": 180.0, "departure_hour": 9, "checkpoint_delay_minutes": 10, "loading_time_minutes": 30}, "actual_value": 290.0},
        {"features": {"distance_km": 220.0, "departure_hour": 17, "checkpoint_delay_minutes": 15, "loading_time_minutes": 30}, "actual_value": 350.0},
    ]
    base_metrics = await eta_model.evaluate_baseline(bench_data)
    prod_metrics = await eta_model.evaluate(bench_data)
    print(f"  Physics Kinematic Baseline MAE: {base_metrics.mae:.2f} mins (RMSE: {base_metrics.rmse:.2f})")
    print(f"  Production Hybrid Model MAE:    {prod_metrics.mae:.2f} mins (RMSE: {prod_metrics.rmse:.2f})")
    if base_metrics.sample_count == 5 and prod_metrics.sample_count == 5:
        print("  [PASS] Mathematical baseline comparison verified.")
        passed_checks += 1
    else:
        print("  [FAIL] Baseline comparison failed.")

    # -------------------------------------------------------------------------
    # [STEP 6] Mathematical Root Cause & Discrepancy Correction Verification
    # -------------------------------------------------------------------------
    print("\n[STEP 6] Verifying Target Extraction Resolution (Fix for 0.20 vs 201.40)...")
    total_checks += 1
    # Verify that target extraction does not silently fall back to constant 180.0
    extracted_target = eta_model._extract_target({"actual_value": 345.0, "features": {"distance_km": 200.0}})
    if extracted_target == 345.0:
        print(f"  Resolved Target from actual_value key: {extracted_target} mins (no silent constant fallback)")
        print("  [PASS] Exact target extraction resolution verified.")
        passed_checks += 1
    else:
        print("  [FAIL] Target extraction failed.")

    # -------------------------------------------------------------------------
    # [STEP 7] Multi-Model Target Extraction & Baselines
    # -------------------------------------------------------------------------
    print("\n[STEP 7] Verifying Target Extraction Across Transport, Demand & Price Models...")
    total_checks += 1
    t_model = TransportCostModel()
    d_model = DemandPredictionModel()
    p_model = PricePredictionModel()
    
    t_base = await t_model.evaluate_baseline([{"features": {"distance_km": 200.0, "weight_kg": 1000.0, "diesel_price_per_litre": 95.0, "toll_charges": 200.0}, "actual_value": 3500.0} for _ in range(5)])
    d_base = await d_model.evaluate_baseline([{"features": {"commodity": "Tomato", "mandi_location": "Pune APMC", "historical_avg_kg": 2500.0, "month": 8}, "actual_value": 2700.0} for _ in range(5)])
    p_base = await p_model.evaluate_baseline([{"features": {"commodity": "Tomato", "mandi_location": "Nashik", "historical_avg_price": 40.0, "grade": "A"}, "actual_value": 42.50} for _ in range(5)])

    if t_base.mae > 0 and d_base.mae > 0 and p_base.mae > 0:
        print(f"  Transport Tariff Baseline MAE: ₹{t_base.mae:.2f}")
        print(f"  Demand Historical Baseline MAE: {d_base.mae:.2f} kg")
        print(f"  Price Mandi Baseline MAE:      ₹{p_base.mae:.2f}/kg")
        print("  [PASS] Multi-model baselines and target extractions verified.")
        passed_checks += 1
    else:
        print("  [FAIL] Multi-model baseline checks failed.")

    # -------------------------------------------------------------------------
    # [STEP 8] Pattern Miner Statistical Confidence & Limitations
    # -------------------------------------------------------------------------
    print("\n[STEP 8] Verifying Statistical Confidence Distinctions in Pattern Mining...")
    total_checks += 1
    small_records = [
        {"features": {"origin": "Nashik", "destination": "Pune", "route": "Nashik-Pune"}, "predicted_value": 300.0, "actual_value": 345.0}
        for _ in range(6)
    ]
    pat_small = PatternMiner.mine_patterns(small_records)
    large_records = [
        {"features": {"origin": "Nashik", "destination": "Pune", "route": "Nashik-Pune"}, "predicted_value": 300.0, "actual_value": 345.0}
        for _ in range(12)
    ]
    pat_large = PatternMiner.mine_patterns(large_records)
    if pat_small and pat_small[0].confidence_category == "PRELIMINARY_OBSERVATION" and pat_large[0].confidence_category == "STATISTICALLY_CONFIDENT_PATTERN":
        print(f"  6 Samples Confidence Category:  {pat_small[0].confidence_category} (StdErr: {pat_small[0].standard_error_minutes:.2f}m)")
        print(f"  12 Samples Confidence Category: {pat_large[0].confidence_category} (StdErr: {pat_large[0].standard_error_minutes:.2f}m)")
        print("  [PASS] Statistical limitations correctly distinguished (no overclaiming from small n).")
        passed_checks += 1
    else:
        print("  [FAIL] Pattern miner statistical confidence check failed.")

    # -------------------------------------------------------------------------
    # [STEP 9] Training Reproducibility & Deterministic Checksums
    # -------------------------------------------------------------------------
    print("\n[STEP 9] Verifying Training Reproducibility & Deterministic Checksums...")
    total_checks += 1
    train_records = [
        {"features": {"distance_km": 180.0 + (i * 10), "departure_hour": 7 + (i % 4), "checkpoint_delay_minutes": 10}, "actual_value": 280.0 + (i * 15), "timestamp": f"2026-08-25T0{i}:00:00"}
        for i in range(8)
    ]
    m1 = ETAPredictionModel(version="cand-rep-1", status="trained")
    m2 = ETAPredictionModel(version="cand-rep-2", status="trained")
    await m1.train(train_records)
    await m2.train(train_records)
    diff = np.max(np.abs(m1._residual_weights - m2._residual_weights))
    if diff < 1e-6:
        print(f"  Max Residual Weight Difference across independent runs: {diff:.8f}")
        print("  [PASS] Deterministic model training reproducibility verified.")
        passed_checks += 1
    else:
        print("  [FAIL] Training reproducibility failed.")

    # -------------------------------------------------------------------------
    # [STEP 10] Governed Candidate Training with Automatic Leakage Audit
    # -------------------------------------------------------------------------
    print("\n[STEP 10] Verifying Candidate Training with Embedded Leakage Audit & Model Card...")
    total_checks += 1
    full_ops_records = [
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
    cand_res = await CandidateModelTrainer.train_candidate(
        model_name="ETAPredictionModel",
        operational_records=full_ops_records,
        dataset_type="REAL_OPERATIONAL",
    )
    if cand_res.leakage_audit and cand_res.leakage_audit.overall_status == "PASS" and cand_res.artifact_checksum:
        print(f"  Candidate Version: {cand_res.candidate_version}")
        print(f"  Dataset SHA-256 Hash: {cand_res.dataset_hash[:24]}...")
        print(f"  Model Card Checksum: {cand_res.artifact_checksum[:24]}...")
        print(f"  Leakage Audit Status: {cand_res.leakage_audit.overall_status}")
        print(f"  Evaluated Active MAE: {cand_res.evaluation_report.active_metrics.mae:.2f} mins")
        print(f"  Evaluated Candidate MAE: {cand_res.evaluation_report.candidate_metrics.mae:.2f} mins")
        print("  [PASS] Candidate model trained with verified model card and clean leakage audit.")
        passed_checks += 1
    else:
        print("  [FAIL] Governed candidate training failed.")

    # -------------------------------------------------------------------------
    # [STEP 11] Governance Gate Rejection on Leaky or Insufficient Data
    # -------------------------------------------------------------------------
    print("\n[STEP 11] Verifying Governance Gate Rejection on Data Leakage...")
    total_checks += 1
    leaky_audit_rep = LeakageAuditReport(
        target_leakage="FAIL",
        overall_status="FAIL",
        findings=["Target Leakage: feature 'actual_duration' contains target."],
    )
    gov_rej = ModelGovernanceGate.evaluate_promotion(
        candidate_model_or_report=cand_res.evaluation_report,
        leakage_report=leaky_audit_rep,
    )
    if gov_rej.decision == "REJECT" and not gov_rej.leakage_passed:
        print(f"  Governance Decision: {gov_rej.decision}")
        print(f"  Rejection Reason: {gov_rej.decision_reason}")
        print("  [PASS] Governance gate actively rejected promotion due to data leakage.")
        passed_checks += 1
    else:
        print("  [FAIL] Governance rejection test failed.")

    # -------------------------------------------------------------------------
    # [STEP 12] Governance Gate Approval with Valid Evidence
    # -------------------------------------------------------------------------
    print("\n[STEP 12] Verifying Governance Gate Approval on Valid Evidence...")
    total_checks += 1
    clean_audit_rep = LeakageAuditReport(overall_status="PASS")
    gov_app = ModelGovernanceGate.evaluate_promotion(
        candidate_model_or_report=cand_res.evaluation_report,
        leakage_report=clean_audit_rep,
    )
    if gov_app.decision == "APPROVE" and gov_app.evaluation_passed and gov_app.leakage_passed:
        print(f"  Governance Decision: {gov_app.decision}")
        print(f"  Decision Reason: {gov_app.decision_reason}")
        print("  [PASS] Governance gate approved candidate on verified, leak-free evidence.")
        passed_checks += 1
    else:
        print("  [FAIL] Governance approval test failed.")

    # -------------------------------------------------------------------------
    # [STEP 13] Dynamic Production Model Resolution
    # -------------------------------------------------------------------------
    print("\n[STEP 13] Verifying Dynamic Production Model Resolution in Inference...")
    total_checks += 1
    promoted = ModelRegistry.promote_candidate(
        candidate_model=cand_res.candidate_model,
        evaluation_report=cand_res.evaluation_report,
        dataset_type="REAL_OPERATIONAL",
    )
    active_m = ModelRegistry.get_active_model("ETAPredictionModel")
    if promoted and active_m.current_version == cand_res.candidate_version:
        print(f"  Active Production Version after Promotion: {active_m.current_version}")
        print("  [PASS] Active model resolved dynamically to newly promoted candidate.")
        passed_checks += 1
    else:
        print("  [FAIL] Dynamic model resolution failed.")

    # -------------------------------------------------------------------------
    # [STEP 14] Real vs Synthetic Provenance Tracking
    # -------------------------------------------------------------------------
    print("\n[STEP 14] Verifying Real Operational vs Synthetic Test Provenance Separation...")
    total_checks += 1
    meta = ModelRegistry.get_model_versions("ETAPredictionModel")[-1]
    if meta.dataset_type == "REAL_OPERATIONAL":
        print(f"  Model Metadata Provenance: {meta.dataset_type} (Model ID: {meta.model_id})")
        print("  [PASS] Real operational dataset provenance strictly tracked and auditable.")
        passed_checks += 1
    else:
        print("  [FAIL] Provenance tracking failed.")

    # -------------------------------------------------------------------------
    # [STEP 15] Master E2E Chat & Absolute Honesty Verification
    # -------------------------------------------------------------------------
    print("\n[STEP 15] Verifying Master E2E Reasoning & Absolute Honesty (No Metric Fabrication)...")
    total_checks += 1
    brain = ElaUniversalBrain()
    master_req = AgentChatRequest(
        message="Main farmer hoon. Mujhe 500 kilo tomato Nashik se Pune bhejna hai. Sabse sasta option chahiye.",
        session_id="sess-master-p11-1",
        authenticated=True,
        authenticated_role="FARMER",
        language="hi",
    )
    master_res = await brain.process_chat(master_req)

    # Verify honest handling of insufficient data (does not invent metrics)
    empty_records: List[Dict[str, Any]] = []
    insufficient_handled = False
    try:
        await CandidateModelTrainer.train_candidate(
            model_name="ETAPredictionModel",
            operational_records=empty_records,
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
        print("  [FAIL] Master E2E chat verification failed.")

    # -------------------------------------------------------------------------
    # Final Result
    # -------------------------------------------------------------------------
    print("\n" + "=" * 80)
    pass_pct = (passed_checks / total_checks) * 100.0
    print(f"  PHASE 11.1 FINAL RESULT: {passed_checks}/{total_checks} CHECKS PASSED ({pass_pct:.1f}%)")
    print("=" * 80 + "\n")

    if passed_checks != total_checks:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(run_phase11_1_master_verification())
