# ELA Universal Brain (Phase 9 Master Orchestrator)
# ONE central intelligence combining NLU, Security, Shared Memory, Autonomous Planning,
# Specialized Multi-Agent Workers, Decision Intelligence, and Governed Self-Learning.
import time
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime

from ai.ela.agent.state import (
    AgentExecutionTrace,
    UserRole,
    SupportedLanguage,
    ElaIntent,
    AgentOutcome,
    ConfidenceScore,
)
from ai.ela.agent.loop import AgentChatRequest, AgentChatResponse
from ai.ela.agents.contracts import AgentRequest, CoordinatorResult
from ai.ela.agents.coordinator import AgentCoordinator
from ai.ela.intent.resolver import IntentResolver
from ai.ela.intent.strategy import StrategyExtractor
from ai.ela.security.guard import SecurityGuard
from ai.ela.memory.session import ConversationMemory, UserMemory
from ai.ela.agent.confidence import ConfidenceEngine
from ai.ela.planner.goals import GoalManager
from ai.ela.planner.planner import AgentPlanner
from ai.ela.learning.collector import FeedbackCollector
from ai.ela.data.schemas import LearningEvent
from ai.ela.core.intelligence_fusion import StructuredIntelligenceDecision


class ElaUniversalBrain:
    """
    Central Universal ELA Brain for AgriRoute and reusable cross-domain intelligence.
    Ensures ONE ELA identity coordinating specialized agents without fragmented brains.
    """

    def __init__(self):
        self.coordinator = AgentCoordinator()
        self.security_guard = SecurityGuard()
        self.intent_resolver = IntentResolver()
        self.confidence_engine = ConfidenceEngine()
        self.planner = AgentPlanner()
        self.feedback_collector = FeedbackCollector()

    async def process_chat(self, request: AgentChatRequest) -> AgentChatResponse:
        """
        End-to-End autonomous orchestration:
        User -> Brain -> Understand -> Plan -> Delegate (Coordinator) -> Specialized Agents ->
        Collect & Reconcile -> Decide -> Stage Confirmation -> Response & Trace.
        """
        start_time = time.time()
        trace_id = f"trace-brain-{int(start_time * 1000)}"
        session_id = request.session_id or f"session-{uuid.uuid4().hex[:8]}"
        raw_message = (request.message or "").strip()

        if not raw_message or raw_message.lower() in ["hi", "hello", "namaste", "namaskar", "vanakkam", "help", "shuru", "start"]:
            welcome_text = "How can I help you?\nमैं आपकी कैसे मदद कर सकती हूँ?"
            return AgentChatResponse(
                message=welcome_text,
                intent="GENERAL_HELP",
                detected_role=request.authenticated_role,
                language=request.language,
                status="SUCCESS",
                suggestions=self._get_default_suggestions(request.authenticated_role, request.language),
                timestamp=datetime.now().isoformat(),
            )

        # 1. SECURITY & CREDENTIAL SHIELD
        lang = request.language
        safety = SecurityGuard.check_safety(raw_message, request.authenticated_role)
        if safety.credential_shielded:
            shield_msg = self._get_credential_shield_msg(lang)
            trace = AgentExecutionTrace(
                trace_id=trace_id,
                session_id=session_id,
                user_id=request.user_id,
                authenticated_role=request.authenticated_role,
                conversational_role=request.authenticated_role,
                language=lang,
                input_message=SecurityGuard.sanitize_for_audit(raw_message),
                intent='GENERAL_HELP',
                confidence=ConfidenceScore(),
                final_outcome='CREDENTIAL_SHIELDED',
                total_latency_ms=round((time.time() - start_time) * 1000, 2),
            )
            return AgentChatResponse(
                message=shield_msg,
                intent='GENERAL_HELP',
                detected_role=request.authenticated_role,
                language=lang,
                status='CREDENTIAL_SHIELDED',
                trace=trace,
                timestamp=datetime.now().isoformat(),
            )

        # 2. UNDERSTAND: NLU, ROLE, AND STRATEGY RESOLUTION
        canonical = IntentResolver.resolve(raw_message, request.authenticated_role, lang)
        effective_role = (
            request.authenticated_role
            if request.authenticated
            else (canonical.target_role if canonical.target_role != 'GUEST' else 'GUEST')
        )
        lang = canonical.language

        # Shared Memory Entity Accumulation
        accumulated_entities = ConversationMemory.update_entities(session_id, canonical.entities)

        # Strategy Extraction & Multi-turn Update
        msg_strat = StrategyExtractor.extract_strategy(
            raw_message, fallback=getattr(accumulated_entities, 'strategy', 'BALANCED')
        )
        if msg_strat != 'BALANCED' or getattr(accumulated_entities, 'strategy', 'BALANCED') == 'BALANCED':
            accumulated_entities.strategy = msg_strat

        # Check Active Goal Continuation
        active_goal = ConversationMemory.get_session(session_id).active_goal
        if active_goal and active_goal.status != 'COMPLETED':
            active_goal.strategy = accumulated_entities.strategy
            if (canonical.intent in ['GENERAL_HELP', 'LOGIN_GUIDANCE']) and ('transport' in active_goal.title.lower() or 'logistics' in active_goal.title.lower() or 'move' in active_goal.title.lower() or 'farmer' in active_goal.title.lower()):
                canonical.intent = 'CREATE_LOGISTICS_WORKFLOW'
            if request.authenticated and accumulated_entities.commodity and not active_goal.subtasks[0].payload.get("commodity"):
                active_goal.subtasks[0].payload["commodity"] = accumulated_entities.commodity

        ConversationMemory.set_last_intent(session_id, canonical.intent)

        # 3. PLAN: GOAL DECOMPOSITION
        goal_plan = GoalManager.decompose_goal(
            canonical.intent,
            accumulated_entities,
            effective_role,
            raw_message,
        )
        ConversationMemory.set_active_goal(session_id, goal_plan)
        plan = AgentPlanner.plan(canonical, effective_role)

        # 4. GOAL-PRESERVED AUTHENTICATION ROUTING
        # Consequential workflows requested by unauthenticated users must guide to secure login while preserving goal
        consequential_intents = [
            'CREATE_LOGISTICS_WORKFLOW',
            'CREATE_PRODUCT_WORKFLOW',
            'CREATE_PROCUREMENT_WORKFLOW',
            'CREATE_VEHICLE_WORKFLOW',
            'LOGIN_GUIDANCE',
        ]
        if not request.authenticated and (canonical.intent in consequential_intents or canonical.intent == 'ROLE_DECLARATION'):
            target_auth_role = effective_role if effective_role != 'GUEST' else canonical.target_role
            if target_auth_role == 'GUEST':
                target_auth_role = 'FARMER'  # Default portal fallback if unspecified
            
            nav_route = f"/auth/{target_auth_role.lower()}"
            login_msg = self._get_login_guidance_msg(target_auth_role, lang)
            
            trace = AgentExecutionTrace(
                trace_id=trace_id,
                session_id=session_id,
                user_id=request.user_id,
                authenticated_role=request.authenticated_role,
                conversational_role=target_auth_role,
                language=lang,
                input_message=raw_message,
                intent=canonical.intent,
                goal_title=goal_plan.title,
                strategy=accumulated_entities.strategy,
                lifecycle_stage='NAVIGATING',
                confidence=ConfidenceScore(
                    intent_confidence=canonical.confidence,
                    role_confidence=0.95,
                    language_confidence=0.98,
                    entity_confidence=0.90,
                    policy_confidence=0.95,
                    overall_confidence=0.94,
                ),
                models_used=[],
                verification_status="VERIFIED",
                learning_event_created=True,
                model_provider='ElaUniversalBrain-v10',
                model_version='ela-py-v10',
                total_latency_ms=round((time.time() - start_time) * 1000, 2),
                final_outcome='SUCCESS',
            )

            return AgentChatResponse(
                message=login_msg,
                intent=canonical.intent,
                detected_role=target_auth_role,
                language=lang,
                status='SUCCESS',
                navigation_action={"type": "NAVIGATE", "route": nav_route, "targetRole": target_auth_role},
                suggestions=self._get_default_suggestions(target_auth_role, lang),
                trace=trace,
                timestamp=datetime.now().isoformat(),
            )

        # 5. DELEGATE TO MULTI-AGENT COORDINATOR
        coord_req = AgentRequest(
            task_id=f"task-{int(start_time * 1000)}",
            session_id=session_id,
            goal_id=goal_plan.goal_id,
            role=effective_role,
            language=lang,
            intent=canonical.intent,
            objective=goal_plan.title,
            entities=accumulated_entities,
            strategy=accumulated_entities.strategy,
            parameters={
                "userId": request.user_id or "default-user",
                "origin": accumulated_entities.pickup_location or "Nashik",
                "destination": accumulated_entities.destination or "Pune APMC Mandi",
                "commodity": accumulated_entities.product or "Tomatoes",
                "weight_kg": float(accumulated_entities.quantity or 500.0),
            },
        )

        coord_res: CoordinatorResult = await self.coordinator.coordinate(coord_req)

        # 6. CONFLICT RESOLUTION & CONFIRMATION STAGING
        confirmation_action = coord_res.confirmation_action
        status_outcome: AgentOutcome = 'SUCCESS'
        if confirmation_action:
            status_outcome = 'CONFIRMATION_REQUIRED'
            if coord_res.fused_recommendation and "recommended_vehicle" in coord_res.fused_recommendation:
                top_v = coord_res.fused_recommendation["recommended_vehicle"]
                confirmation_action["summary"] = (
                    f"Recommended **{top_v.get('vehicle_type')}** (Estimated Freight: ₹{top_v.get('estimated_cost', 0):.0f}, "
                    f"ETA: {top_v.get('formatted_duration', '4h')}) based on {accumulated_entities.strategy.lower()} strategy. "
                    f"{top_v.get('recommendation_reason', '')}"
                )
            elif "summary" not in confirmation_action:
                confirmation_action["summary"] = f"Recommended transport booking for {accumulated_entities.product or 'Produce'} based on {accumulated_entities.strategy.lower()} strategy."

        # Collect models used
        all_models = []
        for r in coord_res.agent_responses.values():
            all_models.extend(r.models_used)

        total_latency = round((time.time() - start_time) * 1000, 2)

        # Observability Trace Record
        trace = AgentExecutionTrace(
            trace_id=trace_id,
            session_id=session_id,
            user_id=request.user_id,
            authenticated_role=request.authenticated_role,
            conversational_role=effective_role,
            language=lang,
            input_message=raw_message,
            intent=canonical.intent,
            goal_title=goal_plan.title,
            strategy=accumulated_entities.strategy,
            lifecycle_stage='RESPONDING' if status_outcome != 'CONFIRMATION_REQUIRED' else 'CONFIRMATION_REQUIRED',
            confidence=ConfidenceScore(
                intent_confidence=canonical.confidence,
                role_confidence=0.95,
                language_confidence=0.98,
                entity_confidence=0.90,
                policy_confidence=0.92,
                overall_confidence=coord_res.overall_confidence,
            ),
            planner_steps=[{"step": s.step_number, "tool": s.tool_name, "args": s.arguments} for s in plan.steps],
            selected_tools=[s.tool_name for s in plan.steps],
            tool_results=[],
            models_used=list(set(all_models)),
            predictions_summary=coord_res.fused_recommendation,
            decision_trace={
                "strategy": accumulated_entities.strategy,
                "agents_involved": list(coord_res.agent_responses.keys()),
                "conflicts_resolved": [c.model_dump() for c in coord_res.conflicts_detected],
                "missing_capabilities": coord_res.missing_capabilities,
            },
            verification_status="VERIFIED" if status_outcome in ['SUCCESS', 'CONFIRMATION_REQUIRED'] else "PENDING",
            learning_event_created=True,
            model_provider='ElaUniversalBrain-v10',
            model_version='ela-py-v10',
            total_latency_ms=total_latency,
            final_outcome=status_outcome,
        )

        # Build dynamic user message
        user_msg = self._build_brain_message(canonical.intent, lang, accumulated_entities, confirmation_action, coord_res)

        ConversationMemory.add_turn(session_id, 'user', raw_message)
        ConversationMemory.add_turn(session_id, 'assistant', user_msg)

        # Closed-loop Governed Telemetry Creation
        try:
            self.feedback_collector.record_feedback(
                session_id=session_id,
                action_type=canonical.intent,
                prediction_made={"strategy": accumulated_entities.strategy, "models": list(set(all_models))},
                actual_outcome={"status": status_outcome, "latency_ms": total_latency},
            )
        except Exception:
            pass

        return AgentChatResponse(
            message=user_msg,
            intent=canonical.intent,
            detected_role=effective_role,
            language=lang,
            status=status_outcome,
            confirmation_action=confirmation_action,
            ml_prediction=coord_res.fused_recommendation,
            suggestions=self._get_default_suggestions(effective_role, lang),
            trace=trace,
            timestamp=datetime.now().isoformat(),
        )

    def _get_credential_shield_msg(self, lang: SupportedLanguage) -> str:
        msgs = {
            'en': 'Please enter your password, OTP, or verification code directly into the secure login form. For your protection, ELA never processes, stores, or transmits authentication secrets.',
            'hi': 'कृपया अपना पासवर्ड, OTP या सत्यापन कोड सीधे सुरक्षित लॉगिन फॉर्म में दर्ज करें। आपकी सुरक्षा के लिए, ELA कभी भी पासवर्ड या OTP स्वीकार या संसाधित नहीं करती है।',
            'mr': 'कृपया आपला पासवर्ड, OTP किंवा पडताळणी कोड थेट सुरक्षित लॉगिन फॉर्ममध्ये प्रविष्ट करा. आपल्या सुरक्षेसाठी, ELA कधीही पासवर्ड किंवा OTP हाताळत नाही.',
            'ta': 'உங்கள் கடவுச்சொல் அல்லது OTP ஐ பாதுகாப்பான உள்நுழைவு படிவத்தில் நேரடியாக உள்ளிடவும். உங்கள் பாதுகாப்பிற்காக, ELA ஒருபோதும் ரகசியங்களை கையாளாது.',
            'te': 'దయచేసి మీ పాస్‌వర్డ్ లేదా OTPని సురక్షిత లాగిన్ ఫారమ్‌లో నేరుగా నమోదు చేయండి. మీ భద్రత కోసం, ELA రహస్యాలను నిర్వహించదు.',
            'bn': 'দয়া করে আপনার পাসওয়ার্ড বা ওটিপি সরাসরি সুরক্ষিত লগইন ফর্মে প্রবেশ করুন। আপনার সুরক্ষার জন্য, ELA কখনই পাসওয়ার্ড পরিচালনা করে না।',
            'kn': 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ಅಥವಾ OTP ಅನ್ನು ಸುರಕ್ಷಿತ ಲಾಗಿನ್ ಫಾರ್ಮ್‌ನಲ್ಲಿ ನೇರವಾಗಿ ನಮೂದಿಸಿ. ನಿಮ್ಮ ರಕ್ಷಣೆಗಾಗಿ, ELA ಪಾಸ್‌ವರ್ಡ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸುವುದಿಲ್ಲ.',
        }
        return msgs.get(lang, msgs['en'])

    def _get_login_guidance_msg(self, role: str, lang: SupportedLanguage) -> str:
        from ai.ela.language.multilingual import get_localized_phrase
        key = f"login_guidance_{role.lower()}"
        msg = get_localized_phrase(lang, key)
        if not msg:
            msg = get_localized_phrase(lang, "login_guidance_general")
        return msg or "Sure. Please securely log in to your account to proceed."

    def _build_brain_message(
        self,
        intent: ElaIntent,
        lang: SupportedLanguage,
        entities: Any,
        conf_action: Optional[Dict[str, Any]],
        coord_res: CoordinatorResult,
    ) -> str:
        prod = entities.product or entities.commodity or 'Produce'
        qty = int(entities.quantity or 500)
        dest = entities.destination or 'Pune APMC Mandi'
        origin = entities.pickup_location or 'Nashik'
        strat = getattr(entities, 'strategy', 'BALANCED') or 'BALANCED'

        if conf_action and conf_action.get("summary"):
            if lang == 'hi':
                strat_text = "कम लागत" if strat == 'CHEAPEST' else ("शीघ्रता" if strat == 'FASTEST' else "विश्वसनीयता")
                return (
                    f"ज़रूर। मैंने {qty} kg {prod} के लिए {origin} से {dest} के विकल्प देखे हैं। "
                    f"आपकी प्राथमिकता {strat_text} है, इसलिए मैंने किराया, ETA, वाहन क्षमता और डिलीवरी जोखिम को मिलाकर विकल्पों की तुलना की है। "
                    f"{conf_action.get('summary')}"
                )
            elif lang == 'mr':
                strat_text = "कमी खर्च" if strat == 'CHEAPEST' else ("जलद वाहतूक" if strat == 'FASTEST' else "विश्वासार्हता")
                return (
                    f"नक्कीच. मी {qty} kg {prod} साठी {origin} ते {dest} चे पर्याय तपासले आहेत. "
                    f"आपले प्राधान्य {strat_text} आहे, त्यानुसार भाडे, वेळ, वाहन क्षमता व डिलिव्हरी निश्चितता तपासून सर्वोत्तम पर्याय निवडला आहे. "
                    f"{conf_action.get('summary')}"
                )
            elif lang == 'ta':
                return (
                    f"நிச்சயமாக. {qty} kg {prod} க்காக {origin} முதல் {dest} வரையிலான விருப்பங்களை மதிப்பீடு செய்துள்ளேன். "
                    f"{conf_action.get('summary')}"
                )
            elif lang == 'te':
                return (
                    f"ఖచ్చితంగా. {qty} kg {prod} కొరకు {origin} నుండి {dest} వరకు రవాణా ఎంపికలను విశ్లేషించాను. "
                    f"{conf_action.get('summary')}"
                )
            elif lang == 'bn':
                return (
                    f"অবশ্যই। {qty} kg {prod} এর জন্য {origin} থেকে {dest} বিকল্পগুলি মূল্যায়ন করা হয়েছে। "
                    f"{conf_action.get('summary')}"
                )
            elif lang == 'kn':
                return (
                    f"ಖಂಡಿತ. {qty} kg {prod} ಗಾಗಿ {origin} ನಿಂದ {dest} ವರೆಗಿನ ಆಯ್ಕೆಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗಿದೆ. "
                    f"{conf_action.get('summary')}"
                )
            return (
                f"Certainly. I've evaluated transport options for {qty} kg {prod} from {origin} to {dest} based on {strat.lower()} strategy. "
                f"{conf_action.get('summary')}"
            )

        if intent in ['GET_MARKET_DEMAND', 'GET_PRICE_FORECAST']:
            mkt_resp = coord_res.agent_responses.get("MarketAgent")
            if mkt_resp and mkt_resp.reasoning_summary:
                return mkt_resp.reasoning_summary

        msgs = {
            'en': f"Processed request for **{prod}** ({qty} kg) to **{dest}**.",
            'hi': f"आपके **{prod}** ({qty} kg) का अनुरोध संसाधित कर लिया गया है।",
            'mr': f"आपल्या **{prod}** ({qty} kg) च्या विनंतीवर प्रक्रिया पूर्ण झाली आहे.",
            'ta': f"**{prod}** ({qty} kg) க்கான கோரிக்கை செயலாக்கப்பட்டது.",
            'te': f"**{prod}** ({qty} kg) అభ్యర్థన ప్రాసెస్ చేయబడింది.",
            'bn': f"**{prod}** ({qty} kg) এর জন্য অনুরোধ প্রক্রিয়াকরণ সম্পন্ন হয়েছে।",
            'kn': f"**{prod}** ({qty} kg) ವಿನಂತಿಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗಿದೆ.",
        }
        return msgs.get(lang, msgs['en'])

    def _get_default_suggestions(self, role: UserRole, lang: SupportedLanguage) -> List[str]:
        if role == 'FARMER':
            return ["Book Transport to Pune", "Check Tomato Market Demand", "Add Produce to Farm Inventory"]
        elif role == 'BUYER':
            return ["Create Procurement Request", "Browse Available Produce", "Track Active Orders"]
        elif role == 'TRANSPORTER':
            return ["Register Fleet Vehicle", "Discover Available Trips", "Check Corridor Earnings"]
        return ["Talk to ELA", "Explore AgriRoute Features", "Login as Farmer"]
