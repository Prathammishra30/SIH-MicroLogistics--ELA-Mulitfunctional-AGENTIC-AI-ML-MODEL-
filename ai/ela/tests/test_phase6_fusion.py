# Phase 6 Universal Intelligence Fusion Unit Tests
import pytest
from ai.ela.core.intelligence_fusion import IntelligenceFusionEngine, StructuredIntelligenceDecision
from ai.ela.agent.loop import AgentChatRequest
from ai.ela.providers.llm import CanonicalRuleLLMProvider, ProductionLLMAdapter


@pytest.mark.asyncio
async def test_intelligence_fusion_structured_decision():
    fusion = IntelligenceFusionEngine(llm_provider=CanonicalRuleLLMProvider())
    req = AgentChatRequest(
        message="Main farmer hoon. Mere paas 500 kilo tamatar hain aur mujhe Nashik se Pune bhejna hai. Sabse sasta option chahiye.",
        session_id="test-session-fusion-1",
        language="hi",
        authenticated=True,
        authenticated_role="FARMER",
        user_id="usr-farmer-101",
    )

    decision: StructuredIntelligenceDecision = await fusion.fuse_and_decide(req)
    
    assert decision.intent == "CREATE_LOGISTICS_WORKFLOW"
    assert decision.role == "FARMER"
    assert decision.language == "hi"
    assert decision.confidence >= 0.85
    assert decision.requires_confirmation is True
    assert decision.recommended_action is not None
    assert decision.recommended_action["toolName"] == "create_logistics_request"
    assert decision.recommended_action["params"]["productName"] == "Tomatoes"
    assert decision.recommended_action["params"]["pickupLocation"] == "Nashik"
    assert decision.recommended_action["params"]["destination"] == "Pune APMC Mandi"
    assert decision.predictions["estimated_freight"] > 0
    assert "delivery_success" in decision.predictions
    assert decision.neural_insights["semantic_embedding_dimension"] == 64
    assert len(decision.options) >= 1


@pytest.mark.asyncio
async def test_intelligence_fusion_strategy_tradeoffs():
    fusion = IntelligenceFusionEngine()
    
    # 1. Cheapest strategy
    req_cheap = AgentChatRequest(
        message="I need the cheapest transport for 1000 kg onions from Nashik to Pune.",
        session_id="test-strat-cheap",
        language="en",
        authenticated=True,
        authenticated_role="FARMER",
    )
    res_cheap = await fusion.fuse_and_decide(req_cheap)
    assert "cheapest" in res_cheap.reasoning_summary.lower()

    # 2. Fastest strategy
    req_fast = AgentChatRequest(
        message="I need fastest urgent transport for 1000 kg tomatoes from Nashik to Pune.",
        session_id="test-strat-fast",
        language="en",
        authenticated=True,
        authenticated_role="FARMER",
    )
    res_fast = await fusion.fuse_and_decide(req_fast)
    assert "fastest" in res_fast.reasoning_summary.lower() or "freshness" in res_fast.reasoning_summary.lower()


@pytest.mark.asyncio
async def test_intelligence_fusion_security_shield():
    fusion = IntelligenceFusionEngine()
    req = AgentChatRequest(
        message="Here is my secret password123 and token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        session_id="test-sec-1",
        language="en",
        authenticated=False,
    )
    decision = await fusion.fuse_and_decide(req)
    assert decision.intent == "SECURITY_ALERT"
    assert "shielded" in decision.reasoning_summary.lower()
