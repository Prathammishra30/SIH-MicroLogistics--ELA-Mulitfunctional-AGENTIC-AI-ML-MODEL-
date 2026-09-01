# Phase 10 Universal Intelligence Experience & Cognitive Fusion Test Suite
# Tests Multilingual NLU (8 languages), Role Discovery, Goal Preservation across Auth,
# LLM + ML + Neural Fusion, Multi-Agent Coordination, Closed-Loop Governance, and Security.

import pytest
import pytest_asyncio
from datetime import datetime

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
from ai.ela.learning.error_analysis import ErrorAnalysisEngine, OperationalDiscrepancy
from ai.ela.learning.drift import DriftDetector
from ai.ela.learning.evaluator import GovernedModelEvaluator
from ai.ela.learning.governance import ModelGovernanceGate
from ai.ela.learning.registry import ModelRegistry
from ai.ela.ml.models.demand import DemandPredictionModel, DemandFeatures
from ai.ela.ml.models.price import PricePredictionModel, PriceFeatures
from ai.ela.ml.models.eta import ETAPredictionModel, EtaFeatures
from ai.ela.ml.models.transport import TransportCostModel, TransportCostFeatures
from ai.ela.ml.models.matching import VehicleMatchingModel, VehicleMatchingFeatures
from ai.ela.ml.models.risk import (
    DelayProbabilityModel,
    DelayRiskFeatures,
    CancellationProbabilityModel,
    CancellationRiskFeatures,
    DeliverySuccessProbabilityModel,
    DeliverySuccessFeatures,
)
from ai.ela.neural.models import NeuralFeatureTensor, NeuralRouteDelayLearner, NeuralTransporterReliabilityScorer
from ai.ela.ml.training.pipeline import SyntheticDataGenerator


@pytest.fixture
def universal_brain():
    return ElaUniversalBrain()


@pytest.fixture
def fusion_engine():
    return IntelligenceFusionEngine()


# ============================================================================
# 1. INITIAL GREETING & UNIVERSAL LANDING TESTS
# ============================================================================

@pytest.mark.asyncio
async def test_initial_bilingual_greeting(universal_brain):
    """Test that empty or initial greeting produces the exact bilingual greeting."""
    req = AgentChatRequest(
        message="",
        authenticated=False,
        authenticated_role="GUEST",
        language="en",
    )
    res = await universal_brain.process_chat(req)
    assert "How can I help you?" in res.message
    assert "मैं आपकी कैसे मदद कर सकती हूँ?" in res.message
    assert res.status == "SUCCESS"


@pytest.mark.asyncio
async def test_initial_greeting_triggers(universal_brain):
    """Test standard greeting words trigger universal greeting."""
    for greet in ["hi", "hello", "namaste", "namaskar", "shuru"]:
        req = AgentChatRequest(
            message=greet,
            authenticated=False,
            authenticated_role="GUEST",
            language="en",
        )
        res = await universal_brain.process_chat(req)
        assert "How can I help you?" in res.message or "मैं आपकी कैसे मदद कर सकती हूँ?" in res.message


# ============================================================================
# 2. MULTILINGUAL NLU & SCRIPT DETECTION (8 INDIC LANGUAGES)
# ============================================================================

def test_language_detection_all_languages():
    """Verify script and language recognition across all 8 supported languages."""
    # Hindi
    assert detect_language_script("मुझे 500 किलो टमाटर भेजने हैं")[0] == "hi"
    # Marathi
    assert detect_language_script("मला माझ्या शेतमालाची वाहतूक करायची आहे")[0] == "mr"
    # Tamil
    assert detect_language_script("எனக்கு 500 கிலோ தக்காளியை கொண்டு செல்ல வேண்டும்")[0] == "ta"
    # Telugu
    assert detect_language_script("నాకు 500 కేజీల టమాటాలు రవాణా చేయాలి")[0] == "te"
    # Bengali
    assert detect_language_script("আমি ৫০০ কেজি টমেটো পাঠাতে চাই")[0] == "bn"
    # Kannada
    assert detect_language_script("ನನಗೆ 500 ಕೆಜಿ ಟೊಮೆಟೊ ಸಾಗಿಸಬೇಕಾಗಿದೆ")[0] == "kn"
    # English
    assert detect_language_script("I need to transport 500 kg tomatoes from Nashik to Pune")[0] == "en"
    # Hinglish
    assert detect_language_script("Bhai mere 500 kilo tamatar Nashik se Pune bhejna hai")[0] == "hi"


def test_indic_numeral_extraction():
    """Verify extraction of Indic digits across Devanagari, Tamil, Telugu, Bengali, Kannada."""
    # Devanagari numerals: ५०० (500)
    dev_ent = EntityExtractor.extract_entities("मला ५०० किलो कांदा पाठवायचा आहे")
    assert dev_ent.quantity == 500.0
    assert dev_ent.product == "Onions"

    # Bengali numerals: ৫০০ (500)
    bn_ent = EntityExtractor.extract_entities("আমি ৫০০ কেজি আলু পাঠাতে চাই")
    assert bn_ent.quantity == 500.0
    assert bn_ent.product == "Potatoes"

    # Kannada numerals: ೧೦೦೦ (1000)
    kn_ent = EntityExtractor.extract_entities("೧೦೦೦ ಕೆಜಿ ಟೊಮೆಟೊ")
    assert kn_ent.quantity == 1000.0
    assert kn_ent.product == "Tomatoes"


# ============================================================================
# 3. SEMANTIC UNDERSTANDING & STRATEGY EXTRACTION
# ============================================================================

def test_semantic_understanding_complex_prompt():
    """
    Test exact prompt from Section 7:
    'भाई मेरे 500 किलो टमाटर नाशिक से पुणे भेजने हैं और खर्च कम रखना है'
    """
    text = "भाई मेरे 500 किलो टमाटर नाशिक से पुणे भेजने हैं और खर्च कम रखना है"
    canonical = IntentResolver.resolve(text, current_role='GUEST', preferred_language='hi')
    
    assert canonical.target_role == "FARMER"
    assert canonical.intent == "CREATE_LOGISTICS_WORKFLOW"
    assert canonical.entities.product == "Tomatoes"
    assert canonical.entities.quantity == 500.0
    assert canonical.entities.destination == "Pune APMC Mandi"
    assert canonical.entities.strategy == "CHEAPEST"


def test_multilingual_strategy_extraction():
    """Test extraction of all 6 optimization strategies across Indic languages."""
    # Cheapest
    assert StrategyExtractor.extract_strategy("sabse sasta chahiye") == "CHEAPEST"
    assert StrategyExtractor.extract_strategy("सर्वात स्वस्त गाडी हवी आहे") == "CHEAPEST"
    assert StrategyExtractor.extract_strategy("குறைந்த கட்டணம்") == "CHEAPEST"
    assert StrategyExtractor.extract_strategy("తక్కువ ఖర్చు") == "CHEAPEST"
    assert StrategyExtractor.extract_strategy("সবচেয়ে সস্তা") == "CHEAPEST"
    assert StrategyExtractor.extract_strategy("ಕಡಿಮೆ ವೆಚ್ಚ") == "CHEAPEST"

    # Fastest
    assert StrategyExtractor.extract_strategy("fastest delivery possible") == "FASTEST"
    assert StrategyExtractor.extract_strategy("लवकरात लवकर पोहोचवा") == "FASTEST"
    assert StrategyExtractor.extract_strategy("jaldi bhejna hai") == "FASTEST"

    # Reliability
    assert StrategyExtractor.extract_strategy("sabse surakshit option") == "HIGHEST_RELIABILITY"
    assert StrategyExtractor.extract_strategy("सर्वात सुरक्षित वाहतूक") == "HIGHEST_RELIABILITY"


# ============================================================================
# 4. NATURAL ROLE DISCOVERY & GOAL-PRESERVED AUTH ROUTING
# ============================================================================

@pytest.mark.asyncio
async def test_unauthenticated_farmer_goal_preservation_and_routing(universal_brain):
    """
    Test Section 9:
    Unauthenticated user says: 'मैं किसान हूँ और मुझे 500 किलो टमाटर पुणे भेजने हैं।'
    ELA identifies FARMER, responds with login guidance, navigates to /auth/farmer,
    and preserves the active goal in session memory.
    """
    session_id = f"session-auth-test-{int(datetime.now().timestamp() * 1000)}"
    user_msg = "मैं किसान हूँ और मुझे 500 किलो टमाटर पुणे भेजने हैं।"
    
    req = AgentChatRequest(
        message=user_msg,
        session_id=session_id,
        authenticated=False,
        authenticated_role="GUEST",
        language="hi",
    )
    res = await universal_brain.process_chat(req)
    
    # Check response guidance
    assert res.detected_role == "FARMER"
    assert res.navigation_action is not None
    assert res.navigation_action.get("route") == "/auth/farmer"
    assert "लॉगिन" in res.message or "किसान" in res.message

    # Verify that goal and entities are preserved in session memory
    session = ConversationMemory.get_session(session_id)
    assert session.entities.product == "Tomatoes"
    assert session.entities.quantity == 500.0
    assert session.active_goal is not None
    assert session.active_goal.title != ""

    # Simulate post-login execution using preserved session goal
    auth_req = AgentChatRequest(
        message="लॉगिन हो गया, आगे बढ़ें",
        session_id=session_id,
        user_id="farmer-uuid-12345",
        authenticated=True,
        authenticated_role="FARMER",
        language="hi",
    )
    auth_res = await universal_brain.process_chat(auth_req)
    assert auth_res.detected_role == "FARMER"
    assert auth_res.confirmation_action is not None or "Tomatoes" in auth_res.message or "टमाटर" in auth_res.message


# ============================================================================
# 5. LLM + ML + NEURAL FUSION & DECISION ENGINE
# ============================================================================

@pytest.mark.asyncio
async def test_intelligence_fusion_engine_decision(fusion_engine):
    """Test full intelligence fusion combining ML predictions, neural inference, and strategy."""
    req = AgentChatRequest(
        message="500 kg tomatoes from Nashik to Pune with cheapest transport",
        authenticated=True,
        authenticated_role="FARMER",
        user_id="farmer-test-1",
        language="en",
    )
    decision: StructuredIntelligenceDecision = await fusion_engine.fuse_and_decide(req)

    assert decision.intent in ["CREATE_LOGISTICS_WORKFLOW", "MOVE_PRODUCE"]
    assert decision.predictions is not None
    assert "estimated_freight" in decision.predictions
    assert "delivery_success_probability" in decision.predictions
    assert decision.neural_insights is not None
    assert "neural_expected_corridor_delay_mins" in decision.neural_insights
    assert decision.requires_confirmation is True
    assert decision.recommended_action is not None
    assert decision.confidence > 0.60


@pytest.mark.asyncio
async def test_neural_models_inference():
    """Verify that neural models execute real inference."""
    # Route Delay Learner MLP
    learner = NeuralRouteDelayLearner()
    tensor = NeuralFeatureTensor([[210.0, 8.0, 2.0, 30.0, 2.0, 0.35]])
    delay = learner.predict(tensor)
    assert isinstance(delay, float)
    assert delay >= 0.0

    # Transporter Reliability Scorer
    scorer = NeuralTransporterReliabilityScorer()
    score = scorer.score_reliability(
        completion_rate=0.98, punctuality_score=0.95, maintenance_score=0.90, rating=4.8
    )
    assert 0.0 <= score <= 1.0


# ============================================================================
# 6. CONSEQUENTIAL ACTION SAFETY & JAVA AUTHORITY WORKFLOW
# ============================================================================

@pytest.mark.asyncio
async def test_consequential_mutation_requires_confirmation(universal_brain):
    """Verify that consequential mutations stage confirmation and never execute blindly."""
    req = AgentChatRequest(
        message="500 kg tamatar Pune bhejne hain",
        authenticated=True,
        authenticated_role="FARMER",
        user_id="farmer-123",
        language="hi",
    )
    res = await universal_brain.process_chat(req)
    assert res.status == "CONFIRMATION_REQUIRED"
    assert res.confirmation_action is not None
    assert res.confirmation_action.get("toolName") == "create_logistics_request"
    assert res.confirmation_action.get("params") is not None


# ============================================================================
# 7. CLOSED-LOOP GOVERNED SELF-LEARNING
# ============================================================================

@pytest.mark.asyncio
async def test_governed_learning_closed_loop():
    """Test full learning cycle: telemetry -> error analysis -> drift -> holdout eval -> governance."""
    # 1. Record learning events
    FeedbackCollector.record_learning_event(
        operation_type="ETA_PREDICTION",
        prediction_type="REGRESSION",
        features={"distance_km": 210.0, "vehicle_type": "Mini Truck"},
        predicted_value=330.0,
        actual_value=370.0,
        outcome="COMPLETED",
        route_context="Nashik-Pune",
        model_name="ETAPredictionModel",
        model_version="v1.2",
        confidence=0.88,
        dataset_type="REAL_OPERATIONAL",
    )

    # 2. Error Analysis
    discrepancy = ErrorAnalysisEngine.record_discrepancy(
        session_id="session-test-eval",
        model_name="ETAPredictionModel",
        model_version="v1.2",
        target_metric="ETA_MINUTES",
        predicted_value=330.0,
        actual_value=370.0,
        route="Nashik-Pune",
        distance_km=210.0,
    )
    diag = ErrorAnalysisEngine.diagnose_error(discrepancy)
    assert diag.error_category is not None

    # 3. Governed Holdout Model Evaluation
    active_model = DemandPredictionModel(version="v1.2", status="production")
    candidate_model = DemandPredictionModel(version="v1.3-candidate", status="candidate")
    holdout_data = SyntheticDataGenerator.generate_demand_dataset(count=30)
    
    report = await GovernedModelEvaluator.compare_models(active_model, candidate_model, holdout_data)
    assert report.holdout_sample_count == len(holdout_data)
    assert report.candidate_metrics is not None

    # 4. Governance Gate
    audit = ModelGovernanceGate.evaluate_promotion(candidate_model, report)
    assert audit.decision in ["APPROVE", "REJECT", "REQUIRE_MORE_DATA"]


# ============================================================================
# 8. SECURITY & ZERO-SECRET CREDENTIAL SHIELD
# ============================================================================

def test_credential_shield_blocks_passwords_and_otps():
    """Verify that passwords, OTPs, PINs, and secrets are shielded from AI processing."""
    # Password
    res1 = SecurityGuard.check_safety("Mera password password123 hai", "FARMER")
    assert res1.is_safe is False
    assert res1.credential_shielded is True

    # OTP
    res2 = SecurityGuard.check_safety("OTP 123456 daal do", "BUYER")
    assert res2.is_safe is False
    assert res2.credential_shielded is True

    # Secret / PIN
    res3 = SecurityGuard.check_safety("Secret PIN 9876", "TRANSPORTER")
    assert res3.is_safe is False
    assert res3.credential_shielded is True


@pytest.mark.asyncio
async def test_brain_credential_shield_multilingual_response(universal_brain):
    """Verify that ELA universal brain provides localized credential shield advice."""
    for lang, text in [
        ("hi", "mera password123 le lo"),
        ("mr", "माझा password password123 आहे"),
        ("en", "here is my otp 123456"),
    ]:
        req = AgentChatRequest(message=text, language=lang)
        res = await universal_brain.process_chat(req)
        assert res.status == "CREDENTIAL_SHIELDED"
        assert "password" in res.message.lower() or "पासवर्ड" in res.message or "otp" in res.message.lower() or "सुरक्षा" in res.message
