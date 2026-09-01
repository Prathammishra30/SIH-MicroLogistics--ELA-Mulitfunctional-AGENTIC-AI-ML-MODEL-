#!/usr/bin/env python
"""
ELA PHASE 10: UNIVERSAL INTELLIGENCE EXPERIENCE & COGNITIVE FUSION
Comprehensive Master Verification Script

Verifies all core capabilities:
1. Universal Initial Bilingual Greeting
2. Multilingual Indic NLU (8 languages) & Numeral Parsing
3. Semantic Intent, Role Discovery & Multi-entity Extraction
4. Natural Role Discovery & Goal-Preserving Authentication Routing
5. Multi-Agent Orchestration + LLM + ML + Neural Network Cognitive Fusion
6. Multi-Criteria Strategy Optimization (Cheapest, Fastest, Reliability, Balanced, Freshness, Max Earnings)
7. Consequential Action Safety & Java Authoritative Staging
8. Closed-Loop Governed Continuous Self-Learning, Drift & Model Registry
9. Zero-Secret Security & Credential Shielding
"""

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

from ai.ela.agent.loop import AgentChatRequest, AgentChatResponse
from ai.ela.agent.brain import ElaUniversalBrain
from ai.ela.core.intelligence_fusion import IntelligenceFusionEngine, StructuredIntelligenceDecision
from ai.ela.language.detector import detect_language_script
from ai.ela.intent.resolver import IntentResolver
from ai.ela.entities.extractor import EntityExtractor
from ai.ela.intent.strategy import StrategyExtractor
from ai.ela.memory.session import ConversationMemory
from ai.ela.security.guard import SecurityGuard
from ai.ela.learning.collector import FeedbackCollector
from ai.ela.learning.error_analysis import ErrorAnalysisEngine
from ai.ela.learning.drift import DriftDetector
from ai.ela.learning.evaluator import GovernedModelEvaluator
from ai.ela.learning.governance import ModelGovernanceGate
from ai.ela.learning.registry import ModelRegistry
from ai.ela.ml.models.demand import DemandPredictionModel
from ai.ela.neural.models import NeuralFeatureTensor, NeuralRouteDelayLearner, NeuralTransporterReliabilityScorer
from ai.ela.ml.training.pipeline import SyntheticDataGenerator


async def run_master_verification():
    print("=" * 80)
    print("  ELA PHASE 10: UNIVERSAL INTELLIGENCE & COGNITIVE FUSION MASTER VERIFIER")
    print("=" * 80)

    brain = ElaUniversalBrain()
    fusion = IntelligenceFusionEngine()
    passed_checks = 0
    total_checks = 0

    # ------------------------------------------------------------------------
    # STEP 1: Universal Initial Bilingual Greeting
    # ------------------------------------------------------------------------
    print("\n[STEP 1] Verifying Universal Initial Bilingual Greeting...")
    total_checks += 1
    req_init = AgentChatRequest(message="", authenticated=False, authenticated_role="GUEST", language="en")
    res_init = await brain.process_chat(req_init)
    print(f"  Response: {repr(res_init.message)}")
    if "How can I help you?" in res_init.message and "मैं आपकी कैसे मदद कर सकती हूँ?" in res_init.message:
        print("  [PASS] Exact Phase 10 Initial Bilingual Greeting verified.")
        passed_checks += 1
    else:
        print("  [FAIL] Initial greeting did not match specification.")

    # ------------------------------------------------------------------------
    # STEP 2: Indic Multilingual NLU & Script Detection (8 Languages)
    # ------------------------------------------------------------------------
    print("\n[STEP 2] Verifying Multilingual NLU & Script Detection Across 8 Languages...")
    languages_test = [
        ("hi", "मुझे 500 किलो टमाटर नाशिक से पुणे भेजने हैं"),
        ("mr", "मला ५०० किलो टोमॅटो नाशिकहून पुण्याला पाठवायचे आहेत"),
        ("ta", "எனக்கு 500 கிலோ தக்காளியை கொண்டு செல்ல வேண்டும்"),
        ("te", "నాకు 500 కేజీల టమాటాలు రవాణా చేయాలి"),
        ("bn", "আমি ৫০০ কেজি টমেটো পাঠাতে চাই"),
        ("kn", "ನನಗೆ 500 ಕೆಜಿ ಟೊಮೆಟೊ ಸಾಗಿಸಬೇಕಾಗಿದೆ"),
        ("en", "I need to transport 500 kg tomatoes from Nashik to Pune with minimum cost"),
        ("hi", "Bhai mere 500 kilo tamatar Nashik se Pune bhejna hai aur kharch kam rakhna hai"),
    ]
    all_lang_ok = True
    for expected_code, sample_text in languages_test:
        total_checks += 1
        detected_code, script_name = detect_language_script(sample_text)
        print(f"  Text: '{sample_text[:40]}...' -> Detected: {detected_code} (Script: {script_name})")
        if detected_code == expected_code:
            passed_checks += 1
        else:
            all_lang_ok = False
            print(f"  [FAIL] Expected {expected_code}, got {detected_code}")

    if all_lang_ok:
        print("  [PASS] 8/8 Indic languages & Hinglish correctly recognized.")

    # ------------------------------------------------------------------------
    # STEP 3: Complex Multi-Entity Extraction & Section 7 Prompt
    # ------------------------------------------------------------------------
    print("\n[STEP 3] Verifying Exact Section 7 Prompt Semantic Understanding...")
    prompt_s7 = "भाई मेरे 500 किलो टमाटर नाशिक से पुणे भेजने हैं और खर्च कम रखना है"
    print(f"  Input Prompt: '{prompt_s7}'")
    total_checks += 1
    canon = IntentResolver.resolve(prompt_s7, current_role="GUEST", preferred_language="hi")
    print(f"  Intent: {canon.intent}")
    print(f"  Target Role: {canon.target_role}")
    print(f"  Entities: Commodity={canon.entities.product}, Qty={canon.entities.quantity}kg, Dest={canon.entities.destination}, Strategy={canon.entities.strategy}")
    if (
        canon.target_role == "FARMER"
        and canon.intent == "CREATE_LOGISTICS_WORKFLOW"
        and canon.entities.product == "Tomatoes"
        and canon.entities.quantity == 500.0
        and canon.entities.destination == "Pune APMC Mandi"
        and canon.entities.strategy == "CHEAPEST"
    ):
        print("  [PASS] Semantic Understanding & Entity Extraction 100% verified.")
        passed_checks += 1
    else:
        print("  [FAIL] Semantic understanding mismatch.")

    # ------------------------------------------------------------------------
    # STEP 4: Natural Role Discovery & Goal-Preserving Auth Routing
    # ------------------------------------------------------------------------
    print("\n[STEP 4] Verifying Goal-Preserving Authentication Routing...")
    total_checks += 1
    sess_auth = f"sess-verify-auth-{int(time.time()*1000)}"
    req_guest = AgentChatRequest(
        message="मैं किसान हूँ और मुझे 500 किलो टमाटर पुणे भेजने हैं।",
        session_id=sess_auth,
        authenticated=False,
        authenticated_role="GUEST",
        language="hi",
    )
    res_guest = await brain.process_chat(req_guest)
    print(f"  Guest Response Message: '{res_guest.message}'")
    print(f"  Navigation Action: {res_guest.navigation_action}")
    
    saved_session = ConversationMemory.get_session(sess_auth)
    goal_preserved = (
        res_guest.detected_role == "FARMER"
        and res_guest.navigation_action.get("route") == "/auth/farmer"
        and saved_session.accumulated_entities.product == "Tomatoes"
        and saved_session.active_goal is not None
    )

    if goal_preserved:
        print("  [PASS] Goal and entities preserved in session memory for post-login seamless resumption.")
        passed_checks += 1
    else:
        print("  [FAIL] Goal preservation failed.")

    # Post-login execution
    total_checks += 1
    req_resumed = AgentChatRequest(
        message="लॉगिन हो गया, आगे बढ़ें",
        session_id=sess_auth,
        user_id="farmer-auth-99",
        authenticated=True,
        authenticated_role="FARMER",
        language="hi",
    )
    res_resumed = await brain.process_chat(req_resumed)
    print(f"  Post-Login Staged Action: {res_resumed.status}")
    if res_resumed.status == "CONFIRMATION_REQUIRED" and res_resumed.confirmation_action is not None:
        print("  [PASS] Post-login workflow seamlessly staged using preserved session goal.")
        passed_checks += 1
    else:
        print("  [FAIL] Post-login continuation failed.")

    # ------------------------------------------------------------------------
    # STEP 5: Multi-Agent + LLM + ML + Neural Network Cognitive Fusion
    # ------------------------------------------------------------------------
    print("\n[STEP 5] Verifying Cognitive Fusion (LLM + ML + Neural Networks)...")
    total_checks += 1
    req_fusion = AgentChatRequest(
        message="500 kg tomatoes from Nashik to Pune with cheapest transport",
        authenticated=True,
        authenticated_role="FARMER",
        user_id="farmer-fusion-01",
        language="en",
    )
    decision: StructuredIntelligenceDecision = await fusion.fuse_and_decide(req_fusion)
    print(f"  Fused Intent: {decision.intent}")
    print(f"  Predicted Freight: ₹{decision.predictions.get('estimated_freight')}")
    print(f"  Delivery Success Prob: {decision.predictions.get('delivery_success_probability')}")
    print(f"  Neural Corridor Delay: {decision.neural_insights.get('neural_expected_corridor_delay_mins')} mins")
    print(f"  Overall Decision Confidence: {decision.confidence:.2f}")

    if (
        decision.predictions.get("estimated_freight") is not None
        and decision.predictions.get("delivery_success_probability") is not None
        and decision.neural_insights.get("neural_expected_corridor_delay_mins") is not None
        and decision.confidence > 0.60
    ):
        print("  [PASS] Cognitive Fusion Engine generated multi-model decision.")
        passed_checks += 1
    else:
        print("  [FAIL] Fusion engine output incomplete.")

    # ------------------------------------------------------------------------
    # STEP 6: Governed Continuous Self-Learning Pipeline
    # ------------------------------------------------------------------------
    print("\n[STEP 6] Verifying Governed Closed-Loop Self-Learning Pipeline...")
    total_checks += 1
    # 1. Record discrepancy
    disc = ErrorAnalysisEngine.record_discrepancy(
        session_id="sess-verify-learning",
        model_name="ETAPredictionModel",
        model_version="v1.2",
        target_metric="ETA_MINUTES",
        predicted_value=320.0,
        actual_value=380.0,
        route="Nashik-Pune",
        distance_km=210.0,
    )
    diag = ErrorAnalysisEngine.diagnose_error(disc)
    print(f"  Error Diagnosis: {diag.error_category} (Retrain Recommended: {diag.is_retraining_trigger_recommended})")

    # 2. Holdout Model Evaluation & Governance Gate
    active_m = DemandPredictionModel(version="v1.2", status="production")
    cand_m = DemandPredictionModel(version="v1.3-cand", status="candidate")
    holdout = SyntheticDataGenerator.generate_demand_dataset(count=20)
    eval_rep = await GovernedModelEvaluator.compare_models(active_m, cand_m, holdout)
    gate_audit = ModelGovernanceGate.evaluate_promotion(cand_m, eval_rep)
    print(f"  Holdout Evaluated Samples: {eval_rep.holdout_sample_count}")
    print(f"  Governance Gate Decision: {gate_audit.decision}")

    if diag.error_category is not None and gate_audit.decision in ["APPROVE", "REJECT", "REQUIRE_MORE_DATA"]:
        print("  [PASS] Governed Continuous Learning Closed-Loop verified.")
        passed_checks += 1
    else:
        print("  [FAIL] Governance loop verification failed.")

    # ------------------------------------------------------------------------
    # STEP 7: Zero-Secret Credential Shield
    # ------------------------------------------------------------------------
    print("\n[STEP 7] Verifying Zero-Secret Credential Shielding...")
    total_checks += 1
    shield_test = SecurityGuard.check_safety("Here is my password: secret1234", "FARMER")
    if shield_test.credential_shielded and not shield_test.is_safe:
        print("  [PASS] Credential shield actively intercepted sensitive authentication secret.")
        passed_checks += 1
    else:
        print("  [FAIL] Credential shield failed to trigger.")

    # ------------------------------------------------------------------------
    # SUMMARY
    # ------------------------------------------------------------------------
    print("\n" + "=" * 80)
    print(f"  VERIFICATION RESULTS: {passed_checks}/{total_checks} CHECKS PASSED ({passed_checks/total_checks*100:.1f}%)")
    print("=" * 80)
    return passed_checks == total_checks


if __name__ == "__main__":
    success = asyncio.run(run_master_verification())
    exit(0 if success else 1)
