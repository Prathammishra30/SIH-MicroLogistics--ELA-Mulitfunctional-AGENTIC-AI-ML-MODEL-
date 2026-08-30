# Iterative Agent Loop (Phase 4 Python Core)
import time
from typing import Dict, Any, Optional, List
from pydantic import BaseModel
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
from ai.ela.intent.resolver import IntentResolver
from ai.ela.security.guard import SecurityGuard
from ai.ela.memory.session import ConversationMemory, UserMemory
from ai.ela.agent.confidence import ConfidenceEngine
from ai.ela.planner.goals import GoalManager
from ai.ela.planner.planner import AgentPlanner
from ai.ela.tools.registry import NodeToolBridge
from ai.ela.ml.models.demand import DemandPredictionModel, DemandFeatures
from ai.ela.ml.models.price import PricePredictionModel, PriceFeatures
from ai.ela.ml.models.eta import ETAPredictionModel, EtaFeatures
from ai.ela.ml.models.transport import TransportCostModel, TransportCostFeatures
from ai.ela.core.decision_support import DecisionSupportEngine


class AgentChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    authenticated: bool = False
    authenticated_role: UserRole = 'GUEST'
    language: SupportedLanguage = 'en'
    context: Dict[str, Any] = {}
    auth_token: Optional[str] = None


class AgentChatResponse(BaseModel):
    message: str
    intent: ElaIntent
    detected_role: UserRole
    language: SupportedLanguage
    status: AgentOutcome = 'SUCCESS'
    action_result: Optional[Dict[str, Any]] = None
    navigation_action: Optional[Dict[str, Any]] = None
    confirmation_action: Optional[Dict[str, Any]] = None
    ml_prediction: Optional[Dict[str, Any]] = None
    suggestions: List[str] = []
    trace: Optional[AgentExecutionTrace] = None
    timestamp: str = ""


class ElaAgentLoop:
    MAX_ITERATIONS = 5

    def __init__(self, node_bridge: Optional[NodeToolBridge] = None):
        self.node_bridge = node_bridge or NodeToolBridge()
        self.demand_model = DemandPredictionModel()
        self.price_model = PricePredictionModel()
        self.eta_model = ETAPredictionModel()
        self.cost_model = TransportCostModel()
        self.decision_support = DecisionSupportEngine()

    async def run(self, request: AgentChatRequest) -> AgentChatResponse:
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

        # ==========================================
        # STEP 1: UNDERSTAND & SECURITY SHIELD
        # ==========================================
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
                suggestions=self._get_default_suggestions(request.authenticated_role, lang),
                trace=trace,
                timestamp=datetime.now().isoformat(),
            )

        # Canonical Intent & Entity Extraction
        canonical = IntentResolver.resolve(raw_message, request.authenticated_role, lang)
        effective_role = request.authenticated_role if request.authenticated else (canonical.target_role if canonical.target_role != 'GUEST' else 'GUEST')
        authoritative_role = request.authenticated_role if request.authenticated else 'GUEST'

        # Multi-turn Entity Accumulation
        accumulated_entities = ConversationMemory.update_entities(session_id, canonical.entities)
        ConversationMemory.set_last_intent(session_id, canonical.intent)

        # Confidence Evaluation & Clarification Loop
        conf_result = ConfidenceEngine.evaluate(
            canonical.intent,
            accumulated_entities,
            canonical.confidence,
            lang,
            effective_role,
        )

        if conf_result.needs_clarification and conf_result.clarification_question:
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
                final_outcome='NEEDS_CLARIFICATION',
                total_latency_ms=round((time.time() - start_time) * 1000, 2),
            )
            return AgentChatResponse(
                message=conf_result.clarification_question,
                intent=canonical.intent,
                detected_role=effective_role,
                language=lang,
                status='NEEDS_CLARIFICATION',
                suggestions=self._get_default_suggestions(effective_role, lang),
                trace=trace,
                timestamp=datetime.now().isoformat(),
            )

        # ==========================================
        # STEP 2: GOAL DECOMPOSITION & PLANNING
        # ==========================================
        goal_plan = GoalManager.decompose_goal(
            canonical.intent,
            accumulated_entities,
            effective_role,
            raw_message,
        )
        ConversationMemory.set_active_goal(session_id, goal_plan)
        plan = AgentPlanner.plan(canonical, authoritative_role)

        if not plan.is_executable:
            # Conversational guidance / Role declaration / Denial
            msg = self._get_conversational_response(
                canonical.intent, lang, canonical.target_role, plan.denial_reason
            )
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
                final_outcome='UNAUTHORIZED' if plan.denial_reason else 'SUCCESS',
                total_latency_ms=round((time.time() - start_time) * 1000, 2),
            )
            return AgentChatResponse(
                message=msg,
                intent=canonical.intent,
                detected_role=effective_role,
                language=lang,
                status='UNAUTHORIZED' if plan.denial_reason else 'SUCCESS',
                suggestions=self._get_default_suggestions(effective_role, lang),
                trace=trace,
                timestamp=datetime.now().isoformat(),
            )

        # ==========================================
        # STEP 3: EXECUTE & OBSERVE (Iterative Loop)
        # ==========================================
        selected_tools = []
        tool_results = []
        action_result = None
        confirmation_action = None
        navigation_action = None
        status_outcome: AgentOutcome = 'SUCCESS'

        for step in plan.steps:
            selected_tools.append(step.tool_name)
            step_start = time.time()

            if step.is_consequential:
                # Stage Consequential Confirmation Card
                confirmation_action = {
                    "toolName": step.tool_name,
                    "title": f"Confirm {step.tool_name.replace('_', ' ').title()}",
                    "params": step.arguments,
                    "requiresConfirmation": True,
                }
                status_outcome = 'CONFIRMATION_REQUIRED'
                break

            # Execute read tool via Node Bridge
            res = await self.node_bridge.execute_tool_on_node(
                step.tool_name,
                step.arguments,
                request.user_id,
                request.authenticated_role,
                request.auth_token,
            )
            dur = (time.time() - step_start) * 1000
            tool_results.append({
                "tool_name": step.tool_name,
                "success": res.get("success", True),
                "duration_ms": round(dur, 2),
            })
            action_result = res

        # ==========================================
        # STEP 4: ML PREDICTIVE INTELLIGENCE & DECISION SUPPORT
        # ==========================================
        ml_prediction = None
        try:
            if accumulated_entities.product and canonical.intent in ['GET_MARKET_DEMAND', 'CREATE_PRODUCT_WORKFLOW']:
                price_res = await self.price_model.predict(
                    PriceFeatures(
                        commodity=accumulated_entities.product or "Tomatoes",
                        grade=accumulated_entities.grade or 'A',
                    )
                )
                ml_prediction = {
                    "prediction": price_res.prediction.model_dump(),
                    "confidence": price_res.confidence,
                    "model_version": price_res.model_version,
                    "model_status": price_res.model_status,
                    "timestamp": price_res.timestamp,
                    "features_used": price_res.features_used,
                    "explanation": price_res.explanation,
                }
            elif accumulated_entities.destination and canonical.intent == 'CREATE_LOGISTICS_WORKFLOW':
                # Determine user optimization strategy from input
                norm_msg = raw_message.lower()
                strategy = "CHEAPEST" if ("cheap" in norm_msg or "सस्ता" in norm_msg or "कमी खर्च" in norm_msg) else (
                    "FASTEST" if ("fast" in norm_msg or "जल्दी" in norm_msg or "तात्काळ" in norm_msg or "urgent" in norm_msg) else (
                        "FRESHNESS" if ("fresh" in norm_msg or "ताज़ा" in norm_msg or "ताजे" in norm_msg) else "BALANCED"
                    )
                )

                dec_res = await self.decision_support.evaluate_transport_options(
                    origin=accumulated_entities.pickup_location or "Farm Gate",
                    destination=accumulated_entities.destination or "Pune Mandi",
                    commodity=accumulated_entities.product or "Produce",
                    weight_kg=float(accumulated_entities.quantity or 500.0),
                    available_vehicles=[],
                    user_preference=strategy,
                )

                top_opt = dec_res.recommended_option
                if top_opt and confirmation_action:
                    confirmation_action["summary"] = (
                        f"Recommended: {top_opt.vehicle_type} (Est. Freight: ₹{top_opt.estimated_cost:.0f}, ETA: {top_opt.formatted_duration}) — {top_opt.recommendation_reason}"
                    )
                    confirmation_action["params"]["estimatedFreight"] = top_opt.estimated_cost
                    confirmation_action["params"]["estimatedDuration"] = top_opt.formatted_duration
                    confirmation_action["params"]["vehicleType"] = top_opt.vehicle_type

                ml_prediction = {
                    "prediction": dec_res.model_dump(),
                    "confidence": dec_res.confidence,
                    "model_version": "DecisionSupportEngine-v1.2",
                    "model_status": "trained",
                    "timestamp": datetime.now().isoformat(),
                    "features_used": {
                        "origin": accumulated_entities.pickup_location or "Farm Gate",
                        "destination": accumulated_entities.destination or "Pune Mandi",
                        "weight_kg": accumulated_entities.quantity or 500.0,
                        "strategy": strategy,
                    },
                    "explanation": dec_res.explanation_summary,
                }
        except Exception:
            pass

        # ==========================================
        # STEP 5: VERIFY GOAL & RESPONSE GENERATION
        # ==========================================
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
            selected_tools=selected_tools,
            tool_results=tool_results,
            model_provider='PythonAgentCore',
            model_version='ela-py-v4',
            total_latency_ms=total_latency,
            final_outcome=status_outcome,
        )

        user_msg = self._build_execution_message(
            canonical.intent, lang, accumulated_entities, confirmation_action, action_result
        )

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

    def _get_conversational_response(
        self, intent: ElaIntent, lang: SupportedLanguage, role: UserRole, denial_reason: Optional[str]
    ) -> str:
        if denial_reason:
            return denial_reason

        if intent == 'ROLE_DECLARATION':
            if role == 'FARMER':
                msgs = {
                    'en': "Got it. I'll help you as a Farmer. You can ask me to manage products, check market demand, arrange logistics, or access your farmer portal.",
                    'hi': 'समझ गई। मैं एक किसान के रूप में आपकी सहायता करूँगी। आप मुझसे फसल जोड़ने, मंडी मांग देखने, गाड़ी बुक करने या किसान पोर्टल खोलने के लिए कह सकते हैं।',
                    'mr': 'समजले. मी शेतकरी म्हणून तुम्हाला मदत करेन. तुम्ही मला पिके नोंदवणे, बाजार मागणी तपासणे, वाहतूक मागवणे किंवा शेतकरी पोर्टल उघडण्यास सांगू शकता.',
                    'ta': 'புரிந்தது. ஒரு விவசாயியாக நான் உங்களுக்கு உதவுவேன். தயாரிப்புகளை நிர்வகிக்க, சந்தை தேவையை சரிபார்க்க, தளவாடங்களை ஏற்பாடு செய்ய அல்லது விவசாயி போர்ட்டலை அணுக என்னை நீங்கள் கேட்கலாம்.',
                    'te': 'అర్థమైంది. నేను మీకు రైతుగా సహాయం చేస్తాను. మీరు నన్ను ఉత్పత్తులను నిర్వహించడానికి, మార్కెట్ డిమాండ్‌ను తనిఖీ చేయడానికి, రవాణాను ఏర్పాటు చేయడానికి లేదా రైతు పోర్టల్‌ను యాక్సెస్ చేయడానికి అడగవచ్చు.',
                    'bn': 'বুঝেছি। আমি একজন কৃষক হিসেবে আপনাকে সাহায্য করব। আপনি আমাকে পণ্য পরিচালনা করতে, বাজারের চাহিদা পরীক্ষা করতে, লজিস্টিক ব্যবস্থা করতে বা কৃষক পোর্টালে প্রবেশ করতে বলতে পারেন।',
                    'kn': 'ತಿಳಿಯಿತು. ನಾನು ನಿಮಗೆ ರೈತರಾಗಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಉತ್ಪನ್ನಗಳನ್ನು ನಿರ್ವಹಿಸಲು, ಮಾರುಕಟ್ಟೆ ಬೇಡಿಕೆಯನ್ನು ಪರಿಶೀಲಿಸಲು, ಸಾರಿಗೆ ವ್ಯವಸ್ಥೆ ಮಾಡಲು ಅಥವಾ ರೈತ ಪೋರ್ಟಲ್ ಅನ್ನು ಪ್ರವೇಶಿಸಲು ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು.',
                }
                return msgs.get(lang, msgs['en'])
            elif role == 'BUYER':
                msgs = {
                    'en': "Got it. I'll help you as a Buyer. You can ask me to post procurement demands, browse fresh produce, or track orders.",
                    'hi': 'समझ गई। मैं एक खरीदार/व्यापारी के रूप में आपकी सहायता करूँगी। आप मुझसे खरीद मांग पोस्ट करने, ताज़ा फसल ब्राउज़ करने या ऑर्डर देखने के लिए कह सकते हैं।',
                    'mr': 'समजले. मी खरेदीदार/व्यापारी म्हणून तुम्हाला मदत करेन. तुम्ही मला खरेदी मागणी नोंदवणे, थेट शेतमाल शोधणे किंवा ऑर्डर्स तपासण्यास सांगू शकता.',
                    'ta': 'புரிந்தது. வாங்குபவராக நான் உங்களுக்கு உதவுவேன். நீங்கள் கொள்முதல் தேவைகளை பதிவு செய்ய, புதிய விளைபொருட்களை உலாவ அல்லது ஆர்டர்களைக் கண்காணிக்க என்னைக் கேட்கலாம்.',
                    'te': 'అర్థమైంది. నేను మీకు కొనుగోలుదారుగా సహాయం చేస్తాను. మీరు నన్ను సేకరణ డిమాండ్లను పోస్ట్ చేయడానికి, తాజా పంటలను బ్రౌజ్ చేయడానికి లేదా ఆర్డర్‌లను ట్రాక్ చేయడానికి అడగవచ్చు.',
                    'bn': 'বুঝেছি। আমি একজন ক্রেতা হিসেবে আপনাকে সাহায্য করব। আপনি আমাকে ক্রয়ের চাহিদা পোস্ট করতে, তাজা ফসল ব্রাউজ করতে বা অর্ডার ট্র্যাক করতে বলতে পারেন।',
                    'kn': 'ತಿಳಿಯಿತು. ನಾನು ನಿಮಗೆ ಖರೀದಿದಾರರಾಗಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಖರೀದಿ ಬೇಡಿಕೆಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಲು, ತಾಜಾ ಉತ್ಪನ್ನಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಲು ಅಥವಾ ಆರ್ಡರ್‌ಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು.',
                }
                return msgs.get(lang, msgs['en'])
            elif role == 'TRANSPORTER':
                msgs = {
                    'en': "Got it. I'll help you as a Transporter. You can ask me to find available trips, manage your fleet, or view earnings.",
                    'hi': 'समझ गई। मैं एक ट्रांसपोर्टर के रूप में आपकी सहायता करूँगी। आप मुझसे उपलब्ध ट्रिप्स खोजने, गाड़ी जोड़ने या कमाई देखने के लिए कह सकते हैं।',
                    'mr': 'समजले. मी वाहतूकदार म्हणून तुम्हाला मदत करेन. तुम्ही मला उपलब्ध फेऱ्या शोधणे, वाहने व्यवस्थापित करणे किंवा कमाई तपासण्यास सांगू शकता.',
                    'ta': 'புரிந்தது. ஒரு டிரான்ஸ்போர்ட்டராக நான் உங்களுக்கு உதவுவேன். கிடைக்கக்கூடிய பயணங்களைக் கண்டறிய, உங்கள் வாகனங்களை நிர்வகிக்க அல்லது வருவாயைக் காண நீங்கள் என்னைக் கேட்கலாம்.',
                    'te': 'అర్థమైంది. నేను మీకు రవాణాదారుగా సహాయం చేస్తాను. అందుబాటులో ఉన్న ట్రిప్పులను కనుగొనడానికి, మీ వాహనాలను నిర్వహించడానికి లేదా ఆదాయాలను చూడటానికి మీరు నన్ను అడగవచ్చు.',
                    'bn': 'বুঝেছি। আমি একজন পরিবহনকারী হিসেবে আপনাকে সাহায্য করব। আপনি আমাকে উপলব্ধ ট্রিপগুলি খুঁজে পেতে, আপনার যানবাহন পরিচালনা করতে বা উপার্জন দেখতে বলতে পারেন।',
                    'kn': 'ತಿಳಿಯಿತು. ನಾನು ನಿಮಗೆ ಸಾರಿಗೆದಾರರಾಗಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಲಭ್ಯವಿರುವ ಟ್ರಿಪ್‌ಗಳನ್ನು ಹುಡುಕಲು, ನಿಮ್ಮ ವಾಹನಗಳನ್ನು ನಿರ್ವಹಿಸಲು ಅಥವಾ ಗಳಿಕೆಗಳನ್ನು ವೀಕ್ಷಿಸಲು ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು.',
                }
                return msgs.get(lang, msgs['en'])

        if intent == 'EXPLAIN_PLATFORM':
            msgs = {
                'en': 'AgriRoute is an AI-powered micro-logistics platform connecting rural farmers directly with mandi buyers and verified local transport. As ELA, I can help you manage produce batches, check live APMC market prices, calculate transit ETAs, request transport, or post procurement orders.',
                'hi': 'एग्रीरूट एक AI-संचालित माइक्रो-लॉजिस्टिक्स प्लेटफॉर्म है जो किसानों को सीधे व्यापारियों और स्थानीय ट्रांसपोर्ट से जोड़ता है। ईला (ELA) के रूप में मैं आपको फसल प्रबंधित करने, मंडी भाव देखने, गाड़ी बुक करने या खरीद मांग पोस्ट करने में मदद कर सकती हूँ।',
                'mr': 'अ‍ॅग्रीरूट हे शेतकऱ्यांना थेट खरेदीदार आणि वाहनांशी जोडणारे AI-सक्षम मायक्रो-लॉजिस्टिक्स प्लॅटफॉर्म आहे. ईला (ELA) म्हणून मी तुम्हाला शेतमाल नोंदवणे, बाजार भाव तपासणे, वाहतूक मागवणे किंवा खरेदी मागणी नोंदवण्यात मदत करू शकते.',
                'ta': 'அக்ரிரூட் என்பது விவசாயிகளை வணிகர்கள் மற்றும் போக்குவரத்து வாகனங்களுடன் நேரடியாக இணைக்கும் AI தளமாகும். பயிர்களை நிர்வகிக்கவும், விலைகளை அறியவும், போக்குவரத்து கோரவும் நான் உதவ முடியும்.',
                'te': 'అగ్రిరూట్ అనేది రైతులను వ్యాపారులు మరియు రవాణా వాహనాలతో నేరుగా అనుసంధానించే AI ప్లాట్‌ఫారమ్. పంటలను నిర్వహించడానికి మరియు రవాణాను అభ్యర్థించడానికి నేను సహాయం చేయగలను.',
                'bn': 'অ্যাগ্রিরুট হল একটি AI-চালিত মাইক্রো-লজিস্টিক প্ল্যাটফর্ম যা কৃষকদের সরাসরি ব্যবসায়ীদের সাথে সংযুক্ত করে।',
                'kn': 'ಅಗ್ರಿರೌಟ್ ರೈತರನ್ನು ವ್ಯಾಪಾರಿಗಳು ಮತ್ತು ಸಾರಿಗೆ ವಾಹನಗಳೊಂದಿಗೆ ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸುವ AI ವೇದಿಕೆಯಾಗಿದೆ.',
            }
            return msgs.get(lang, msgs['en'])

        universal_welcome = {
            'en': "Hello! I'm ELA, your AgriRoute Universal Intelligence Assistant. मैं Farmer, Buyer या Transporter portal में आपकी मदद कर सकती हूँ. How can I help you today?",
            'hi': 'नमस्ते! मैं ईला (ELA) हूँ, आपकी एग्रीरूट AI सहायक। मैं आपको किसान, खरीदार या ट्रांसपोर्टर पोर्टल में प्रवेश करने, एग्रीरूट कैसे काम करता है यह समझने, या काम पूरे करने में मदद कर सकती हूँ।',
            'mr': 'नमस्कार! मी ईला (ELA), तुमची अ‍ॅग्रीरूट AI सहाय्यक. मी तुम्हाला शेतकरी, खरेदीदार किंवा वाहतूकदार पोर्टलमध्ये प्रवेश करण्यास, अ‍ॅग्रीरूट कसे कार्य करते ते समजून घेण्यास किंवा कार्ये पूर्ण करण्यास मदत करू शकते.',
            'ta': 'வணக்கம்! நான் இலா (ELA), உங்கள் அக்ரிரூட் AI உதவியாளர். விவசாயி, வாங்குபவர் அல்லது டிரான்ஸ்போர்ட்டர் போர்ட்டலை அணுகவும், அக்ரிரூட் எவ்வாறு செயல்படுகிறது என்பதைப் புரிந்து கொள்ளவும் நான் உதவ முடியும்.',
            'te': 'నమస్కారం! నేను ఎలా (ELA), మీ అగ్రిరూట్ AI సహాయకురాలిని. రైతు, కొనుగోలుదారు లేదా రవాణాదారు పోర్టల్‌ను యాక్సెస్ చేయడానికి, అగ్రిరూట్ ఎలా పనిచేస్తుందో అర్థం చేసుకోవడానికి నేను సహాయం చేయగలను.',
            'bn': 'নমস্কার! আমি ইলা (ELA), আপনার অ্যাগ্রিরুট AI সহকারী। আমি আপনাকে কৃষক, ক্রেতা বা পরিবহনকারী পোর্টালে প্রবেশ করতে, অ্যাগ্রিরুট কীভাবে কাজ করে তা বুঝতে সাহায্য করতে পারি।',
            'kn': 'ನಮಸ್ಕಾರ! ನಾನು ಇಲಾ (ELA), ನಿಮ್ಮ ಅಗ್ರಿರೌಟ್ AI ಸಹಾಯಕ. ರೈತ, ಖರೀದಿದಾರ ಅಥವಾ ಸಾರಿಗೆದಾರ ಪೋರ್ಟಲ್ ಅನ್ನು ಪ್ರವೇಶಿಸಲು, ಅಗ್ರಿರೌಟ್ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ ಎಂಬುದನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.',
        }
        return universal_welcome.get(lang, universal_welcome['en'])

    def _build_execution_message(
        self, intent: ElaIntent, lang: SupportedLanguage, entities: Any, conf_action: Any, action_res: Any
    ) -> str:
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

        # Read tool responses
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

        return "I have processed your request."

    def _get_default_suggestions(self, role: UserRole, lang: SupportedLanguage) -> List[str]:
        if role == 'FARMER':
            return ["Add 500 kg Tomatoes", "Check Market Demand", "Request Transport to Pune", "My Deliveries"]
        elif role == 'BUYER':
            return ["Browse Produce", "Post Procurement Demand", "My Orders", "Price Forecast"]
        elif role == 'TRANSPORTER':
            return ["Find Available Loads", "My Vehicles", "My Earnings", "Active Trips"]
        return ["I am a Farmer", "I am a Buyer", "I am a Transporter", "How AgriRoute Works"]
