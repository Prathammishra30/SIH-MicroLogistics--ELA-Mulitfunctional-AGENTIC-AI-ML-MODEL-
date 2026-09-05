# ELA Voice-First Task Dispatch & Unified Action Registry Tests (Part 7)
import pytest
from ai.ela.agent.state import UserRole, SupportedLanguage
from ai.ela.intent.resolver import IntentResolver
from ai.ela.tools.registry import ToolRegistry, NodeToolBridge
from ai.ela.orchestration.dispatcher import TaskDispatcher, DispatchResult, STT_CONFIDENCE_THRESHOLD
from ai.ela.agent.loop import ElaAgentLoop, AgentChatRequest
from ai.ela.agent.brain import ElaUniversalBrain


class MockNodeBridge(NodeToolBridge):
    def __init__(self):
        super().__init__()
        self.call_count = 0
        self.last_tool = None
        self.last_params = None

    async def execute_tool_on_node(self, tool_name, arguments, user_id, user_role, auth_token=None):
        self.call_count += 1
        self.last_tool = tool_name
        self.last_params = arguments
        return {
            "success": True,
            "mocked": True,
            "toolName": tool_name,
            "data": {"result": f"Executed {tool_name}"},
        }


@pytest.fixture
def mock_bridge():
    return MockNodeBridge()


@pytest.fixture
def dispatcher(mock_bridge):
    return TaskDispatcher(node_bridge=mock_bridge)


# =====================================================================
# TEST 1: Intent match -> correct tool + extracted params (3 languages)
# =====================================================================
@pytest.mark.asyncio
async def test_intent_match_multilingual(dispatcher):
    test_cases = [
        # English: available trips
        {
            "text": "Show available trips from Nashik to Pune",
            "lang": "en",
            "role": "TRANSPORTER",
            "expected_intent": "GET_AVAILABLE_TRIPS",
            "expected_tool": "get_available_trips",
            "expected_action_type": "REVERSIBLE",
        },
        # Hindi: available trips
        {
            "text": "उपलब्ध फेऱ्या दिखाओ",
            "lang": "hi",
            "role": "TRANSPORTER",
            "expected_intent": "GET_AVAILABLE_TRIPS",
            "expected_tool": "get_available_trips",
            "expected_action_type": "REVERSIBLE",
        },
        # Marathi: available trips
        {
            "text": "उपलब्ध फेऱ्या दाखवा",
            "lang": "mr",
            "role": "TRANSPORTER",
            "expected_intent": "GET_AVAILABLE_TRIPS",
            "expected_tool": "get_available_trips",
            "expected_action_type": "REVERSIBLE",
        },
        # English: find matches
        {
            "text": "Find matches for tomatoes",
            "lang": "en",
            "role": "FARMER",
            "expected_intent": "GENERATE_MATCHES",
            "expected_tool": "generate_matches",
            "expected_action_type": "REVERSIBLE",
        },
        # Hindi: farmer products
        {
            "text": "मेरी फसल दिखाओ",
            "lang": "hi",
            "role": "FARMER",
            "expected_intent": "GET_FARMER_PRODUCTS",
            "expected_tool": "get_farmer_products",
            "expected_action_type": "REVERSIBLE",
        },
        # Marathi: farmer products
        {
            "text": "माझी उत्पादने दाखवा",
            "lang": "mr",
            "role": "FARMER",
            "expected_intent": "GET_FARMER_PRODUCTS",
            "expected_tool": "get_farmer_products",
            "expected_action_type": "REVERSIBLE",
        },
    ]

    for tc in test_cases:
        canonical = IntentResolver.resolve(tc["text"], tc["role"], tc["lang"])
        assert canonical.intent == tc["expected_intent"], f"Failed on '{tc['text']}': expected {tc['expected_intent']}, got {canonical.intent}"
        assert canonical.target_tool == tc["expected_tool"], f"Failed tool on '{tc['text']}': expected {tc['expected_tool']}, got {canonical.target_tool}"
        assert canonical.target_action_type == tc["expected_action_type"], f"Failed action type on '{tc['text']}'"

        # Dispatch
        result = await dispatcher.dispatch(
            text=tc["text"],
            role=tc["role"],
            preferred_language=tc["lang"],
            stt_confidence=0.92,
            is_voice=True,
        )
        assert result.tool_name == tc["expected_tool"]
        assert result.action_type == tc["expected_action_type"]


# =====================================================================
# TEST 2: Consequential confirms before execute; reversible executes immediately
# =====================================================================
@pytest.mark.asyncio
async def test_consequential_vs_reversible_dispatch(dispatcher, mock_bridge):
    # 1. Reversible: generate_matches -> executes immediately
    rev_res = await dispatcher.dispatch(
        text="Find matches for tomato",
        role="FARMER",
        preferred_language="en",
        stt_confidence=0.95,
        is_voice=True,
    )
    assert rev_res.branch == 1
    assert rev_res.action_type == "REVERSIBLE"
    assert rev_res.executed is True
    assert rev_res.requires_confirmation is False
    assert rev_res.confirmation_payload is None
    assert mock_bridge.call_count == 1

    # 2. Consequential: create_proposal with complete parameters -> stages confirmation (does not execute)
    conseq_res = await dispatcher.dispatch(
        text="Create proposal for farmer f-101 buyer b-202 transporter t-303",
        role="ADMIN",
        preferred_language="en",
        stt_confidence=0.95,
        is_voice=True,
    )
    assert conseq_res.branch == 2
    assert conseq_res.action_type == "CONSEQUENTIAL"
    assert conseq_res.executed is False
    assert conseq_res.requires_confirmation is True
    assert conseq_res.confirmation_payload is not None
    assert conseq_res.confirmation_payload["toolName"] == "create_proposal"
    # Tool must NOT have executed yet
    assert mock_bridge.call_count == 1

    # 3. User says affirmative: "yes" / "haan" / "confirm" -> executes the consequential action
    confirm_res = await dispatcher.dispatch(
        text="Yes, proceed",
        role="ADMIN",
        preferred_language="en",
        stt_confidence=0.95,
        is_voice=True,
        pending_action=conseq_res.confirmation_payload,
    )
    assert confirm_res.executed is True
    assert confirm_res.action_type == "CONSEQUENTIAL"
    assert mock_bridge.call_count == 2
    assert mock_bridge.last_tool == "create_proposal"


# =====================================================================
# TEST 3: Missing-parameter slot filling (asks for exact missing param)
# =====================================================================
@pytest.mark.asyncio
async def test_missing_parameter_slot_filling(dispatcher):
    # Farmer wants to list produce but didn't state quantity or price: "Add tomato produce"
    # Required for create_product: name, quantity, price
    res_en = await dispatcher.dispatch(
        text="Add tomato inventory",
        role="FARMER",
        preferred_language="en",
        stt_confidence=0.90,
        is_voice=True,
    )
    assert res_en.branch == 3
    assert res_en.missing_parameter in ["quantity", "price"]
    assert res_en.executed is False
    assert "quantity" in res_en.message.lower() or "price" in res_en.message.lower() or "kilogram" in res_en.message.lower()

    # Hindi slot-filling: "टमाटर जोड़ें" (missing quantity and price)
    res_hi = await dispatcher.dispatch(
        text="टमाटर जोड़ें",
        role="FARMER",
        preferred_language="hi",
        stt_confidence=0.90,
        is_voice=True,
    )
    assert res_hi.branch == 3
    assert res_hi.missing_parameter in ["quantity", "price"]
    # Question must be in Hindi
    assert any(w in res_hi.message for w in ["मात्रा", "किलोग्राम", "भाव", "मूल्य"])


# =====================================================================
# TEST 4: No-match utterance returns labeled suggestion, NO tool execution
# =====================================================================
@pytest.mark.asyncio
async def test_out_of_registry_labeled_suggestion(dispatcher, mock_bridge):
    initial_calls = mock_bridge.call_count

    # Utterance outside registry actions: "What is the weather on Mars tomorrow?"
    res = await dispatcher.dispatch(
        text="What is the weather on Mars tomorrow?",
        role="GUEST",
        preferred_language="en",
        stt_confidence=0.95,
        is_voice=True,
    )

    assert res.branch == 4
    assert res.is_suggestion is True
    assert res.executed is False
    assert res.tool_name is None
    assert res.message.startswith("Suggestion: ")
    # Tool execution count must remain 0
    assert mock_bridge.call_count == initial_calls


# =====================================================================
# TEST 5: Code-switched utterance test (Hinglish / Marathglish)
# =====================================================================
@pytest.mark.asyncio
async def test_code_switched_utterance(dispatcher):
    # Hinglish: "Mere paas 500 kg tamatar hai truck book kar do"
    hinglish_text = "Mere paas 500 kg tamatar hai truck book kar do"
    assert IntentResolver.is_code_switched(hinglish_text) is True

    canonical = IntentResolver.resolve(hinglish_text, "FARMER", "en")
    assert canonical.is_code_switched is True
    assert canonical.intent == "CREATE_LOGISTICS_WORKFLOW"
    assert canonical.target_tool == "create_logistics_request"

    # Marathglish: "Pune sathi truck book करा"
    marathglish_text = "Pune sathi truck book करा"
    assert IntentResolver.is_code_switched(marathglish_text) is True

    canonical_mr = IntentResolver.resolve(marathglish_text, "FARMER", "mr")
    assert canonical_mr.is_code_switched is True


# =====================================================================
# TEST 6: Low-confidence STT test (< 0.65 threshold asks to repeat, no execution)
# =====================================================================
@pytest.mark.asyncio
async def test_low_confidence_stt_protection(dispatcher, mock_bridge):
    initial_calls = mock_bridge.call_count

    # Voice request with low STT confidence (0.52 < 0.65)
    low_conf = 0.52
    assert low_conf < STT_CONFIDENCE_THRESHOLD

    # In English
    res_en = await dispatcher.dispatch(
        text="Send 500 kg tomato to Mumbai",
        role="FARMER",
        preferred_language="en",
        stt_confidence=low_conf,
        is_voice=True,
    )
    assert res_en.branch == 5
    assert res_en.executed is False
    assert res_en.requires_confirmation is False
    assert res_en.status == "NEEDS_CLARIFICATION"
    assert "hear that clearly" in res_en.message or "repeat" in res_en.message
    assert mock_bridge.call_count == initial_calls

    # In Hindi
    res_hi = await dispatcher.dispatch(
        text="500 किलो टमाटर मुंबई भेजो",
        role="FARMER",
        preferred_language="hi",
        stt_confidence=low_conf,
        is_voice=True,
    )
    assert res_hi.branch == 5
    assert res_hi.executed is False
    assert "सुनाई नहीं दिया" in res_hi.message or "दोबारा" in res_hi.message
    assert mock_bridge.call_count == initial_calls

    # In Marathi
    res_mr = await dispatcher.dispatch(
        text="५०० किलो टोमॅटो मुंबईला पाठवा",
        role="FARMER",
        preferred_language="mr",
        stt_confidence=low_conf,
        is_voice=True,
    )
    assert res_mr.branch == 5
    assert res_mr.executed is False
    assert "ऐकू आले नाही" in res_mr.message or "पुन्हा" in res_mr.message
    assert mock_bridge.call_count == initial_calls


# =====================================================================
# E2E BRAIN INTEGRATION TEST: Full brain chat request with voice params
# =====================================================================
@pytest.mark.asyncio
async def test_universal_brain_voice_dispatch():
    brain = ElaUniversalBrain()

    # Low confidence voice request -> returns repeat prompt
    low_req = AgentChatRequest(
        message="Send 500 kg tomato to Mumbai",
        authenticated=True,
        authenticated_role="FARMER",
        language="hi",
        is_voice=True,
        audio_confidence=0.50,
    )
    resp = await brain.process_chat(low_req)
    assert resp.status == "NEEDS_CLARIFICATION"
    assert "सुनाई नहीं दिया" in resp.message or "दोबारा" in resp.message

    # Reversible voice request -> executes
    rev_req = AgentChatRequest(
        message="Show available trips",
        authenticated=True,
        authenticated_role="TRANSPORTER",
        language="en",
        is_voice=True,
        audio_confidence=0.95,
    )
    rev_resp = await brain.process_chat(rev_req)
    assert rev_resp.status == "SUCCESS"
    assert "trip" in rev_resp.message.lower() or "available" in rev_resp.message.lower()
