# Phase 8.1 ELA Intelligence Accuracy Hardening Test Suite
# Validates strategy extraction, mathematical decision consistency, metric disambiguation, and multilingual alignment.

import pytest
import asyncio
from ai.ela.intent.strategy import StrategyExtractor
from ai.ela.core.decision_support import DecisionSupportEngine, DecisionSupportResult
from ai.ela.agent.loop import ElaAgentLoop, AgentChatRequest, AgentChatResponse
from ai.ela.agent.state import CanonicalEntities, GoalPlan
from ai.ela.core.intelligence_fusion import IntelligenceFusionEngine, StructuredIntelligenceDecision
from ai.ela.memory.session import ConversationMemory


# ============================================================================
# 1. STRATEGY EXTRACTION ACROSS 8 INDIC LANGUAGES + HINGLISH
# ============================================================================

def test_strategy_cheapest_multilingual():
    # Hindi
    assert StrategyExtractor.extract_strategy("मुझे सबसे सस्ता ट्रक चाहिए") == "CHEAPEST"
    assert StrategyExtractor.extract_strategy("कम खर्च में भेजना है") == "CHEAPEST"
    # Hinglish
    assert StrategyExtractor.extract_strategy("mujhe sabse sasta truck chahiye") == "CHEAPEST"
    assert StrategyExtractor.extract_strategy("sabse sasta option chahiye") == "CHEAPEST"
    assert StrategyExtractor.extract_strategy("kam paisa lage") == "CHEAPEST"
    # Marathi
    assert StrategyExtractor.extract_strategy("मला सर्वात स्वस्त ट्रक हवा आहे") == "CHEAPEST"
    assert StrategyExtractor.extract_strategy("कमी खर्चात पाठवा") == "CHEAPEST"
    # Tamil
    assert StrategyExtractor.extract_strategy("எனக்கு குறைந்த செலவு கொண்ட வாகனம் வேண்டும்") == "CHEAPEST"
    # Telugu
    assert StrategyExtractor.extract_strategy("నాకు తక్కువ ఖర్చు వాహనం కావాలి") == "CHEAPEST"
    # Bengali
    assert StrategyExtractor.extract_strategy("আমার সবচেয়ে সস্তা গাড়ি দরকার") == "CHEAPEST"
    # Kannada
    assert StrategyExtractor.extract_strategy("ನನಗೆ ಅಗ್ಗದ ವಾಹನ ಬೇಕು") == "CHEAPEST"
    # English
    assert StrategyExtractor.extract_strategy("I want the cheapest vehicle.") == "CHEAPEST"
    assert StrategyExtractor.extract_strategy("lowest cost transport") == "CHEAPEST"


def test_strategy_fastest_multilingual():
    # English
    assert StrategyExtractor.extract_strategy("Find the fastest vehicle option") == "FASTEST"
    assert StrategyExtractor.extract_strategy("deliver as soon as possible") == "FASTEST"
    # Hindi / Hinglish
    assert StrategyExtractor.extract_strategy("जल्दी पहुंचना चाहिए") == "FASTEST"
    assert StrategyExtractor.extract_strategy("jaldi bhejna hai urgent") == "FASTEST"
    # Marathi
    assert StrategyExtractor.extract_strategy("लवकर पोहोचणारी गाडी हवी") == "FASTEST"
    assert StrategyExtractor.extract_strategy("तात्काळ पाठवा") == "FASTEST"
    # Tamil
    assert StrategyExtractor.extract_strategy("விரைவாக கொண்டு செல்ல வேண்டும்") == "FASTEST"
    # Telugu
    assert StrategyExtractor.extract_strategy("త్వరగా చేరాలి") == "FASTEST"
    # Bengali
    assert StrategyExtractor.extract_strategy("তাড়াতাড়ি পৌঁছাতে হবে") == "FASTEST"
    # Kannada
    assert StrategyExtractor.extract_strategy("ಬೇಗ ತಲುಪಿಸಬೇಕು") == "FASTEST"


def test_strategy_highest_reliability_multilingual():
    # English
    assert StrategyExtractor.extract_strategy("Find the safest and most reliable transporter") == "HIGHEST_RELIABILITY"
    # Hindi / Hinglish
    assert StrategyExtractor.extract_strategy("सबसे सुरक्षित गाड़ी चाहिए") == "HIGHEST_RELIABILITY"
    assert StrategyExtractor.extract_strategy("bharosemand driver hona chahiye") == "HIGHEST_RELIABILITY"
    # Marathi
    assert StrategyExtractor.extract_strategy("सर्वात विश्वासू वाहतूकदार द्या") == "HIGHEST_RELIABILITY"
    # Tamil
    assert StrategyExtractor.extract_strategy("நம்பகமான ஓட்டுநர் வேண்டும்") == "HIGHEST_RELIABILITY"
    # Telugu
    assert StrategyExtractor.extract_strategy("నమ్మకమైన డ్రైవర్ కావాలి") == "HIGHEST_RELIABILITY"
    # Bengali
    assert StrategyExtractor.extract_strategy("সবচেয়ে নির্ভরযোগ্য পরিবহন চাই") == "HIGHEST_RELIABILITY"
    # Kannada
    assert StrategyExtractor.extract_strategy("ವಿಶ್ವಾಸಾರ್ಹ ಚಾಲಕ ಬೇಕು") == "HIGHEST_RELIABILITY"


def test_strategy_max_earnings_and_freshness():
    assert StrategyExtractor.extract_strategy("mujhe jyada kamai chahiye") == "MAX_EARNINGS"
    assert StrategyExtractor.extract_strategy("अधिक नफा मिळवून द्या") == "MAX_EARNINGS"
    assert StrategyExtractor.extract_strategy("Keep tomatoes fresh, perishable goods") == "FRESHNESS"
    assert StrategyExtractor.extract_strategy("खराब होने वाला माल है, ताजा रखना है") == "FRESHNESS"
    assert StrategyExtractor.extract_strategy("Standard transport booking") == "BALANCED"


# ============================================================================
# 2. MATHEMATICAL DECISION CONSISTENCY & SCORE NORMALIZATION
# ============================================================================

@pytest.mark.asyncio
async def test_mathematical_cheapest_selection():
    """Validates that CHEAPEST strategy mathematically selects the lowest freight cost option."""
    engine = DecisionSupportEngine()
    test_vehicles = [
        {"id": "v1-cheap", "type": "Mini Truck (750 kg)", "capacity": 750.0, "rating": 4.5, "reliability": 0.90},
        {"id": "v2-fast", "type": "Express Pickup (1.5 Ton)", "capacity": 1500.0, "rating": 4.7, "reliability": 0.93},
        {"id": "v3-heavy", "type": "Large Truck (10 Ton)", "capacity": 10000.0, "rating": 4.9, "reliability": 0.99},
    ]

    res = await engine.evaluate_transport_options(
        origin="Nashik",
        destination="Pune Mandi",
        commodity="Tomatoes",
        weight_kg=500.0,
        available_vehicles=test_vehicles,
        user_preference="CHEAPEST",
    )

    assert res.strategy_applied == "CHEAPEST"
    top = res.recommended_option
    assert top is not None
    # Mini Truck must be top because freight cost is lowest
    assert top.vehicle_type == "Mini Truck (750 kg)"
    # Top option has the highest utility score
    for opt in res.all_ranked_options[1:]:
        assert top.utility_score >= opt.utility_score
        assert top.estimated_cost <= opt.estimated_cost


@pytest.mark.asyncio
async def test_mathematical_fastest_selection():
    """Validates that FASTEST strategy mathematically selects the lowest transit ETA option."""
    engine = DecisionSupportEngine()
    test_vehicles = [
        {"id": "v1-slow", "type": "Slow Bullock Carrier", "capacity": 1000.0, "rating": 4.5, "reliability": 0.90},
        {"id": "v2-fast", "type": "Express Pickup (1.5 Ton)", "capacity": 1500.0, "rating": 4.7, "reliability": 0.93},
        {"id": "v3-heavy", "type": "Heavy Trailer (16 Ton)", "capacity": 16000.0, "rating": 4.8, "reliability": 0.95},
    ]

    res = await engine.evaluate_transport_options(
        origin="Nashik",
        destination="Pune Mandi",
        commodity="Tomatoes",
        weight_kg=500.0,
        available_vehicles=test_vehicles,
        user_preference="FASTEST",
    )

    assert res.strategy_applied == "FASTEST"
    top = res.recommended_option
    assert top is not None
    assert top.vehicle_type == "Express Pickup (1.5 Ton)"


@pytest.mark.asyncio
async def test_mathematical_reliability_selection():
    """Validates that HIGHEST_RELIABILITY strategy prioritizes top transporter reliability."""
    engine = DecisionSupportEngine()
    test_vehicles = [
        {"id": "v1-cheap-unreliable", "type": "Budget Van", "capacity": 800.0, "rating": 3.8, "reliability": 0.70},
        {"id": "v2-premium-safe", "type": "Verified Gold Truck", "capacity": 1500.0, "rating": 5.0, "reliability": 0.99},
    ]

    res = await engine.evaluate_transport_options(
        origin="Nashik",
        destination="Pune Mandi",
        commodity="Tomatoes",
        weight_kg=500.0,
        available_vehicles=test_vehicles,
        user_preference="HIGHEST_RELIABILITY",
    )

    assert res.strategy_applied == "HIGHEST_RELIABILITY"
    top = res.recommended_option
    assert top is not None
    assert top.vehicle_type == "Verified Gold Truck"
    assert top.delivery_success_probability == 0.99


# ============================================================================
# 3. CONFIDENCE VS UTILITY METRIC DISAMBIGUATION
# ============================================================================

@pytest.mark.asyncio
async def test_confidence_and_utility_metric_disambiguation():
    """Ensures overall decision confidence, delivery success probability, and utility score are semantically distinct."""
    fusion = IntelligenceFusionEngine()
    req = AgentChatRequest(
        message="Main farmer hoon. Mujhe 500 kilo tomato Nashik se Pune bhejna hai. Sabse sasta option chahiye.",
        session_id="sess-metric-disambig-01",
        authenticated=True,
        authenticated_role="FARMER",
        language="hi",
    )

    dec: StructuredIntelligenceDecision = await fusion.fuse_and_decide(req)
    
    # 1. Overall decision confidence (from confidence engine, e.g. 0.93)
    assert 0.0 <= dec.confidence <= 1.0
    assert dec.confidence >= 0.80

    # 2. Predicted delivery success probability (from ML model, e.g. 0.764)
    deliv_prob = dec.predictions.get("delivery_success_probability")
    assert deliv_prob is not None
    assert 0.0 <= deliv_prob <= 1.0

    # 3. Utility Score (multi-objective ranking utility, e.g. ~0.7-0.9)
    utility = dec.predictions.get("utility_score")
    assert utility is not None
    assert 0.0 <= utility <= 1.0


# ============================================================================
# 4. MULTI-TURN STRATEGY UPDATE & GOAL PRESERVATION
# ============================================================================

@pytest.mark.asyncio
async def test_multi_turn_strategy_update():
    """Ensures that changing priorities updates the active strategy without creating disconnected goals."""
    loop = ElaAgentLoop()
    session_id = "sess-strategy-update-01"

    # Turn 1: User sets initial CHEAPEST strategy
    r1 = await loop.run(AgentChatRequest(
        message="Main farmer hoon. Mujhe 500 kg tamatar Pune bhejna hai. Sabse sasta option chahiye.",
        session_id=session_id,
        authenticated=True,
        authenticated_role="FARMER",
    ))
    assert r1.trace.strategy == "CHEAPEST"
    assert "cheapest" in r1.confirmation_action["summary"].lower()

    # Turn 2: User explicitly changes priority to FASTEST
    r2 = await loop.run(AgentChatRequest(
        message="Nahi, jaldi pahunchna jyada zaroori hai. Fast option do.",
        session_id=session_id,
        authenticated=True,
        authenticated_role="FARMER",
    ))
    assert r2.trace.strategy == "FASTEST"
    assert "fastest" in r2.confirmation_action["summary"].lower()

    # Turn 3: Goal entities (Tomatoes, 500kg, Pune) are preserved
    sess = ConversationMemory.get_session(session_id)
    assert sess.accumulated_entities.product in ["Tomatoes", "tamatar", "tomatoes"] or sess.accumulated_entities.commodity is not None
    assert sess.accumulated_entities.quantity == 500.0
    assert sess.accumulated_entities.strategy == "FASTEST"


# ============================================================================
# 5. END-TO-END ACCURACY HARDENING SCENARIO
# ============================================================================

@pytest.mark.asyncio
async def test_phase8_1_e2e_cheapest_consistency():
    """
    Validates the primary Phase 8.1 issue:
    User prompt with 'Sabse sasta option chahiye' MUST output:
    - strategy = CHEAPEST
    - ranking driven primarily by cost
    - confirmation summary explicitly stating 'cheapest cost strategy'
    """
    loop = ElaAgentLoop()
    req = AgentChatRequest(
        message="Main farmer hoon. Mujhe 500 kilo tomato Nashik se Pune bhejna hai. Sabse sasta option chahiye.",
        session_id="sess-hardened-e2e-01",
        authenticated=True,
        authenticated_role="FARMER",
        language="hi",
    )

    resp: AgentChatResponse = await loop.run(req)
    assert resp.status == "CONFIRMATION_REQUIRED"
    assert resp.detected_role == "FARMER"
    assert resp.trace.strategy == "CHEAPEST"
    assert resp.trace.decision_trace is not None
    assert resp.trace.decision_trace["strategy"] == "CHEAPEST"
    assert resp.trace.decision_trace["weights"]["w_cost"] == 0.65

    # Verification of summary alignment
    summary = resp.confirmation_action["summary"]
    assert "cheapest" in summary.lower()
    assert "balanced" not in summary.lower()
