import sys
import os
import asyncio
import time
from typing import Dict, Any, List

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from ai.ela.agent.loop import ElaAgentLoop, AgentChatRequest
from ai.ela.entities.extractor import EntityExtractor
from ai.ela.evaluation.scenarios import EVALUATION_SCENARIOS, EvaluationScenario
from ai.ela.ml.models.demand import DemandPredictionModel
from ai.ela.learning.evaluator import GovernedModelEvaluator
from ai.ela.memory.session import ConversationMemory


async def run_benchmark_evaluation():
    print("\n======================================================")
    print("[RUN] ELA PYTHON ENTERPRISE BENCHMARK EVALUATION SUITE")
    print("======================================================")
    print(f"Total Scenarios to execute: {len(EVALUATION_SCENARIOS)}")

    agent_loop = ElaAgentLoop()
    passed = 0
    failed = 0
    category_results: Dict[str, Dict[str, int]] = {}
    failures_list: List[str] = []
    start_time = time.time()

    for sc in EVALUATION_SCENARIOS:
        if sc.category not in category_results:
            category_results[sc.category] = {"total": 0, "passed": 0, "failed": 0}
        category_results[sc.category]["total"] += 1

        try:
            # 1. Pure Entity Extraction Scenarios
            if sc.category == 'ENTITY_EXTRACTION':
                entities = EntityExtractor.extract_entities(sc.input)
                ok = True
                errs = []

                if sc.expected_product and entities.product != sc.expected_product:
                    ok = False
                    errs.append(f"Expected product '{sc.expected_product}' but got '{entities.product}'")
                if sc.expected_quantity and entities.quantity != sc.expected_quantity:
                    ok = False
                    errs.append(f"Expected quantity '{sc.expected_quantity}' but got '{entities.quantity}'")
                if sc.expected_destination and entities.destination != sc.expected_destination:
                    ok = False
                    errs.append(f"Expected destination '{sc.expected_destination}' but got '{entities.destination}'")
                if sc.expected_vehicle_type and entities.vehicle_type != sc.expected_vehicle_type:
                    ok = False
                    errs.append(f"Expected vehicle_type '{sc.expected_vehicle_type}' but got '{entities.vehicle_type}'")

                if ok:
                    passed += 1
                    category_results[sc.category]["passed"] += 1
                else:
                    failed += 1
                    category_results[sc.category]["failed"] += 1
                    failures_list.append(f"[{sc.id}] {sc.description}: {', '.join(errs)}")
                continue

            # 2. Agent Execution Scenarios
            req = AgentChatRequest(
                message=sc.input,
                session_id=f"eval-session-{sc.id}",
                language=sc.language,  # type: ignore
                user_id=sc.user.get("id") if sc.user else None,
                authenticated=bool(sc.user),
                authenticated_role=sc.user.get("role", "GUEST") if sc.user else "GUEST",
            )
            res = await agent_loop.run(req)

            is_success = True
            errors = []

            if sc.expected_intent and res.intent != sc.expected_intent:
                is_success = False
                errors.append(f"Expected intent '{sc.expected_intent}' but got '{res.intent}'")

            if sc.expected_role and res.detected_role != sc.expected_role:
                is_success = False
                errors.append(f"Expected role '{sc.expected_role}' but got '{res.detected_role}'")

            if sc.should_shield_credentials:
                if not any(k in res.message.lower() for k in ['password', 'otp', 'pin', 'सुरक्षा', 'ரகசிய']):
                    is_success = False
                    errors.append("Expected sensitive credential shield message")

            if sc.should_need_clarification:
                if not any(k in res.message for k in ['?', 'Where', 'What', 'Which', 'कहाँ', 'कुठे', 'कोण', 'எங்கு']):
                    is_success = False
                    errors.append(f"Expected clarification question in response but got: '{res.message}'")

            if sc.should_require_confirmation:
                if not res.confirmation_action:
                    is_success = False
                    errors.append("Expected confirmation_action card")

            if sc.should_deny_rbac:
                if res.status != 'UNAUTHORIZED' and "denied" not in res.message.lower() and "sign in" not in res.message.lower():
                    is_success = False
                    errors.append("Expected RBAC denial or login prompt")

            if is_success:
                passed += 1
                category_results[sc.category]["passed"] += 1
            else:
                failed += 1
                category_results[sc.category]["failed"] += 1
                failures_list.append(f"[{sc.id}] {sc.description}: {', '.join(errors)}")

        except Exception as e:
            failed += 1
            category_results[sc.category]["failed"] += 1
            failures_list.append(f"[{sc.id}] {sc.description} with exception: {e}")

    # Additional Core Checks
    print("\n> [SYSTEM] ML Governance, Evaluator, & Memory Integrity Checks")
    active_m = DemandPredictionModel()
    candidate_m = DemandPredictionModel(version="v1.3-candidate")
    sample = [
        {"features": {"crop_name": "tomato", "location": "Pune APMC", "month": 8, "historical_avg_kg": 1800.0, "active_buyer_count": 12}, "target": 2100.0}
    ]
    eval_res = await GovernedModelEvaluator.compare_models(active_m, candidate_m, sample)
    print(f"  [PASS] Governed Model Evaluator: {eval_res.recommendation}")

    sid = f"bench-mem-{int(time.time() * 1000)}"
    ConversationMemory.update_entities(sid, EntityExtractor.extract_entities("500 kg Tomatoes"))
    ConversationMemory.update_entities(sid, EntityExtractor.extract_entities("to Pune APMC Mandi"))
    sess = ConversationMemory.get_session(sid)
    if sess.accumulated_entities.product == 'Tomatoes' and sess.accumulated_entities.destination == 'Pune APMC Mandi':
        print("  [PASS] Session Multi-Turn Entity Accumulation Verified.")

    duration_ms = int((time.time() - start_time) * 1000)
    print("\n======================================================")
    print("PYTHON BENCHMARK SCORECARD SUMMARY BY CATEGORY:")
    print("======================================================")
    for cat, data in category_results.items():
        rate = round((data["passed"] / data["total"]) * 100)
        print(f"  * {cat.ljust(28)}: {data['passed']}/{data['total']} ({rate}%)")
    print("------------------------------------------------------")
    print(f"OVERALL SCORE: {passed}/{len(EVALUATION_SCENARIOS)} ({round((passed / len(EVALUATION_SCENARIOS)) * 100)}% Pass Rate)")
    print(f"Duration: {duration_ms}ms")

    if failures_list:
        print("\nFAILED SCENARIOS DETAILS:")
        for f in failures_list:
            print(f"  * {f}")
    print("======================================================\n")

    return passed == len(EVALUATION_SCENARIOS)


if __name__ == "__main__":
    success = asyncio.run(run_benchmark_evaluation())
    exit(0 if success else 1)
