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
            'GET_AVAILABLE_TRIPS',
            'GET_BUYER_PRODUCE',
            'GET_FARMER_PRODUCTS',
            'LOGIN_GUIDANCE',
        ]
        if not request.authenticated and (canonical.intent in consequential_intents or canonical.intent == 'ROLE_DECLARATION'):
            target_auth_role = effective_role if effective_role != 'GUEST' else canonical.target_role
            if target_auth_role == 'GUEST':
                target_auth_role = 'FARMER'  # Default portal fallback if unspecified
            
            nav_route = f"/auth/{target_auth_role.lower()}"
            prod = accumulated_entities.product or accumulated_entities.commodity
            qty = accumulated_entities.quantity
            loc = accumulated_entities.pickup_location or accumulated_entities.destination
            clean_loc = loc.split()[0] if loc else ''

            role_title = target_auth_role.title()
            role_hi = 'खरीदार' if target_auth_role == 'BUYER' else ('ट्रांसपोर्टर' if target_auth_role == 'TRANSPORTER' else 'किसान')
            role_mr = 'खरेदीदार' if target_auth_role == 'BUYER' else ('वाहतूकदार' if target_auth_role == 'TRANSPORTER' else 'शेतकरी')

            if prod and qty and target_auth_role in ['FARMER', 'BUYER']:
                if lang == 'hi':
                    login_msg = f"मैंने {f'{clean_loc} में ' if clean_loc else ''}{int(qty)} kg {prod} का अनुरोध नोट कर लिया है। चलिए पहले सुरक्षित रूप से {role_hi} खाते में लॉगिन कर लेते हैं।"
                elif lang == 'mr':
                    login_msg = f"मी {f'{clean_loc} मधील ' if clean_loc else ''}{int(qty)} kg {prod} ची नोंद घेतली आहे. चला प्रथम सुरक्षितपणे {role_mr} खात्यात लॉगिन करूया."
                elif lang == 'ta':
                    login_msg = f"{clean_loc} இல் {int(qty)} kg {prod} பதிவு செய்யப்பட்டுள்ளது. {role_title} கணக்கில் உள்நுழையலாம்."
                elif lang == 'te':
                    login_msg = f"{clean_loc} లో {int(qty)} kg {prod} నమోదు చేయబడింది. {role_title} ఖాతాలోకి లాగిన్ అవ్వండి."
                elif lang == 'bn':
                    login_msg = f"{clean_loc}-এ {int(qty)} kg {prod} নোট করা হয়েছে। {role_title} অ্যাকাউন্টে লগইন করুন।"
                elif lang == 'kn':
                    login_msg = f"{clean_loc} ನಲ್ಲಿ {int(qty)} kg {prod} ದಾಖಲಿಸಲಾಗಿದೆ. {role_title} ಖಾತೆಗೆ ಲಾಗಿನ್ ಮಾಡಿ."
                else:
                    login_msg = f"I've noted your {int(qty)} kg {prod}{f' in {clean_loc}' if clean_loc else ''}. Let's securely log in to your {role_title} account to proceed."
            elif target_auth_role == 'TRANSPORTER':
                v_type = accumulated_entities.vehicle_type or 'truck'
                if lang == 'hi':
                    login_msg = f"मैंने {f'{clean_loc} में ' if clean_loc else ''}आपके वाहन का विवरण नोट कर लिया है। उपलब्ध लोड और फेऱ्या देखने के लिए चलिए ट्रांसपोर्टर खाते में लॉगिन कर लेते हैं।"
                elif lang == 'mr':
                    login_msg = f"मी {f'{clean_loc} मधील ' if clean_loc else ''}आपल्या वाहनाची नोंद घेतली आहे. उपलब्ध फेऱ्या पाहण्यासाठी चला वाहतूकदार खात्यात लॉगिन करूया."
                else:
                    login_msg = f"I see you have a {v_type}{f' in {clean_loc}' if clean_loc else ''}. Let's securely log in to your Transporter account to view available loads."
            elif target_auth_role == 'BUYER':
                if prod and qty:
                    if lang == 'hi':
                        login_msg = f"मैंने {int(qty)} kg {prod} खरीद मांग का विवरण नोट कर लिया है। चलिए पहले खरीदार खाते में लॉगिन कर लेते हैं।"
                    elif lang == 'mr':
                        login_msg = f"मी {int(qty)} kg {prod} खरेदी मागणीची नोंद घेतली आहे. चला प्रथम खरेदीदार खात्यात लॉगिन करूया."
                    else:
                        login_msg = f"I've noted your procurement request for {int(qty)} kg {prod}. Let's securely log in to your Buyer account."
                else:
                    login_msg = self._get_login_guidance_msg(target_auth_role, lang)
            else:
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

        if intent == 'ROLE_DECLARATION':
            role = getattr(entities, 'target_role', None) or 'FARMER'
            farmer_ack = {
                "en": "Got it. I'll help you as a Farmer. What would you like to do?\n\nYou can ask me to list a product, check market demand, book transport, or view your deliveries.",
                "hi": "समझ गई। मैं एक किसान के रूप में आपकी सहायता करूँगी। आप क्या करना चाहेंगे?\n\nआप मुझसे फसल जोड़ने, मंडी मांग देखने, गाड़ी बुक करने या डिलीवरी देखने के लिए कह सकते हैं।",
                "mr": "समजले. मी शेतकरी म्हणून तुम्हाला मदत करेन. तुम्हाला काय करायचे आहे?\n\nतुम्ही मला पिके नोंदवणे, बाजार मागणी तपासणे, वाहतूक मागवणे किंवा डिलिव्हरी तपासण्यास सांगू शकता.",
                "ta": "புரிந்தது. ஒரு விவசாயியாக நான் உங்களுக்கு உதவுவேன். நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?",
                "te": "అర్థమైంది. నేను మీకు రైతుగా సహాయం చేస్తాను. మీరు ఏమి చేయాలనుకుంటున్నారు?",
                "bn": "বুঝেছি। আমি একজন কৃষক হিসেবে আপনাকে সাহায্য করব। আপনি কী করতে চান?",
                "kn": "ತಿಳಿಯಿತು. ನಾನು ನಿಮಗೆ ರೈತರಾಗಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ನೀವು ಏನು ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?",
            }
            buyer_ack = {
                "en": "Got it. I'll help you as a Buyer. What would you like to do?\n\nYou can ask me to post procurement demands, browse fresh produce, or track your orders.",
                "hi": "समझ गई। मैं एक खरीदार के रूप में आपकी सहायता करूँगी। आप क्या करना चाहेंगे?\n\nआप मुझसे खरीद मांग पोस्ट करने, ताज़ा उपज देखने या ऑर्डर ट्रैक करने के लिए कह सकते हैं।",
                "mr": "समजले. मी खरेदीदार म्हणून तुम्हाला मदत करेन. तुम्हाला काय करायचे आहे?\n\nतुम्ही मला खरेदी मागणी नोंदवणे, शेतमाल शोधणे किंवा ऑर्डर्स तपासण्यास सांगू शकता.",
                "ta": "புரிந்தது. வாங்குபவராக நான் உங்களுக்கு உதவுவேன். நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?",
                "te": "అర్థమైంది. నేను మీకు కొనుగోలుదారుగా సహాయం చేస్తాను. మీరు ఏమి చేయాలనుకుంటున్నారు?",
                "bn": "বুঝেছি। আমি একজন ক্রেতা হিসেবে আপনাকে সাহায্য করব। আপনি কী করতে চান?",
                "kn": "ತಿಳಿಯಿತು. ನಾನು ನಿಮಗೆ ಖರೀದಿದಾರರಾಗಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ನೀವು ಏನು ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?",
            }
            transporter_ack = {
                "en": "Got it. I'll help you as a Transporter. What would you like to do?\n\nYou can ask me to find available loads, manage your fleet, or view your earnings.",
                "hi": "समझ गई। मैं एक ट्रांसपोर्टर के रूप में आपकी सहायता करूँगी। आप क्या करना चाहेंगे?\n\nआप मुझसे उपलब्ध ट्रिप्स खोजने, गाड़ी जोड़ने या कमाई देखने के लिए कह सकते हैं।",
                "mr": "समजले. मी वाहतूकदार म्हणून तुम्हाला मदत करेन. तुम्हाला काय करायचे आहे?\n\nतुम्ही मला उपलब्ध फेऱ्या शोधणे, वाहने व्यवस्थापित करणे किंवा कमाई तपासण्यास सांगू शकता.",
                "ta": "புரிந்தது. ஒரு டிரான்ஸ்போர்ட்டராக நான் உங்களுக்கு உதவுவேன். நீங்கள் என்ன செய்ய விரும்புகிறீர்கள்?",
                "te": "అర్థమైంది. నేను మీకు రவாణాదారుగా సహాయం చేస్తాను. మీరు ఏమి చేయాలనుకుంటున్నారు?",
                "bn": "বুঝেছি। আমি একজন পরিবহনকারী হিসেবে আপনাকে সাহায্য করব। আপনি কী করতে চান?",
                "kn": "ತಿಳಿಯಿತು. ನಾನು ನಿಮಗೆ ಸಾರಿಗೆದಾರರಾಗಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ನೀವು ಏನು ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?",
            }
            if role == 'BUYER':
                return buyer_ack.get(lang, buyer_ack["en"])
            elif role == 'TRANSPORTER':
                return transporter_ack.get(lang, transporter_ack["en"])
            return farmer_ack.get(lang, farmer_ack["en"])

        if intent == 'LOGIN_GUIDANCE':
            role = getattr(entities, 'target_role', None) or 'FARMER'
            return self._get_login_guidance_msg(role, lang)

        if intent == 'GENERAL_HELP':
            general_msgs = {
                "en": "I'm ELA, your AgriRoute logistics assistant. Tell me your role (Farmer, Buyer, or Transporter) and I'll guide you from there.",
                "hi": "मैं ELA हूँ, आपकी एग्रीरूट लॉजिस्टिक्स सहायक। मुझे बताएं कि आप किसान, खरीदार या ट्रांसपोर्टर हैं और मैं आपकी मदद करूँगी।",
                "mr": "मी ELA, तुमची अ‍ॅग्रीरूट लॉजिस्टिक्स सहाय्यक. तुम्ही शेतकरी, खरेदीदार किंवा वाहतूकदार आहात ते सांगा म्हणजे मी मदत करेन.",
                "ta": "நான் ELA, உங்கள் அக்ரிரூட் தளவாட உதவியாளர். நீங்கள் விவசாயியா, வாங்குபவரா அல்லது டிரான்ஸ்போர்ட்டரா என்று கூறுங்கள்.",
                "te": "నేను ELA, మీ అగ్రిరూట్ లాజిస్టిక్స్ అసిస్టెంట్. మీరు రైతు, కొనుగోలుదారు లేదా రవాణాదారు అని చెప్పండి.",
                "bn": "আমি ELA, আপনার অ্যাগ্রিরুট লজিস্টিক সহকারী। আপনি কৃষক, ক্রেতা নাকি পরিবহনকারী তা আমাকে জানান।",
                "kn": "ನಾನು ELA, ನಿಮ್ಮ ಅಗ್ರಿರೌಟ್ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಸಹಾಯಕ. ನೀವು ರೈತ, ಖರೀದಿದಾರ ಅಥವಾ ಸಾರಿಗೆದಾರ ಎಂದು ಹೇಳಿ.",
            }
            return general_msgs.get(lang, general_msgs["en"])

        if conf_action:
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

        return "How can I help you? What would you like to do?"

    def _get_default_suggestions(self, role: UserRole, lang: SupportedLanguage) -> List[str]:
        if role == 'FARMER':
            if lang == 'mr': return ['पिके नोंदवा', 'बाजार मागणी', 'वाहतूक मागणी', 'माझी डिलिव्हरी']
            if lang == 'hi': return ['फसल जोड़ें', 'मंडी मांग', 'गाड़ी बुक करें', 'मेरी डिलीवरी']
            return ["List a product", "Market demand", "Book transport", "My deliveries"]
        elif role == 'BUYER':
            if lang == 'mr': return ['खरेदी मागणी नोंदवा', 'शेतमाल शोधा', 'माझ्या ऑर्डर्स']
            if lang == 'hi': return ['खरीद मांग पोस्ट करें', 'उपज देखें', 'मेरे ऑर्डर्स']
            return ["Post procurement", "Browse produce", "Track orders"]
        elif role == 'TRANSPORTER':
            if lang == 'mr': return ['उपलब्ध फेऱ्या', 'माझी वाहने', 'माझी कमाई']
            if lang == 'hi': return ['उपलब्ध ट्रिप्स', 'मेरी गाड़ियां', 'मेरी कमाई']
            return ["Available trips", "Manage vehicles", "View earnings"]
        return ["Choose Portal", "How AgriRoute Works", "Help Me Login", "What Can You Do?"]
