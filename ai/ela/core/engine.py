# ELA Core Intelligence Fusion Engine (Phase 5 Master Intelligence Orchestrator)
# Unified orchestration of LLM, Neural, Machine Learning, Agents, Knowledge, Decision, and Learning Engines.
import time
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

from ai.ela.agent.state import (
    ElaAgentState,
    AgentExecutionTrace,
    ConfidenceScore,
    StepObservation,
    UserRole,
    SupportedLanguage,
    ElaIntent,
    AgentOutcome,
)
from ai.ela.agent.loop import AgentChatRequest, AgentChatResponse
from ai.ela.intent.resolver import IntentResolver
from ai.ela.security.guard import SecurityGuard
from ai.ela.memory.session import ConversationMemory, UserMemory
from ai.ela.agent.confidence import ConfidenceEngine
from ai.ela.planner.goals import GoalManager
from ai.ela.planner.planner import AgentPlanner
from ai.ela.tools.registry import NodeToolBridge

# Fusion Intelligence Subsystems
from ai.ela.llm.provider import LLMProvider, MockLLMProvider, GeminiLLMProvider
from ai.ela.neural.provider import DistilledSemanticNeuralProvider, NeuralAnomalyResult
from ai.ela.knowledge.engine import KnowledgeEngine
from ai.ela.domain.agriroute import AgriRouteDomainAdapter
from ai.ela.core.router import IntelligenceRouter, RoutingDecision
from ai.ela.decision.engine import DecisionEngine, DecisionRecommendation
from ai.ela.agents.specialists import MarketAgent, LogisticsAgent, FleetAgent, LearningAgent
from ai.ela.ml.models.demand import DemandPredictionModel
from ai.ela.ml.models.price import PricePredictionModel
from ai.ela.ml.models.eta import ETAPredictionModel
from ai.ela.ml.models.transport import TransportCostModel
from ai.ela.ml.models.matching import VehicleMatchingModel
from ai.ela.learning.collector import FeedbackCollector
from ai.ela.learning.patterns import PatternMiner


class ElaIntelligenceEngine:
    """
    Central ELA Intelligence Fusion Orchestrator.
    Coordinates all cognitive, predictive, agentic, knowledge, and learning subsystems under ONE ELA.
    """
    def __init__(
        self,
        llm_provider: Optional[LLMProvider] = None,
        node_bridge: Optional[NodeToolBridge] = None,
    ):
        # 1. Foundation Providers & Adapters
        self.llm = llm_provider or MockLLMProvider()
        self.node_bridge = node_bridge or NodeToolBridge()
        self.domain_adapter = AgriRouteDomainAdapter()
        self.knowledge = KnowledgeEngine()
        self.neural = DistilledSemanticNeuralProvider()

        # 2. Machine Learning Subsystem
        self.demand_model = DemandPredictionModel()
        self.price_model = PricePredictionModel()
        self.eta_model = ETAPredictionModel()
        self.cost_model = TransportCostModel()
        self.matching_model = VehicleMatchingModel()

        # 3. Decision & Router Engines
        self.router = IntelligenceRouter()
        self.decision_engine = DecisionEngine()

        # 4. Specialized Internal Agents
        self.market_agent = MarketAgent(self.demand_model, self.price_model, self.knowledge)
        self.logistics_agent = LogisticsAgent(self.eta_model, self.cost_model, self.knowledge)
        self.fleet_agent = FleetAgent(self.matching_model, self.knowledge)
        self.learning_agent = LearningAgent()

        # 5. Core Intent & Security Resolvers
        self.intent_resolver = IntentResolver()
        self.security_guard = SecurityGuard()
        self.confidence_engine = ConfidenceEngine()
        self.planner = AgentPlanner()

    async def process_chat(self, request: AgentChatRequest) -> AgentChatResponse:
        start_time = time.time()
        trace_id = f"trace-{int(start_time * 1000)}"
        session_id = request.session_id or f"session-{int(start_time * 1000)}"
        raw_message = (request.message or "").strip()

        if not raw_message:
            return AgentChatResponse(
                message="Please provide a message or question.",
                intent="UNKNOWN",
                detected_role="GUEST",
                language="en",
                status="NEEDS_CLARIFICATION",
                timestamp=datetime.now().isoformat(),
            )

        # ---------------------------------------------------------
        # 1. ZERO-SECRET CREDENTIAL SHIELD & PROMPT INJECTION CHECK
        # ---------------------------------------------------------
        sec_check = self.security_guard.check_safety(raw_message, request.authenticated_role)
        if not sec_check.is_safe:
            denial_msg = "Sensitive credentials or unsafe prompt instructions detected. Input shielded."
            ConversationMemory.add_turn(session_id, 'user', raw_message)
            ConversationMemory.add_turn(session_id, 'assistant', denial_msg)
            return AgentChatResponse(
                message=denial_msg,
                intent="SECURITY_ALERT",
                detected_role=request.authenticated_role,
                language=request.language,
                status="SECURITY_DENIED",
                suggestions=["Manage Products", "Browse Produce", "Find Trips"],
                timestamp=datetime.now().isoformat(),
            )

        # ---------------------------------------------------------
        # 2. MULTILINGUAL NLU, INTENT RESOLUTION & ENTITY FUSION
        # ---------------------------------------------------------
        canonical = self.intent_resolver.resolve(raw_message, request.authenticated_role, request.language)
        lang = canonical.language

        # Role continuity
        effective_role = request.authenticated_role if request.authenticated else (canonical.target_role if canonical.target_role != 'GUEST' else 'GUEST')

        # Memory entity accumulation across turns
        accumulated_entities = ConversationMemory.update_entities(session_id, canonical.entities)
        ConversationMemory.set_last_intent(session_id, canonical.intent)

        # ---------------------------------------------------------
        # 3. INTELLIGENCE ROUTER: CAPABILITY SELECTION
        # ---------------------------------------------------------
        routing: RoutingDecision = self.router.route(canonical.intent, effective_role, accumulated_entities, raw_message)

        # ---------------------------------------------------------
        # 4. CONFIDENCE & MISSING ENTITY DERIVATION
        # ---------------------------------------------------------
        conf_result = self.confidence_engine.evaluate(
            canonical.intent, accumulated_entities, canonical.confidence, lang, effective_role
        )

        # Handle Missing Entity Clarification Loop
        if conf_result.needs_clarification and conf_result.missing_entities:
            clarification_msg = conf_result.clarification_question or self._build_clarification_message(conf_result.missing_entities, lang)
            ConversationMemory.add_turn(session_id, 'user', raw_message)
            ConversationMemory.add_turn(session_id, 'assistant', clarification_msg)
            return AgentChatResponse(
                message=clarification_msg,
                intent=canonical.intent,
                detected_role=effective_role,
                language=lang,
                status="NEEDS_CLARIFICATION",
                suggestions=self._get_clarification_suggestions(conf_result.missing_entities, lang),
                timestamp=datetime.now().isoformat(),
            )

        # ---------------------------------------------------------
        # 5. GOAL FORMULATION & PLANNING
        # ---------------------------------------------------------
        goal = GoalManager.decompose_goal(canonical.intent, accumulated_entities, effective_role, raw_message)
        ConversationMemory.set_active_goal(session_id, goal)
        plan = AgentPlanner.plan(canonical, effective_role)

        # ---------------------------------------------------------
        # 6. DECISION ENGINE & PREDICTIVE ML SYNTHESIS
        # ---------------------------------------------------------
        ml_prediction: Optional[Dict[str, Any]] = None
        decision_rec: Optional[DecisionRecommendation] = None
        confirmation_action: Optional[Dict[str, Any]] = None

        if canonical.intent in ['CREATE_LOGISTICS_WORKFLOW', 'MOVE_PRODUCE']:
            # Extract user optimization strategy
            norm_msg = raw_message.lower()
            strategy = "CHEAPEST" if ("cheap" in norm_msg or "सस्ता" in norm_msg or "कमी खर्च" in norm_msg) else (
                "FASTEST" if ("fast" in norm_msg or "जल्दी" in norm_msg or "तात्काळ" in norm_msg or "urgent" in norm_msg) else (
                    "FRESHNESS" if ("fresh" in norm_msg or "ताज़ा" in norm_msg or "ताजे" in norm_msg) else "BALANCED"
                )
            )

            decision_rec = await self.decision_engine.decide_logistics_plan(
                origin=accumulated_entities.pickup_location or "Nashik",
                destination=accumulated_entities.destination or "Pune APMC Mandi",
                commodity=accumulated_entities.product or "Tomatoes",
                weight_kg=float(accumulated_entities.quantity or 500.0),
                available_vehicles=[],
                strategy=strategy,
            )

            if decision_rec and decision_rec.target_entity:
                tgt = decision_rec.target_entity
                confirmation_action = {
                    "toolName": "create_logistics_request",
                    "summary": decision_rec.explanation_summary,
                    "params": {
                        "pickupLocation": tgt["origin"],
                        "destination": tgt["destination"],
                        "productName": tgt["commodity"],
                        "quantity": tgt["weight_kg"],
                        "vehicleType": tgt["vehicle_type"],
                        "estimatedFreight": tgt["estimated_freight"],
                        "estimatedDuration": tgt["estimated_duration"],
                    },
                }
                ml_prediction = {
                    "decision": decision_rec.model_dump(),
                    "confidence": decision_rec.confidence,
                    "model_version": "ElaDecisionEngine-v5.0",
                    "model_status": "trained",
                    "explanation": decision_rec.explanation_summary,
                }

        elif canonical.intent in ['GET_MARKET_DEMAND', 'GET_PRICE_FORECAST']:
            market_res = await self.market_agent.analyze_market(
                commodity=accumulated_entities.product or "Tomatoes",
                grade=accumulated_entities.grade or "A",
            )
            ml_prediction = {
                "specialist": market_res.specialist_name,
                "data": market_res.data,
                "summary": market_res.summary,
                "confidence": market_res.confidence,
            }

        # ---------------------------------------------------------
        # 7. TOOL EXECUTION / CONFIRMATION STAGING
        # ---------------------------------------------------------
        action_result = None
        status_outcome: AgentOutcome = 'SUCCESS'
        navigation_action = None

        if confirmation_action:
            status_outcome = 'CONFIRMATION_REQUIRED'
        elif plan.steps and plan.steps[0].is_consequential:
            step = plan.steps[0]
            confirmation_action = {
                "toolName": step.tool_name,
                "summary": f"Staged action: {step.tool_name}",
                "params": step.arguments,
            }
            status_outcome = 'CONFIRMATION_REQUIRED'
        elif plan.steps and not plan.steps[0].is_consequential:
            # Execute read tool via Node Bridge
            step = plan.steps[0]
            action_result = await self.node_bridge.execute_tool_on_node(
                step.tool_name, step.arguments, request.user_id, request.authenticated_role, request.auth_token
            )

        # Login Routing
        if canonical.intent == 'LOGIN_REDIRECT':
            target_path = '/auth/buyer' if effective_role == 'BUYER' else ('/auth/transporter' if effective_role == 'TRANSPORTER' else '/auth/farmer')
            navigation_action = {"action": "NAVIGATE", "path": target_path}

        # ---------------------------------------------------------
        # 8. RESPONSE SYNTHESIS & OBSERVABILITY TRACE
        # ---------------------------------------------------------
        total_latency = round((time.time() - start_time) * 1000, 2)
        trace = AgentExecutionTrace(
            trace_id=trace_id,
            session_id=session_id,
            user_id=request.user_id,
            authenticated_role=request.authenticated_role,
            conversational_role=effective_role,
            language=lang,
            input_message=raw_message,
            intent=canonical.intent,
            confidence=conf_result.confidence,
            planner_steps=[{"step": s.step_number, "tool": s.tool_name, "args": s.arguments} for s in plan.steps],
            selected_tools=[s.tool_name for s in plan.steps],
            tool_results=[],
            model_provider="ElaIntelligenceEngine-v5.0",
            model_version="fusion-core-v5",
            total_latency_ms=total_latency,
            final_outcome=status_outcome,
        )

        user_msg = self._build_execution_message(
            canonical.intent, lang, accumulated_entities, confirmation_action, action_result, decision_rec
        )

        ConversationMemory.add_turn(session_id, 'user', raw_message)
        ConversationMemory.add_turn(session_id, 'assistant', user_msg)

        return AgentChatResponse(
            message=user_msg,
            intent=canonical.intent,
            detected_role=effective_role,
            language=lang,
            status=status_outcome,
            action_result=action_result,
            navigation_action=navigation_action,
            confirmation_action=confirmation_action,
            ml_prediction=ml_prediction,
            suggestions=self._get_default_suggestions(effective_role, lang),
            trace=trace,
            timestamp=datetime.now().isoformat(),
        )

    def _build_clarification_message(self, missing_fields: List[str], lang: SupportedLanguage) -> str:
        primary = missing_fields[0] if missing_fields else "destination"
        if primary == "destination":
            msgs = {
                "en": "Please specify the destination mandi or city where you want to send the produce.",
                "hi": "कृपया गंतव्य मंडी या शहर का नाम बताएं जहाँ आप माल भेजना चाहते हैं।",
                "mr": "कृपया गंतव्य बाजारपेठ किंवा शहराचे नाव सांगा जिथे तुम्हाला शेतमाल पाठवायचा आहे.",
                "ta": "விளைபொருளை அனுப்ப விரும்பும் இலக்கு சந்தை அல்லது நகரத்தைக் குறிப்பிடவும்.",
                "te": "దయచేసి మీరు ఉత్పత్తులను పంపాలనుకుంటున్న గమ్యస్థాన మార్కెట్ లేదా నగరాన్ని పేర్కొనండి.",
                "bn": "অনুগ্রহ করে গন্তব্য মান্ডি বা শহরের নাম উল্লেখ করুন যেখানে আপনি পণ্য পাঠাতে চান।",
                "kn": "ದಯವಿಟ್ಟು ನೀವು ಉತ್ಪನ್ನವನ್ನು ಕಳುಹಿಸಲು ಬಯಸುವ ಗಮ್ಯಸ್ಥಾನ ಮಾರುಕಟ್ಟೆ ಅಥವಾ ನಗರವನ್ನು ನಿರ್ದಿಷ್ಟಪಡಿಸಿ.",
            }
            return msgs.get(lang, msgs["en"])
        elif primary == "pickup_location":
            msgs = {
                "en": "Please specify your pickup farm gate location or village.",
                "hi": "कृपया पिकअप स्थान या गाँव का नाम बताएं।",
                "mr": "कृपया माल उचलण्याचे ठिकाण किंवा गावाचे नाव सांगा.",
                "ta": "பிக்அப் இருப்பிடம் அல்லது கிராமத்தின் பெயரைக் குறிப்பிடவும்.",
                "te": "దయచేసి పికప్ లొకేషన్ లేదా గ్రామం పేరును పేర్కొనండి.",
                "bn": "অনুগ্রহ করে পিকআপের স্থান বা গ্রামের নাম উল্লেখ করুন।",
                "kn": "ದಯವಿಟ್ಟು ಪಿಕಪ್ ಸ್ಥಳ ಅಥವಾ ಹಳ್ಳಿಯ ಹೆಸರನ್ನು ನಿರ್ದಿಷ್ಟಪಡಿಸಿ.",
            }
            return msgs.get(lang, msgs["en"])
        return "Please provide the missing details to proceed."

    def _get_clarification_suggestions(self, missing_fields: List[str], lang: SupportedLanguage) -> List[str]:
        primary = missing_fields[0] if missing_fields else "destination"
        if primary == "destination":
            return ["Pune APMC Mandi", "Mumbai Vashi Mandi", "Nashik Market", "Nagpur APMC"]
        elif primary == "pickup_location":
            return ["Farm Gate Nashik", "Pimpalgaon Village", "Baramati Farm", "Dindori"]
        return ["Confirm Details", "Cancel"]

    def _build_execution_message(
        self,
        intent: ElaIntent,
        lang: SupportedLanguage,
        entities: Any,
        conf_action: Any,
        action_res: Any,
        decision_rec: Optional[DecisionRecommendation] = None,
    ) -> str:
        if decision_rec:
            return decision_rec.explanation_summary + " Please confirm to stage this booking."

        if conf_action:
            tool = conf_action.get("toolName")
            if tool == 'create_product':
                return f"I have prepared to add **{entities.product or 'Produce'}** ({int(entities.quantity or 500)} kg) to your inventory. Please confirm."
            elif tool == 'create_logistics_request':
                return f"I have prepared your transport request for **{entities.product or 'Produce'}** to **{entities.destination or 'Mandi'}**. Please review and confirm."
            elif tool == 'create_procurement':
                return f"I have prepared your procurement order for **{entities.product or 'Produce'}** ({int(entities.quantity or 500)} kg). Please confirm."
            elif tool == 'create_vehicle':
                return f"I have prepared to add **{entities.vehicle_type or 'Vehicle'}** to your fleet. Please confirm."

        if intent == 'GET_FARMER_PRODUCTS':
            return "Here are your listed crops and inventory products."
        elif intent == 'GET_FARMER_DELIVERIES':
            return "Here are your active deliveries and shipment tracking updates."
        elif intent == 'GET_BUYER_PRODUCE':
            return "Here is the fresh produce catalog available from local farmers."
        elif intent == 'GET_BUYER_ORDERS':
            return "Here are your previous buyer purchase orders."
        elif intent == 'GET_AVAILABLE_TRIPS':
            return "Here are nearby available transport loads."
        elif intent == 'GET_VEHICLES':
            return "Here is your registered fleet of vehicles."
        elif intent == 'GET_EARNINGS':
            return "Here is your total payout and revenue settlement summary."
        elif intent == 'GET_MARKET_DEMAND':
            return "Here is the current APMC mandi market demand and price forecast."
        elif intent == 'EXPLAIN_PLATFORM':
            return "AgriRoute connects rural farmers directly with mandi buyers and verified transport using ELA AI intelligence."

        return "I have processed your request."

    def _get_default_suggestions(self, role: UserRole, lang: SupportedLanguage) -> List[str]:
        if role == 'FARMER':
            return ["Add 500 kg Tomatoes", "Check Market Demand", "Request Transport to Pune", "My Deliveries"]
        elif role == 'BUYER':
            return ["Browse Produce", "Post Procurement Demand", "My Orders", "Price Forecast"]
        elif role == 'TRANSPORTER':
            return ["Find Available Loads", "My Vehicles", "My Earnings", "Active Trips"]
        return ["I am a Farmer", "I am a Buyer", "I am a Transporter", "How AgriRoute Works"]
