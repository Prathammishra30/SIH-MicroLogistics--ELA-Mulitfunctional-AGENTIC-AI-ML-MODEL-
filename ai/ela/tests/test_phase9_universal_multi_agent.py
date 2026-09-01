# Comprehensive Phase 9 Test Suite — Universal Multi-Agent Intelligence & Autonomous Orchestration
import pytest
import asyncio
from typing import Dict, Any

from ai.ela.agents.contracts import AgentRequest, AgentResponse, CoordinatorResult
from ai.ela.agents.coordinator import AgentCoordinator
from ai.ela.agents.farmer_agent import FarmerAgent
from ai.ela.agents.buyer_agent import BuyerAgent
from ai.ela.agents.transporter_agent import TransporterAgent
from ai.ela.agents.market_agent import MarketAgent
from ai.ela.agents.logistics_agent import LogisticsAgent
from ai.ela.agents.risk_agent import RiskAgent
from ai.ela.agents.prediction_agent import PredictionAgent
from ai.ela.agent.brain import ElaUniversalBrain
from ai.ela.agent.loop import AgentChatRequest, AgentChatResponse
from ai.ela.agent.state import CanonicalEntities
from ai.ela.memory.session import ConversationMemory


# ============================================================================
# 1. AGENT REGISTRATION & CAPABILITY CONTRACTS
# ============================================================================

def test_agent_registration_and_capabilities():
    coordinator = AgentCoordinator()
    assert "FarmerAgent" in coordinator._agent_registry
    assert "BuyerAgent" in coordinator._agent_registry
    assert "TransporterAgent" in coordinator._agent_registry
    assert "MarketAgent" in coordinator._agent_registry
    assert "LogisticsAgent" in coordinator._agent_registry
    assert "RiskAgent" in coordinator._agent_registry
    assert "PredictionAgent" in coordinator._agent_registry

    farmer = coordinator.farmer_agent
    assert "FARMER_INVENTORY_MANAGEMENT" in farmer.capabilities
    assert "create_product" in farmer.allowed_tools

    risk = coordinator.risk_agent
    assert "DELAY_RISK_ANALYSIS" in risk.capabilities
    assert "DELIVERY_SUCCESS_EVALUATION" in risk.capabilities


@pytest.mark.asyncio
async def test_structured_communication_contract():
    pred_agent = PredictionAgent()
    req = AgentRequest(
        task_id="task-test-01",
        session_id="sess-test-01",
        goal_id="goal-test-01",
        role="FARMER",
        language="en",
        intent="CREATE_LOGISTICS_WORKFLOW",
        objective="Transport 500kg tomatoes to Pune",
        entities=CanonicalEntities(product="Tomatoes", quantity=500.0, destination="Pune APMC Mandi"),
        strategy="CHEAPEST",
    )

    resp = await pred_agent.run(req)
    assert resp.agent_id == "PredictionAgent"
    assert resp.status == "SUCCESS"
    assert "estimated_cost" in resp.data
    assert "estimated_duration_minutes" in resp.data
    assert len(resp.models_used) >= 2
    assert 0.0 <= resp.confidence <= 1.0


# ============================================================================
# 2. MULTI-AGENT COORDINATION & PARALLEL EXECUTION
# ============================================================================

@pytest.mark.asyncio
async def test_multi_agent_coordination_parallel_execution():
    coordinator = AgentCoordinator()
    req = AgentRequest(
        task_id="task-coord-01",
        session_id="sess-coord-01",
        goal_id="goal-coord-01",
        role="FARMER",
        language="hi",
        intent="CREATE_LOGISTICS_WORKFLOW",
        objective="Transport 500kg tomatoes to Pune",
        entities=CanonicalEntities(product="Tomatoes", quantity=500.0, destination="Pune APMC Mandi"),
        strategy="CHEAPEST",
    )

    res: CoordinatorResult = await coordinator.coordinate(req)
    assert res.status in ["SUCCESS", "PARTIAL_SUCCESS"]
    assert "FarmerAgent" in res.agent_responses
    assert "LogisticsAgent" in res.agent_responses
    assert "PredictionAgent" in res.agent_responses
    assert "RiskAgent" in res.agent_responses

    # Execution traces recorded
    assert len(res.execution_traces) >= 4
    for trace in res.execution_traces:
        assert trace.duration_ms >= 0.0
        assert trace.status == "SUCCESS"


# ============================================================================
# 3. CONFLICT RESOLUTION: CHEAPEST VS HIGHEST RELIABILITY
# ============================================================================

@pytest.mark.asyncio
async def test_conflict_resolution_cheapest_vs_reliability():
    coordinator = AgentCoordinator()

    # Case A: User requests CHEAPEST
    req_cheap = AgentRequest(
        task_id="task-conflict-cheap",
        session_id="sess-conflict-cheap",
        goal_id="goal-conflict-cheap",
        role="FARMER",
        language="hi",
        intent="CREATE_LOGISTICS_WORKFLOW",
        objective="Transport 500kg tomatoes",
        entities=CanonicalEntities(product="Tomatoes", quantity=500.0, destination="Pune APMC Mandi"),
        strategy="CHEAPEST",
    )
    res_cheap = await coordinator.coordinate(req_cheap)
    top_cheap = res_cheap.fused_recommendation["recommended_vehicle"]

    # Case B: User requests HIGHEST_RELIABILITY
    req_rel = AgentRequest(
        task_id="task-conflict-rel",
        session_id="sess-conflict-rel",
        goal_id="goal-conflict-rel",
        role="FARMER",
        language="hi",
        intent="CREATE_LOGISTICS_WORKFLOW",
        objective="Transport 500kg tomatoes",
        entities=CanonicalEntities(product="Tomatoes", quantity=500.0, destination="Pune APMC Mandi"),
        strategy="HIGHEST_RELIABILITY",
    )
    res_rel = await coordinator.coordinate(req_rel)
    top_rel = res_rel.fused_recommendation["recommended_vehicle"]

    # The winning vehicle or utility evaluation must adapt to strategy
    assert res_cheap.strategy == "CHEAPEST"
    assert res_rel.strategy == "HIGHEST_RELIABILITY"
    assert top_cheap["cost_score"] >= top_rel["cost_score"]


# ============================================================================
# 4. AGENT FAILURE RECOVERY WITHOUT HALLUCINATION
# ============================================================================

@pytest.mark.asyncio
async def test_agent_failure_recovery_graceful_degradation(monkeypatch):
    coordinator = AgentCoordinator()

    # Simulate unexpected failure in RiskAgent
    async def _failing_execute(req):
        raise RuntimeError("Risk ML Service temporarily unreachable")

    monkeypatch.setattr(coordinator.risk_agent, "execute", _failing_execute)

    req = AgentRequest(
        task_id="task-fail-01",
        session_id="sess-fail-01",
        goal_id="goal-fail-01",
        role="FARMER",
        language="en",
        intent="CREATE_LOGISTICS_WORKFLOW",
        objective="Transport 500kg tomatoes",
        entities=CanonicalEntities(product="Tomatoes", quantity=500.0, destination="Pune APMC Mandi"),
        strategy="BALANCED",
    )

    res: CoordinatorResult = await coordinator.coordinate(req)
    assert res.status == "PARTIAL_SUCCESS"
    assert "RiskAgent" in res.missing_capabilities
    # RiskAgent response is marked FAILED, not fabricated
    assert res.agent_responses["RiskAgent"].status == "FAILED"
    assert "Risk ML Service temporarily unreachable" in res.agent_responses["RiskAgent"].error_message
    # Other agents succeeded
    assert res.agent_responses["LogisticsAgent"].status == "SUCCESS"
    assert res.overall_confidence < 0.90  # Degraded confidence penalized


# ============================================================================
# 5. REQUIRED E2E TEST 1 — FARMER SCENARIO
# ============================================================================

@pytest.mark.asyncio
async def test_e2e_scenario_1_farmer():
    """
    TEST 1 — FARMER:
    Prompt: 'Main farmer hoon. 500 kilo tomato Nashik se Pune bhejna hai. Sabse sasta option chahiye.'
    Expected: FarmerAgent, LogisticsAgent, PredictionAgent, RiskAgent coordinated under CHEAPEST.
    """
    brain = ElaUniversalBrain()
    req = AgentChatRequest(
        message="Main farmer hoon. 500 kilo tomato Nashik se Pune bhejna hai. Sabse sasta option chahiye.",
        session_id="sess-e2e-farmer-01",
        authenticated=True,
        authenticated_role="FARMER",
        language="hi",
    )

    resp: AgentChatResponse = await brain.process_chat(req)
    assert resp.status == "CONFIRMATION_REQUIRED"
    assert resp.detected_role == "FARMER"
    assert resp.trace.strategy == "CHEAPEST"
    assert "cheapest" in resp.confirmation_action["summary"].lower()

    agents_involved = resp.trace.decision_trace["agents_involved"]
    assert "FarmerAgent" in agents_involved
    assert "LogisticsAgent" in agents_involved
    assert "PredictionAgent" in agents_involved
    assert "RiskAgent" in agents_involved


# ============================================================================
# 6. REQUIRED E2E TEST 2 — BUYER SCENARIO
# ============================================================================

@pytest.mark.asyncio
async def test_e2e_scenario_2_buyer():
    """
    TEST 2 — BUYER:
    Prompt: 'I am a buyer. Find me 2 tonnes of tomatoes near Pune and recommend the best procurement option.'
    Expected: BuyerAgent, MarketAgent, PredictionAgent, RiskAgent.
    """
    brain = ElaUniversalBrain()
    req = AgentChatRequest(
        message="I am a buyer. Find me 2 tonnes of tomatoes near Pune and recommend the best procurement option.",
        session_id="sess-e2e-buyer-01",
        authenticated=True,
        authenticated_role="BUYER",
        language="en",
    )

    resp: AgentChatResponse = await brain.process_chat(req)
    assert resp.detected_role == "BUYER"
    assert resp.status == "CONFIRMATION_REQUIRED"
    assert resp.confirmation_action["toolName"] == "create_procurement"

    agents_involved = resp.trace.decision_trace["agents_involved"]
    assert "BuyerAgent" in agents_involved
    assert "MarketAgent" in agents_involved


# ============================================================================
# 7. REQUIRED E2E TEST 3 — TRANSPORTER SCENARIO
# ============================================================================

@pytest.mark.asyncio
async def test_e2e_scenario_3_transporter():
    """
    TEST 3 — TRANSPORTER:
    Prompt: 'मी ट्रान्सपोर्टर आहे. माझ्या 5 टन ट्रकसाठी उपलब्ध ट्रिप शोधा.'
    Expected: TransporterAgent, LogisticsAgent, PredictionAgent, RiskAgent in Marathi.
    """
    brain = ElaUniversalBrain()
    req = AgentChatRequest(
        message="मी ट्रान्सपोर्टर आहे. माझ्या 5 टन ट्रकसाठी उपलब्ध ट्रिप शोधा.",
        session_id="sess-e2e-trans-01",
        authenticated=True,
        authenticated_role="TRANSPORTER",
        language="mr",
    )

    resp: AgentChatResponse = await brain.process_chat(req)
    assert resp.detected_role == "TRANSPORTER"
    assert resp.language == "mr"
    assert resp.status in ["SUCCESS", "CONFIRMATION_REQUIRED"]

    agents_involved = resp.trace.decision_trace["agents_involved"]
    assert "TransporterAgent" in agents_involved


# ============================================================================
# 8. REQUIRED E2E TEST 4 — MULTI-TURN LANGUAGE & STRATEGY SWITCH
# ============================================================================

@pytest.mark.asyncio
async def test_e2e_scenario_4_language_and_strategy_switch():
    """
    TEST 4 — LANGUAGE SWITCH:
    Turn 1 (Hindi): 'मुझे टमाटर पुणे भेजने हैं।'
    Turn 2 (Marathi): 'मला सर्वात स्वस्त गाडी पाहिजे.'
    Turn 3 (English): 'Actually make it fastest.'
    ELA must preserve the same goal (Tomatoes to Pune) while dynamically updating language & strategy.
    """
    brain = ElaUniversalBrain()
    session_id = "sess-e2e-multiturn-switch-01"

    # Turn 1
    r1 = await brain.process_chat(AgentChatRequest(
        message="मुझे टमाटर पुणे भेजने हैं।",
        session_id=session_id,
        authenticated=True,
        authenticated_role="FARMER",
    ))
    assert r1.detected_role == "FARMER"

    # Turn 2
    r2 = await brain.process_chat(AgentChatRequest(
        message="मला सर्वात स्वस्त गाडी पाहिजे.",
        session_id=session_id,
        authenticated=True,
        authenticated_role="FARMER",
    ))
    assert r2.trace.strategy == "CHEAPEST"
    assert r2.language == "mr"

    # Turn 3
    r3 = await brain.process_chat(AgentChatRequest(
        message="Actually make it fastest.",
        session_id=session_id,
        authenticated=True,
        authenticated_role="FARMER",
    ))
    assert r3.trace.strategy == "FASTEST"

    sess = ConversationMemory.get_session(session_id)
    assert sess.accumulated_entities.destination == "Pune APMC Mandi"
    assert sess.accumulated_entities.strategy == "FASTEST"


# ============================================================================
# 9. REQUIRED E2E TEST 5 — AGENT FAILURE (RISK DOWN)
# ============================================================================

@pytest.mark.asyncio
async def test_e2e_scenario_5_agent_failure(monkeypatch):
    """
    TEST 5 — AGENT FAILURE:
    Force RiskAgent failure. ELA must not fabricate a risk result, must continue safely
    with reduced confidence, and transparently log missing capability.
    """
    brain = ElaUniversalBrain()

    async def _failing_risk(req):
        raise TimeoutError("Risk service timeout after 5000ms")

    monkeypatch.setattr(brain.coordinator.risk_agent, "execute", _failing_risk)

    resp = await brain.process_chat(AgentChatRequest(
        message="Main farmer hoon. 500 kg tamatar Pune bhejna hai.",
        session_id="sess-e2e-risk-fail-01",
        authenticated=True,
        authenticated_role="FARMER",
    ))

    assert "RiskAgent" in resp.trace.decision_trace["missing_capabilities"]
    assert resp.trace.confidence.overall_confidence < 0.90
    assert resp.status in ["SUCCESS", "CONFIRMATION_REQUIRED"]


# ============================================================================
# 10. REQUIRED E2E TEST 6 — AGENT CONFLICT (CHEAP VS SAFE)
# ============================================================================

@pytest.mark.asyncio
async def test_e2e_scenario_6_agent_conflict():
    """
    TEST 6 — AGENT CONFLICT:
    Validate that changing strategy between CHEAPEST and HIGHEST_RELIABILITY shifts the multi-objective
    trade-off resolution appropriately.
    """
    brain = ElaUniversalBrain()

    # Strategy 1: CHEAPEST
    r_cheap = await brain.process_chat(AgentChatRequest(
        message="Main farmer hoon. 500 kg tomato Pune bhejna hai. Sabse sasta option chahiye.",
        session_id="sess-conflict-test-cheap",
        authenticated=True,
        authenticated_role="FARMER",
    ))
    assert r_cheap.trace.strategy == "CHEAPEST"

    # Strategy 2: HIGHEST_RELIABILITY
    r_safe = await brain.process_chat(AgentChatRequest(
        message="Main farmer hoon. 500 kg tomato Pune bhejna hai. Sabse surakshit gadi chahiye.",
        session_id="sess-conflict-test-safe",
        authenticated=True,
        authenticated_role="FARMER",
    ))
    assert r_safe.trace.strategy == "HIGHEST_RELIABILITY"
    assert "surakshit" in r_safe.confirmation_action["summary"].lower() or "highest_reliability" in r_safe.confirmation_action["summary"].lower() or "reliability" in r_safe.confirmation_action["summary"].lower() or "mini truck" in r_safe.confirmation_action["summary"].lower()
