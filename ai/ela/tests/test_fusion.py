# Master ELA Intelligence Fusion Integration Tests (Phase 5 Python Core)
import pytest
from ai.ela.core.engine import ElaIntelligenceEngine
from ai.ela.agent.loop import AgentChatRequest
from ai.ela.neural.provider import DistilledSemanticNeuralProvider
from ai.ela.knowledge.engine import KnowledgeEngine
from ai.ela.domain.agriroute import AgriRouteDomainAdapter
from ai.ela.decision.engine import DecisionEngine
from ai.ela.learning.collector import FeedbackCollector
from ai.ela.learning.evaluator import GovernedModelEvaluator
from ai.ela.learning.patterns import PatternMiner


@pytest.mark.asyncio
async def test_neural_embedding_and_similarity():
    provider = DistilledSemanticNeuralProvider()
    vec1 = provider.embed_text("500 kg tomatoes from Nashik to Pune")
    vec2 = provider.embed_text("Nashik to Pune tomato logistics transport")
    vec3 = provider.embed_text("Doctor appointment in Mumbai hospital")

    sim_domain = provider.compute_similarity(vec1, vec2)
    sim_cross = provider.compute_similarity(vec1, vec3)

    assert len(vec1) == 64
    assert sim_domain > sim_cross  # Domain semantic proximity

    # Anomaly detection test
    anom_res = provider.detect_operational_anomaly(
        predicted_value=180.0,
        actual_value=360.0,
        feature_vector={"origin": "Nashik", "destination": "Pune"},
    )
    assert anom_res.is_anomaly
    assert anom_res.anomaly_score > 0.70


@pytest.mark.asyncio
async def test_knowledge_engine_domain_facts():
    ke = KnowledgeEngine()
    tomato_fact = ke.get_commodity_info("Tomatoes")
    assert tomato_fact is not None
    assert tomato_fact.perishability == "HIGH"
    assert tomato_fact.optimal_transit_hours == 12

    pune_mandi = ke.get_mandi_info("Pune Mandi")
    assert pune_mandi is not None
    assert "Tomatoes" in pune_mandi.primary_commodities

    is_urgent, note = ke.check_perishability_urgency("Tomatoes", 9.0)
    assert is_urgent  # 9h approaches 12h limit


@pytest.mark.asyncio
async def test_domain_adapter_contract():
    adapter = AgriRouteDomainAdapter()
    assert adapter.context.domain_id == "agriroute-micro-logistics"
    assert "FARMER" in adapter.context.supported_roles
    assert "MOVE_PRODUCE" in adapter.context.supported_intents

    is_valid, warnings = adapter.validate_entities({"quantity": 500.0, "commodity": "Tomatoes"})
    assert is_valid
    assert len(warnings) == 0


@pytest.mark.asyncio
async def test_decision_engine_synthesis():
    engine = DecisionEngine()
    rec = await engine.decide_logistics_plan(
        origin="Nashik",
        destination="Pune APMC Mandi",
        commodity="Tomatoes",
        weight_kg=500.0,
        available_vehicles=[],
        strategy="CHEAPEST",
    )
    assert rec.decision_type == "RECOMMEND_LOGISTICS_BOOKING"
    assert rec.requires_confirmation
    assert len(rec.decision_factors) >= 3
    assert rec.confidence >= 0.85
    assert "Mini Truck" in rec.target_entity["vehicle_type"]


@pytest.mark.asyncio
async def test_critical_end_to_end_fusion_flow():
    """
    Critical End-to-End Master Test:
    User Prompt: 'Main farmer hoon. Mere paas 500 kilo tamatar hain aur mujhe Nashik se Pune bhejna hai. Sabse sasta aur reliable option chahiye.'
    Verifies NLU -> Goal -> Multi-Model ML -> Knowledge -> Decision Engine -> Confirmation Card -> Telemetry.
    """
    engine = ElaIntelligenceEngine()

    req = AgentChatRequest(
        message="Main farmer hoon. Mere paas 500 kilo tamatar hain aur mujhe Nashik se Pune bhejna hai. Sabse sasta aur reliable option chahiye.",
        session_id="session-master-fusion-1",
        authenticated=True,
        authenticated_role="FARMER",
        user_id="farmer-usr-101",
    )

    response = await engine.process_chat(req)

    # 1. Verification of Language & Role Detection
    assert response.language in ["hi", "hinglish", "en"]
    assert response.detected_role == "FARMER"
    assert response.intent in ["MOVE_PRODUCE", "CREATE_LOGISTICS_WORKFLOW"]

    # 2. Verification of Staged Confirmation & Decision Support
    assert response.confirmation_action is not None
    assert response.confirmation_action["toolName"] == "request_transport"
    params = response.confirmation_action["params"]
    assert params["pickupLocation"] == "Nashik"
    assert params["destination"] == "Pune APMC Mandi" or "Pune" in params["destination"]
    assert params["quantity"] == 500.0
    assert "Mini Truck" in params["vehicleType"]
    assert params["estimatedFreight"] > 2000

    # 3. Verification of Multi-Engine Output
    assert response.ml_prediction is not None
    assert response.trace is not None
    assert response.trace.model_provider == "ElaIntelligenceEngine-v5.0"
    assert len(response.suggestions) > 0

    # 4. Verification of Real Outcome Observation & Learning Loop
    learning_res = engine.learning_agent.record_trip_outcome(
        session_id="session-master-fusion-1",
        predicted_eta_mins=135.0,
        actual_eta_mins=225.0,
        predicted_cost=2780.0,
        actual_cost=3100.0,
        route="Nashik-Pune",
    )
    assert learning_res.status == "SUCCESS"
    assert learning_res.data["error_delta"] == 90.0
