#!/usr/bin/env python3
"""
ELA PHASE 12.4 MASTER RUNTIME VERIFICATION SCRIPT
=================================================
Validates ELA Adaptive Execution x Real-World Observation x Closed-Loop Learning:
1. Scenario A: Normal Operation & Authoritative Outcome Verification
2. Scenario B: Single Deviation Anomaly & Preliminary Category Protection
3. Scenario C: Repeated Systematic Corridor Deviations & Adaptation Proposal
4. Scenario D: Governed Candidate Training, Holdout Evaluation & Promotion
5. Scenario E: Candidate Degradation Rejection & Audited Model Rollback
6. Scenario F: Planning Engine Consumption of Corridor Signals & Execution Trace
7. Performance Latency & Governed Learning SLA Benchmarks
"""

import sys
import os
import asyncio
import time
from datetime import datetime, timezone

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from ai.ela.agent.brain import ElaUniversalBrain
from ai.ela.agent.loop import AgentChatRequest
from ai.ela.learning.outcomes import OutcomeManager, ElaVerifiedOutcome
from ai.ela.learning.deviations import DeviationAnalyzer, ErrorCategorizer, DeviationResult
from ai.ela.learning.events import LearningEventManager, ElaLearningEvent, PrivacySanitizer
from ai.ela.learning.adaptation import AdaptationEngine, ElaAdaptationProposal, CorridorAdjustmentSignal
from ai.ela.learning.candidate_trainer import CandidateModelTrainer
from ai.ela.learning.evaluator import GovernedModelEvaluator
from ai.ela.learning.governance import ModelGovernanceGate
from ai.ela.learning.registry import ModelRegistry
from ai.ela.planner.observation import ObservationEngine
from ai.ela.neural.transformer.inference import TransformerNeuralCore


def print_step(title: str):
    print(f"\n{'='*75}")
    print(f"  {title}")
    print(f"{'='*75}")


async def main():
    print_step("PHASE 12.4 — ELA ADAPTIVE EXECUTION x CLOSED-LOOP LEARNING VERIFICATION")

    # Reset in-memory state for clean verification run
    OutcomeManager.reset_for_testing()
    LearningEventManager.reset_for_testing()
    AdaptationEngine.reset_for_testing()
    ObservationEngine.reset_for_testing()
    ModelRegistry.reset_for_testing()
    ModelRegistry.ensure_defaults()
    brain = ElaUniversalBrain()

    # -------------------------------------------------------------------------
    # SCENARIO A: Normal Operation & Authoritative Outcome Verification
    # -------------------------------------------------------------------------
    print_step("SCENARIO A: Normal Operation & Authoritative Outcome Verification")
    session_id = "phase12_4-scenario-a-session"
    user_id = "farmer-nashik-201"

    req_a = AgentChatRequest(
        message="Book 500 kg tomatoes from Nashik to Pune APMC Mandi, authorized",
        authenticated=True,
        authenticated_role="FARMER",
        user_id=user_id,
        language="en",
        session_id=session_id,
        context={"user_authorized": True},
    )
    t0 = time.perf_counter()
    resp_a = await brain.process_chat(req_a)
    lat_a_ms = (time.perf_counter() - t0) * 1000.0

    print(f"[*] User Request          : \"{req_a.message}\"")
    print(f"[*] Response Status       : {resp_a.status} (Intent: {resp_a.intent})")
    print(f"[*] Plan ID               : {resp_a.trace.planning['plan_id']}")
    print(f"[*] Verification Status   : {resp_a.trace.verification_status}")
    print(f"[*] Learning Telemetry    : {resp_a.trace.learning}")
    print(f"[*] Turn Latency          : {lat_a_ms:.2f} ms")

    assert resp_a.trace.verification_status == "VERIFIED"
    assert resp_a.trace.learning is not None
    assert resp_a.trace.learning["enabled"] is True
    print("[+] Scenario A PASSED: Operation completed with authoritative outcome linkage.")

    # -------------------------------------------------------------------------
    # SCENARIO B: Single Deviation Anomaly & Preliminary Signal Protection
    # -------------------------------------------------------------------------
    print_step("SCENARIO B: Single Deviation Anomaly & Preliminary Category Protection")
    corridor_b = "Nashik-Solapur Mandi"

    outcome_b = OutcomeManager.record_outcome(
        expected_result={"eta_minutes": 180.0, "cost": 2800.0},
        actual_result={"eta_minutes": 208.0, "cost": 2850.0, "booking_id": "BK-SOLAPUR-01"},
        outcome_type="DELIVERY",
        verification_source="JAVA_AUTHORITY",
        plan_id="plan-solapur-1",
        step_id="step-exec-1",
        booking_id="BK-SOLAPUR-01",
        provenance="REAL_OPERATIONAL",
    )
    deviations_b = DeviationAnalyzer.analyze_outcome(
        outcome_id=outcome_b.outcome_id,
        expected=outcome_b.expected_result,
        actual=outcome_b.actual_result,
    )
    for dev in deviations_b:
        m_name = "ETAPredictionModel" if "eta" in dev.metric_name else "TransportCostModel"
        LearningEventManager.create_learning_event_from_deviation(
            outcome=outcome_b,
            deviation=dev,
            model_name=m_name,
            corridor=corridor_b,
        )

    sig_b = AdaptationEngine.evaluate_corridor_evidence(corridor=corridor_b)
    baseline_before = ModelRegistry.get_active_model("ETAPredictionModel").current_version

    print(f"[*] Outcome ID            : {outcome_b.outcome_id}")
    print(f"[*] Observed Deviations   : {[f'{d.metric_name}: res={d.residual_or_error}, cat={d.error_category}' for d in deviations_b]}")
    print(f"[*] Corridor Signal       : {sig_b.confidence_category} (samples={sig_b.sample_count}, offset={sig_b.delay_offset_minutes}m)")
    print(f"[*] Formal Proposals Count: {len(AdaptationEngine.get_all_proposals())} (Should be 0 - No premature mutation)")
    print(f"[*] Production Version    : {baseline_before} (Strictly Immutable)")

    assert sig_b.confidence_category == "PRELIMINARY"
    assert sig_b.sample_count == 1
    assert len(AdaptationEngine.get_all_proposals()) == 0
    assert ModelRegistry.get_active_model("ETAPredictionModel").current_version == baseline_before
    print("[+] Scenario B PASSED: Single anomaly protected from premature mutation.")

    # -------------------------------------------------------------------------
    # SCENARIO C: Repeated Systematic Corridor Deviations & Adaptation Proposal
    # -------------------------------------------------------------------------
    print_step("SCENARIO C: Repeated Systematic Corridor Deviations & Adaptation Proposal")
    corridor_c = "Nashik-Pune APMC Mandi"

    # Inject 10 verified outcomes showing persistent ~32-35 min delays
    for i in range(10):
        out_i = OutcomeManager.record_outcome(
            expected_result={"eta_minutes": 180.0, "cost": 2800.0},
            actual_result={"eta_minutes": 215.0, "cost": 2820.0, "booking_id": f"BK-SYS-{i:02d}"},
            outcome_type="DELIVERY",
            verification_source="JAVA_AUTHORITY",
            plan_id=f"plan-sys-{i}",
            step_id=f"step-sys-{i}",
            booking_id=f"BK-SYS-{i:02d}",
            provenance="REAL_OPERATIONAL",
        )
        devs_i = DeviationAnalyzer.analyze_outcome(
            outcome_id=out_i.outcome_id,
            expected=out_i.expected_result,
            actual=out_i.actual_result,
        )
        for dev in devs_i:
            m_name = "ETAPredictionModel" if "eta" in dev.metric_name else "TransportCostModel"
            LearningEventManager.create_learning_event_from_deviation(
                outcome=out_i,
                deviation=dev,
                model_name=m_name,
                corridor=corridor_c,
            )

    sig_c = AdaptationEngine.evaluate_corridor_evidence(corridor=corridor_c)
    proposals_c = AdaptationEngine.get_all_proposals()

    print(f"[*] Corridor Evidence     : {corridor_c}")
    print(f"[*] Signal Category       : {sig_c.confidence_category} (samples={sig_c.sample_count})")
    print(f"[*] Calculated Bias Offset: +{sig_c.delay_offset_minutes} mins")
    print(f"[*] Formal Proposals Count: {len(proposals_c)}")
    prop = proposals_c[0]
    print(f"[*] Proposal ID           : {prop.proposal_id}")
    print(f"[*] Target Model          : {prop.target_model} ({prop.current_version})")
    print(f"[*] Reason                : {prop.reason}")
    print(f"[*] Proposal Status       : {prop.status} (Production weights NOT yet overwritten)")

    assert sig_c.confidence_category == "STATISTICALLY_CONFIDENT"
    assert sig_c.sample_count == 10
    assert len(proposals_c) >= 1
    assert prop.status == "PROPOSED"
    assert ModelRegistry.get_active_model("ETAPredictionModel").current_version == baseline_before
    print("[+] Scenario C PASSED: Systematic corridor error converted into formal proposal.")

    # -------------------------------------------------------------------------
    # SCENARIO D: Governed Candidate Model Training, Holdout Evaluation & Promotion
    # -------------------------------------------------------------------------
    print_step("SCENARIO D: Governed Candidate Model Training, Holdout Evaluation & Promotion")

    # Generate training data with shifted traffic distribution
    train_records = [
        {
            "features": {"distance_km": 160.0 + (i * 2), "load_weight_kg": 500.0, "route_type": "HIGHWAY", "weather_condition": "CLEAR"},
            "actual_value": 215.0 + (i * 2.1),
            "timestamp": f"2026-09-04T08:{i:02d}:00Z",
        }
        for i in range(25)
    ]
    holdout_records = [
        {
            "features": {"distance_km": 165.0 + (i * 2), "load_weight_kg": 550.0, "route_type": "HIGHWAY", "weather_condition": "CLEAR"},
            "actual_value": 220.0 + (i * 2.1),
            "timestamp": f"2026-09-04T09:{i:02d}:00Z",
        }
        for i in range(8)
    ]

    cand_result = await CandidateModelTrainer.train_candidate(
        model_name="ETAPredictionModel",
        operational_records=train_records,
        holdout_records=holdout_records,
        trigger_reason="CORRIDOR_BIAS_RESOLUTION",
    )

    print(f"[*] Candidate Version     : {cand_result.candidate_version}")
    print(f"[*] Parent Version        : {cand_result.parent_version}")
    print(f"[*] Training Samples      : {cand_result.training_sample_count}")
    print(f"[*] Holdout Samples       : {cand_result.holdout_sample_count}")
    print(f"[*] Leakage Audit Status  : {cand_result.leakage_audit.overall_status}")
    print(f"[*] Holdout MAE Delta     : {cand_result.evaluation_report.mae_improvement_pct}%")
    print(f"[*] Governance Decision   : {cand_result.governance_decision}")
    print(f"[*] Promoted to Production: {cand_result.promoted_to_production}")
    print(f"[*] Active Model in Reg   : {ModelRegistry.get_active_model('ETAPredictionModel').current_version}")

    assert cand_result.leakage_audit.overall_status == "PASS"
    assert cand_result.evaluation_report is not None
    print("[+] Scenario D PASSED: Governed candidate pipeline executed with anti-leakage audit.")

    # -------------------------------------------------------------------------
    # SCENARIO E: Candidate Degradation Rejection & Audited Model Rollback
    # -------------------------------------------------------------------------
    print_step("SCENARIO E: Candidate Degradation Rejection & Audited Model Rollback")
    from ai.ela.learning.evaluator import ModelEvaluationReport
    from ai.ela.ml.types import ModelMetrics
    from ai.ela.data.validation import DataQualityReport
    from ai.ela.learning.leakage_audit import LeakageAuditReport

    # 1. Test Gating Rejection on Degraded Candidate
    degraded_report = ModelEvaluationReport(
        active_model_name="ETAPredictionModel",
        active_model_version=ModelRegistry.get_active_model("ETAPredictionModel").current_version,
        active_metrics=ModelMetrics(mae=12.0, rmse=15.0, sample_count=20),
        candidate_model_name="ETAPredictionModel",
        candidate_model_version="v-degraded-cand-01",
        candidate_metrics=ModelMetrics(mae=18.0, rmse=22.0, sample_count=20),
        mae_improvement_pct=-50.0,
        rmse_improvement_pct=-46.0,
        holdout_sample_count=20,
        recommendation="REJECT_CANDIDATE",
        decision_reason="Degraded MAE by 50% on holdout.",
    )
    dq_valid = DataQualityReport(
        total_records_checked=30,
        valid_records_count=30,
        invalid_records_count=0,
        outliers_detected=0,
        leakage_detected=False,
        temporal_order_valid=True,
        validation_status="PASSED",
    )
    leakage_pass = LeakageAuditReport(model_name="ETAPredictionModel", overall_status="PASS")

    gov_reject = ModelGovernanceGate.evaluate_promotion(
        candidate_model_or_report=degraded_report,
        data_quality_report=dq_valid,
        leakage_report=leakage_pass,
    )
    print(f"[*] Degraded Cand Decision: {gov_reject.final_decision} (Reason: {gov_reject.decision_reason})")
    assert gov_reject.final_decision == "REJECT"

    # 2. Test Audited Rollback
    active_before_rollback = ModelRegistry.get_active_model("ETAPredictionModel").current_version
    rollback_target = "v1.2-transit-hybrid"
    rollback_meta = ModelRegistry.rollback_model("ETAPredictionModel", target_version=rollback_target)
    audit_log = ModelRegistry.get_rollback_audit_log()

    print(f"[*] Pre-Rollback Version  : {active_before_rollback}")
    print(f"[*] Target Rollback Ver   : {rollback_target}")
    print(f"[*] Post-Rollback Version : {ModelRegistry.get_active_model('ETAPredictionModel').current_version}")
    print(f"[*] Rollback Audit Record : {audit_log[-1]}")

    assert ModelRegistry.get_active_model("ETAPredictionModel").current_version == rollback_target
    assert audit_log[-1]["rolled_back_to"] == rollback_target
    print("[+] Scenario E PASSED: Degradation rejected and rollback audit verified.")

    # -------------------------------------------------------------------------
    # SCENARIO F: Planning Engine Consumption of Corridor Signals & Execution Trace
    # -------------------------------------------------------------------------
    print_step("SCENARIO F: Planning Engine Consumption of Corridor Signals & Execution Trace")

    # Set up signal on Nashik to Pune APMC Mandi
    AdaptationEngine.evaluate_corridor_evidence(corridor="Nashik-Pune APMC Mandi")

    req_f = AgentChatRequest(
        message="I want to transport 800 kg onions from Nashik to Pune APMC Mandi fast",
        authenticated=True,
        authenticated_role="FARMER",
        user_id="farmer-nashik-202",
        language="en",
        session_id="phase12_4-scenario-f-session",
    )
    t0 = time.perf_counter()
    resp_f = await brain.process_chat(req_f)
    lat_f_ms = (time.perf_counter() - t0) * 1000.0

    print(f"[*] User Request          : \"{req_f.message}\"")
    print(f"[*] Response Status       : {resp_f.status}")
    print(f"[*] Corridor Key          : {resp_f.trace.learning.get('corridor')}")
    print(f"[*] Corridor Adj Applied  : {resp_f.trace.learning.get('corridor_adjustment_applied')}")
    print(f"[*] Injected Corridor Sig : {resp_f.trace.learning.get('corridor_signal')}")
    print(f"[*] Turn Latency          : {lat_f_ms:.2f} ms")

    assert resp_f.trace.learning.get("corridor_adjustment_applied") is True
    assert resp_f.trace.learning["corridor_signal"]["delay_offset_minutes"] == 35.0
    print("[+] Scenario F PASSED: Planning engine consumed governed corridor adjustment signal.")

    # -------------------------------------------------------------------------
    # PERFORMANCE & SLA SUMMARY
    # -------------------------------------------------------------------------
    print_step("PHASE 12.4 CLOSED-LOOP LEARNING BENCHMARK SUMMARY")
    print(f"[*] Scenario A End-to-End Latency      : {lat_a_ms:.2f} ms (SLA < 1000ms)")
    print(f"[*] Scenario F End-to-End Latency      : {lat_f_ms:.2f} ms (SLA < 1000ms)")
    print(f"[*] Total Verified Outcomes Tracked    : {len(OutcomeManager.get_all_outcomes())}")
    print(f"[*] Total Normalized Learning Events   : {len(LearningEventManager.get_all_events())}")
    print(f"[*] Total Adaptation Proposals Generated: {len(AdaptationEngine.get_all_proposals())}")
    print(f"[*] Total Rollback Audits Logged       : {len(ModelRegistry.get_rollback_audit_log())}")
    print(f"[*] Active Production Models in Registry: {len(ModelRegistry.get_all_active_models())}")
    print("\n>>> ALL PHASE 12.4 CLOSED-LOOP LEARNING SCENARIOS FULLY VERIFIED! <<<")


if __name__ == "__main__":
    asyncio.run(main())
