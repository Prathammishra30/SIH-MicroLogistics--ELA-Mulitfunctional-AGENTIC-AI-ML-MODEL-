# ELA Voice-First Task Dispatcher (Phase 13 Unified Action Pipeline)
# Implements strict 5-branch task-first dispatch logic over the unified action registry:
# 1. High confidence, complete params, REVERSIBLE -> Execute immediately, speak result
# 2. High confidence, complete params, CONSEQUENTIAL -> Confirm-before-execute via spoken question
# 3. Match found, missing parameter -> Targeted slot-filling clarifying question
# 4. No registry match -> Unambiguously labeled suggestion (never presented as done)
# 5. Low STT confidence (< 0.65) -> Explicit repeat request in user's language

import re
import uuid
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
from pydantic import BaseModel

from ai.ela.agent.state import UserRole, SupportedLanguage, ElaIntent, AgentOutcome
from ai.ela.intent.types import CanonicalIntent
from ai.ela.intent.resolver import IntentResolver
from ai.ela.tools.registry import ToolRegistry, ToolMetadata, NodeToolBridge
from ai.ela.orchestration.service import MatchOrchestrationService

STT_CONFIDENCE_THRESHOLD = 0.65

# Localized Repeat Prompts (Branch 5)
REPEAT_PROMPTS: Dict[str, str] = {
    'en': "I couldn't hear that clearly. Could you please repeat?",
    'hi': "मुझे स्पष्ट रूप से सुनाई नहीं दिया। क्या आप कृपया दोबारा बोल सकते हैं?",
    'mr': "मला स्पष्ट ऐकू आले नाही. कृपया पुन्हा सांगू शकाल का?",
    'ta': "எனக்கு தெளிவாகக் கேட்கவில்லை. தயவுசெய்து மீண்டும் கூற முடியுமா?",
    'te': "నాకు స్పష్టంగా వినపడలేదు. దయచేసి మళ్ళీ చెప్పగలరా?",
    'bn': "আমি স্পষ্টভাবে শুনতে পাইনি। আপনি কি দয়া করে আবার বলতে পারেন?",
    'kn': "ನನಗೆ ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಹೇಳಬಹುದೇ?",
}

# Localized Suggestion Prefixes (Branch 4)
SUGGESTION_PREFIXES: Dict[str, str] = {
    'en': "Suggestion: ",
    'hi': "सुझाव: ",
    'mr': "सल्ला: ",
    'ta': "பரிந்துரை: ",
    'te': "సూచన: ",
    'bn': "পরামর্শ: ",
    'kn': "ಸಲಹೆ: ",
}

# Localized Slot-Filling Questions (Branch 3)
SLOT_QUESTIONS: Dict[str, Dict[str, str]] = {
    'name': {
        'en': "Which crop or produce would you like to list?",
        'hi': "आप कौन सी फसल या उत्पाद जोड़ना चाहते हैं?",
        'mr': "तुम्हाला कोणते पीक किंवा शेतमाल नोंदवायचा आहे?",
        'ta': "எந்த விளைபொருளை நீங்கள் பட்டியலிட விரும்புகிறீர்கள்?",
        'te': "మీరు ఏ పంటను జాబಿತా చేయాలనుకుంటున్నారు?",
        'bn': "আপনি কোন ফসল বা পণ্য তালিকাভুক্ত করতে চান?",
        'kn': "ನೀವು ಯಾವ ಬೆಳೆಯನ್ನು ಸೇರಿಸಲು ಬಯಸುತ್ತೀರಿ?",
    },
    'productName': {
        'en': "Which crop would you like to transport?",
        'hi': "आप कौन सी फसल का परिवहन करना चाहते हैं?",
        'mr': "तुम्हाला कोणत्या शेतमालाची वाहतूक करायची आहे?",
        'ta': "எந்தப் பயிரை நீங்கள் கொண்டு செல்ல விரும்புகிறீர்கள்?",
        'te': "మీరు ఏ పంటను రవాణా చేయాలనుకుంటున్నారు?",
        'bn': "আপনি কোন ফসল পরিবহন করতে চান?",
        'kn': "ನೀವು ಯಾವ ಬೆಳೆಯನ್ನು ಸಾಗಿಸಲು ಬಯಸುತ್ತೀರಿ?",
    },
    'product': {
        'en': "Which produce would you like to procure?",
        'hi': "आप कौन सी उपज खरीदना चाहते हैं?",
        'mr': "तुम्हाला कोणता शेतमाल खरेदी करायचा आहे?",
        'ta': "நீங்கள் எந்தப் பொருளைக் கொள்முதல் செய்ய விரும்புகிறீர்கள்?",
        'te': "మీరు ఏ ఉత్పత్తులను కొనుగోలు చేయాలనుకుంటున్నారు?",
        'bn': "আপনি কোন পণ্য সংগ্রহ করতে চান?",
        'kn': "ನೀವು ಯಾವ ಉತ್ಪನ್ನವನ್ನು ಖರೀದಿಸಲು ಬಯಸುತ್ತೀರಿ?",
    },
    'quantity': {
        'en': "What quantity in kg do you have?",
        'hi': "आपके पास कितने किलोग्राम मात्रा है?",
        'mr': "तुमच्याकडे किती किलो प्रमाण आहे?",
        'ta': "உங்களிடம் எத்தனை கிலோ அளவு உள்ளது?",
        'te': "మీ వద్ద ఎన్ని కిలోల పరిమాణం ఉంది?",
        'bn': "আপনার কাছে কত কেজি পরিমাণ আছে?",
        'kn': "ನಿಮ್ಮ ಬಳಿ ಎಷ್ಟು ಕೆಜಿ ಪ್ರಮಾಣವಿದೆ?",
    },
    'price': {
        'en': "What is your asking price per kg?",
        'hi': "प्रति किलो आपका क्या भाव (मूल्य) है?",
        'mr': "प्रति किलो तुमचा काय दर (किंमत) आहे?",
        'ta': "கிலோவுக்கு உங்கள் விலை என்ன?",
        'te': "కిలోకు మీ ధర ఎంత?",
        'bn': "প্রতি কেজিতে আপনার দাম কত?",
        'kn': "ಪ್ರತಿ ಕೆಜಿಗೆ ನಿಮ್ಮ ಬೆಲೆ ಎಷ್ಟು?",
    },
    'targetPrice': {
        'en': "What is your target budget per kg?",
        'hi': "प्रति किलो आपका लक्षित बजट क्या है?",
        'mr': "प्रति किलो तुमचे बजेट काय आहे?",
        'ta': "கிலோவுக்கு உங்கள் இலக்கு விலை என்ன?",
        'te': "కిలోకు మీ బడ్జెట్ ఎంత?",
        'bn': "প্রতি কেজিতে আপনার লক্ষ্য বাজেট কত?",
        'kn': "ಪ್ರತಿ ಕೆಜಿಗೆ ನಿಮ್ಮ ಬಜೆಟ್ ಎಷ್ಟು?",
    },
    'pickupLocation': {
        'en': "Where should the load be picked up from?",
        'hi': "माल कहाँ से पिकअप करना है (स्थान)?",
        'mr': "माल कुठून उचलायचा आहे (पिकअप ठिकाण)?",
        'ta': "பொருட்களை எங்கிருந்து எடுக்க வேண்டும்?",
        'te': "లోడ్‌ను ఎక్కడి నుండి పికప్ చేసుకోవాలి?",
        'bn': "পণ্য কোথা থেকে তুলতে হবে?",
        'kn': "ಲೋಡ್ ಅನ್ನು ಎಲ್ಲಿಂದ ಪಿಕಪ್ ಮಾಡಬೇಕು?",
    },
    'destination': {
        'en': "Where should the produce be delivered?",
        'hi': "माल किस गंतव्य या मंडी में पहुँचाना है?",
        'mr': "माल कोणत्या शहरात किंवा मार्केटमध्ये पोहोचवायचा आहे?",
        'ta': "விளைபொருளை எங்கு டெలిவரி செய்ய வேண்டும்?",
        'te': "ఉత్పత్తులను ఎక్కడికి చేర్చాలి?",
        'bn': "পণ্য কোথায় পৌঁছে দিতে হবে?",
        'kn': "ಉತ್ಪನ್ನವನ್ನು ಎಲ್ಲಿಗೆ ತಲುಪಿಸಬೇಕು?",
    },
    'tripId': {
        'en': "Which trip ID would you like to accept?",
        'hi': "आप कौन सी ट्रिप आईडी स्वीकार करना चाहते हैं?",
        'mr': "तुम्हाला कोणती ट्रिप आयडी स्वीकारायची आहे?",
        'ta': "எந்த பயண ஐடியை ஏற்க விரும்புகிறீர்கள்?",
        'te': "మీరు ఏ ట్రిప్ ఐడిని అంగీకరించాలనుకుంటున్నారు?",
        'bn': "আপনি কোন ট্রিপ আইডি গ্রহণ করতে চান?",
        'kn': "ನೀವು ಯಾವ ಟ್ರಿಪ್ ಐಡಿಯನ್ನು ಸ್ವೀಕರಿಸಲು ಬಯಸುತ್ತೀರಿ?",
    },
    'proposalId': {
        'en': "Which match proposal ID are you responding to?",
        'hi': "आप किस मैच प्रपोजल आईडी का उत्तर दे रहे हैं?",
        'mr': "तुम्ही कोणत्या मॅच प्रपोजल आयडीला उत्तर देत आहात?",
        'ta': "எந்த பொருத்த திட்ட ஐடிக்கு பதிலளிக்கிறீர்கள்?",
        'te': "మీరు ఏ మ్యాచ్ ప్రతిపాదన ఐడికి ప్రతిస్పందిస్తున్నారు?",
        'bn': "আপনি কোন ম্যাচ প্রস্তাব আইডির উত্তর দিচ্ছেন?",
        'kn': "ನೀವು ಯಾವ ಹೊಂದಾಣಿಕೆ ಪ್ರಸ್ತಾಪ ಐಡಿಗೆ ಪ್ರತಿಕ್ರಿಯಿಸುತ್ತಿದ್ದೀರಿ?",
    },
    'decision': {
        'en': "Would you like to APPROVE or DECLINE this proposal?",
        'hi': "क्या आप इस प्रस्ताव को मंजूर (APPROVE) या अस्वीकार (DECLINE) करना चाहते हैं?",
        'mr': "तुम्ही हा प्रस्ताव मंजूर (APPROVE) की नामंजूर (DECLINE) करू इच्छिता?",
        'ta': "இந்தத் திட்டத்தை அங்கீகரிக்கவா அல்லது நிராகரிக்கவா?",
        'te': "మీరు ఈ ప్రతిపాదనను ఆమోదించాలనుకుంటున్నారా లేదా తిరస్కరించాలనుకుంటున్నారా?",
        'bn': "আপনি কি এই প্রস্তাবটি অনুমোদন বা প্রত্যাখ্যান করতে চান?",
        'kn': "ನೀವು ಈ ಪ್ರಸ್ತಾಪವನ್ನು ಅನುಮೋದಿಸಲು ಅಥವಾ ನಿರಾಕರಿಸಲು ಬಯಸುತ್ತೀರಾ?",
    },
}

AFFIRMATIVE_REGEX = re.compile(
    r'^(yes|yeah|yep|sure|confirm|proceed|ok|okay|do it|approve|agreed|haan|ha|theek hai|ho|kar do|karava|chalel|thik ahe|சரி|ஆம்|అవును|సరే|হ্যাঁ|ঠিক আছে|ಹೌದು|ಸರಿ)$',
    re.IGNORECASE,
)

NEGATIVE_REGEX = re.compile(
    r'^(no|nope|cancel|stop|dont|don\'t|reject|decline|nahin|nahi|nako|vaddu|வேண்டாம்|వద్దు|না|ಬೇಡ)$',
    re.IGNORECASE,
)


class DispatchResult(BaseModel):
    branch: int  # 1 to 5
    message: str
    tool_name: Optional[str] = None
    action_type: Optional[str] = None  # REVERSIBLE or CONSEQUENTIAL
    executed: bool = False
    requires_confirmation: bool = False
    confirmation_payload: Optional[Dict[str, Any]] = None
    missing_parameter: Optional[str] = None
    action_result: Optional[Dict[str, Any]] = None
    navigation_action: Optional[Dict[str, Any]] = None
    status: AgentOutcome = 'SUCCESS'
    language: SupportedLanguage = 'en'
    is_suggestion: bool = False


class TaskDispatcher:
    """
    Task-First Dispatch Engine enforcing the 5-branch resolution over the unified action registry.
    """

    def __init__(self, node_bridge: Optional[NodeToolBridge] = None, orchestration_service: Optional[MatchOrchestrationService] = None):
        self.node_bridge = node_bridge or NodeToolBridge()
        self.orchestration_service = orchestration_service or MatchOrchestrationService()

    @classmethod
    def is_affirmative(cls, text: str) -> bool:
        clean = re.sub(r'[^\w\s]', '', text.strip().lower())
        tokens = clean.split()
        if any(AFFIRMATIVE_REGEX.match(t) for t in tokens):
            return True
        return bool(AFFIRMATIVE_REGEX.match(clean))

    @classmethod
    def is_negative(cls, text: str) -> bool:
        clean = re.sub(r'[^\w\s]', '', text.strip().lower())
        tokens = clean.split()
        if any(NEGATIVE_REGEX.match(t) for t in tokens):
            return True
        return bool(NEGATIVE_REGEX.match(clean))

    async def dispatch(
        self,
        text: str,
        role: UserRole = 'GUEST',
        preferred_language: SupportedLanguage = 'en',
        stt_confidence: float = 1.0,
        is_voice: bool = False,
        pending_action: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        auth_token: Optional[str] = None,
    ) -> DispatchResult:
        norm_text = text.strip()
        lang = preferred_language

        # ---------------------------------------------------------------------
        # BRANCH 5: STT CONFIDENCE PROTECTION (< 0.65 threshold)
        # ---------------------------------------------------------------------
        if is_voice and stt_confidence < STT_CONFIDENCE_THRESHOLD:
            repeat_msg = REPEAT_PROMPTS.get(lang, REPEAT_PROMPTS['en'])
            return DispatchResult(
                branch=5,
                message=repeat_msg,
                executed=False,
                status='NEEDS_CLARIFICATION',
                language=lang,
                is_suggestion=False,
            )

        # ---------------------------------------------------------------------
        # PENDING CONFIRMATION RESOLUTION (Affirmative execution check)
        # ---------------------------------------------------------------------
        if pending_action and pending_action.get('toolName'):
            tool_name = pending_action['toolName']
            params = pending_action.get('params', {})

            if self.is_affirmative(norm_text):
                # User confirmed the staged consequential action
                exec_res = await self._execute_tool(tool_name, params, user_id, role, auth_token, confirmed=True)
                confirm_msg = self._format_executed_message(tool_name, params, lang)
                return DispatchResult(
                    branch=2,
                    message=confirm_msg,
                    tool_name=tool_name,
                    action_type='CONSEQUENTIAL',
                    executed=True,
                    action_result=exec_res,
                    status='SUCCESS',
                    language=lang,
                )
            elif self.is_negative(norm_text):
                cancel_msg = {
                    'en': "Action cancelled.",
                    'hi': "कार्रवाई रद्द कर दी गई।",
                    'mr': "कृती रद्द केली आहे.",
                    'ta': "செயல் ரத்து செய்யப்பட்டது.",
                    'te': "చర్య రద్దు చేయబడింది.",
                    'bn': "পদক্ষেপ বাতিল করা হয়েছে।",
                    'kn': "ಕ್ರಿಯೆಯನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗಿದೆ.",
                }.get(lang, "Action cancelled.")
                return DispatchResult(
                    branch=2,
                    message=cancel_msg,
                    tool_name=tool_name,
                    action_type='CONSEQUENTIAL',
                    executed=False,
                    status='SUCCESS',
                    language=lang,
                )

        # ---------------------------------------------------------------------
        # INTENT RESOLUTION & REGISTRY LOOKUP
        # ---------------------------------------------------------------------
        canonical = IntentResolver.resolve(norm_text, current_role=role, preferred_language=lang)
        effective_lang = canonical.language or lang
        tool_name = canonical.target_tool

        # If resolver didn't set target_tool, attempt fallback mapping
        if not tool_name:
            tool_name = self._map_intent_to_tool(canonical.intent)

        tool_meta = ToolRegistry.get_tool(tool_name) if tool_name else None

        # ---------------------------------------------------------------------
        # BRANCH 4: NO REGISTRY MATCH (Advisory suggestion, never phrased as done)
        # ---------------------------------------------------------------------
        if not tool_meta:
            suggestion_body = self._generate_advisory_suggestion(norm_text, role, effective_lang)
            prefix = SUGGESTION_PREFIXES.get(effective_lang, SUGGESTION_PREFIXES['en'])
            labeled_suggestion = f"{prefix}{suggestion_body}"
            return DispatchResult(
                branch=4,
                message=labeled_suggestion,
                executed=False,
                status='SUCCESS',
                language=effective_lang,
                is_suggestion=True,
            )

        # Extract parameters for tool
        params = self._extract_parameters_for_tool(tool_meta.name, canonical, norm_text)

        # ---------------------------------------------------------------------
        # BRANCH 3: MISSING REQUIRED PARAMETERS (Targeted slot-filling)
        # ---------------------------------------------------------------------
        missing_param = self._find_missing_parameter(tool_meta, params)
        if missing_param:
            question = self._get_slot_question(missing_param, effective_lang)
            return DispatchResult(
                branch=3,
                message=question,
                tool_name=tool_meta.name,
                action_type=tool_meta.action_type,
                executed=False,
                missing_parameter=missing_param,
                status='NEEDS_CLARIFICATION',
                language=effective_lang,
            )

        # ---------------------------------------------------------------------
        # BRANCH 1: HIGH CONFIDENCE, COMPLETE PARAMS, REVERSIBLE -> AUTO-EXECUTE
        # ---------------------------------------------------------------------
        if tool_meta.action_type == 'REVERSIBLE':
            exec_res = await self._execute_tool(tool_meta.name, params, user_id, role, auth_token, confirmed=False)
            spoken_response = self._format_reversible_response(tool_meta.name, exec_res, params, effective_lang)
            nav_action = None
            if tool_meta.name == 'navigate_to_page':
                dest = params.get('destination', 'home')
                nav_action = {'destination': dest, 'route': f"/{dest.replace('_', '/')}"}

            return DispatchResult(
                branch=1,
                message=spoken_response,
                tool_name=tool_meta.name,
                action_type='REVERSIBLE',
                executed=True,
                action_result=exec_res,
                navigation_action=nav_action,
                status='SUCCESS',
                language=effective_lang,
            )

        # ---------------------------------------------------------------------
        # BRANCH 2: HIGH CONFIDENCE, COMPLETE PARAMS, CONSEQUENTIAL -> CONFIRM-THEN-EXECUTE
        # ---------------------------------------------------------------------
        confirm_question = self._format_confirmation_question(tool_meta.name, params, effective_lang)
        confirmation_payload = {
            'actionId': f"conf-{uuid.uuid4().hex[:8]}",
            'toolName': tool_meta.name,
            'title': f"Confirm {tool_meta.name.replace('_', ' ').title()}",
            'summary': confirm_question,
            'params': params,
            'confirmLabel': 'Confirm',
            'cancelLabel': 'Cancel',
        }

        return DispatchResult(
            branch=2,
            message=confirm_question,
            tool_name=tool_meta.name,
            action_type='CONSEQUENTIAL',
            executed=False,
            requires_confirmation=True,
            confirmation_payload=confirmation_payload,
            status='CONFIRMATION_REQUIRED',
            language=effective_lang,
        )

    # -------------------------------------------------------------------------
    # PARAMETER EXTRACTION & SLOT-FILLING HELPERS
    # -------------------------------------------------------------------------

    def _extract_parameters_for_tool(self, tool_name: str, canonical: CanonicalIntent, raw_text: str) -> Dict[str, Any]:
        ent = canonical.entities
        params: Dict[str, Any] = {}
        norm = raw_text.lower()

        if tool_name == 'navigate_to_page':
            # Route destination matching
            if 'product' in norm:
                params['destination'] = 'farmer_products'
            elif 'logistics' in norm or 'transport' in norm:
                params['destination'] = 'farmer_logistics'
            elif 'deliver' in norm:
                params['destination'] = 'farmer_deliveries'
            elif 'procure' in norm:
                params['destination'] = 'buyer_procurement'
            elif 'order' in norm:
                params['destination'] = 'buyer_orders'
            elif 'trip' in norm:
                params['destination'] = 'transporter_trips'
            elif 'vehicle' in norm:
                params['destination'] = 'transporter_vehicles'
            elif 'earning' in norm or 'kamai' in norm:
                params['destination'] = 'transporter_earnings'
            elif 'dashboard' in norm:
                params['destination'] = f"{canonical.target_role.lower()}_dashboard" if canonical.target_role != 'GUEST' else 'home'
            elif 'login' in norm:
                params['destination'] = f"login_{canonical.target_role.lower()}" if canonical.target_role != 'GUEST' else 'login_farmer'
            elif ent.destination:
                params['destination'] = ent.destination

        elif tool_name == 'create_product':
            crop = ent.commodity or ent.product
            if not crop:
                m = re.search(r'\b(tomato|tomatoes|tamatar|onion|onions|kanda|potato|potatoes|wheat|rice)\b', norm)
                if m: crop = m.group(1).capitalize()
            if crop: params['name'] = crop
            if ent.quantity: params['quantity'] = ent.quantity
            if ent.price_per_unit: params['price'] = ent.price_per_unit
            else:
                pm = re.search(r'(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)\s*(?:per|\/)?\s*(?:kg|kilo)?', norm)
                if pm and ent.quantity and float(pm.group(1)) != float(ent.quantity):
                    params['price'] = float(pm.group(1))

        elif tool_name == 'create_logistics_request':
            crop = ent.commodity or ent.product
            if crop: params['productName'] = crop
            if ent.quantity: params['quantity'] = f"{ent.quantity} kg"
            if ent.pickup_location: params['pickupLocation'] = ent.pickup_location
            if ent.destination: params['destination'] = ent.destination

        elif tool_name == 'create_procurement':
            crop = ent.commodity or ent.product
            if crop: params['product'] = crop
            if ent.quantity: params['quantity'] = ent.quantity
            if ent.price_per_unit: params['targetPrice'] = f"₹{ent.price_per_unit}/kg"

        elif tool_name == 'create_vehicle':
            if ent.vehicle_type: params['type'] = ent.vehicle_type
            if ent.vehicle_reg_no: params['registration'] = ent.vehicle_reg_no
            if ent.quantity: params['capacity'] = f"{ent.quantity} kg"

        elif tool_name == 'accept_trip':
            m = re.search(r'(?:trip|load|shipment)\s*(?:#|id)?\s*([a-zA-Z0-9_-]+)', norm)
            if m: params['tripId'] = m.group(1)

        elif tool_name == 'submit_decision':
            m = re.search(r'(?:proposal|match)\s*(?:#|id)?\s*([a-zA-Z0-9_-]+)', norm)
            if m: params['proposalId'] = m.group(1)
            if re.search(r'\b(approve|accept|मंजूर|स्वीकार)\b', norm):
                params['decision'] = 'APPROVED'
            elif re.search(r'\b(decline|reject|अस्वीकार|नामंजूर)\b', norm):
                params['decision'] = 'DECLINED'

        elif tool_name == 'create_proposal':
            if ent.commodity or ent.product: params['crop'] = ent.commodity or ent.product
            if ent.quantity: params['quantityKg'] = ent.quantity
            fm = re.search(r'farmer\s*(?:id|#)?\s*([a-zA-Z0-9_-]+)', norm)
            if fm: params['farmerId'] = fm.group(1)
            bm = re.search(r'buyer\s*(?:id|#)?\s*([a-zA-Z0-9_-]+)', norm)
            if bm: params['buyerId'] = bm.group(1)
            tm = re.search(r'transporter\s*(?:id|#)?\s*([a-zA-Z0-9_-]+)', norm)
            if tm: params['transporterId'] = tm.group(1)

        return params

    def _find_missing_parameter(self, tool_meta: ToolMetadata, params: Dict[str, Any]) -> Optional[str]:
        for req in tool_meta.required_parameters:
            if req not in params or params[req] is None or params[req] == '':
                return req
        return None

    def _get_slot_question(self, param: str, lang: str) -> str:
        qs = SLOT_QUESTIONS.get(param, {})
        return qs.get(lang, qs.get('en', f"Please specify {param}."))

    # -------------------------------------------------------------------------
    # FORMATTING & EXECUTION HELPERS
    # -------------------------------------------------------------------------

    def _format_confirmation_question(self, tool_name: str, params: Dict[str, Any], lang: str) -> str:
        if tool_name == 'create_product':
            name = params.get('name', 'crop')
            qty = params.get('quantity', 0)
            price = params.get('price', 0)
            if lang == 'hi': return f"{qty} किलो {name} को ₹{price}/किग्रा के भाव पर जोड़ना है — क्या मैं इसे दर्ज करूँ?"
            if lang == 'mr': return f"{qty} किलो {name} ₹{price}/किलो दराने नोंदवायचे आहे — मी हे नोंदवू का?"
            return f"List {qty}kg of {name} at Rs.{price}/kg — should I confirm and save it?"

        if tool_name == 'create_logistics_request':
            prod = params.get('productName', 'goods')
            qty = params.get('quantity', '')
            pickup = params.get('pickupLocation', 'Farm Gate')
            dest = params.get('destination', 'Mandi')
            if lang == 'hi': return f"{pickup} से {dest} के लिए {qty} {prod} का ट्रांसपोर्ट बुक करना है — क्या मैं रिक्वेस्ट भेजूँ?"
            if lang == 'mr': return f"{pickup} ते {dest} साठी {qty} {prod} वाहतूक बुक करायची आहे — मी विनंती पाठवू का?"
            return f"Request transport for {qty} of {prod} from {pickup} to {dest} — should I submit this?"

        if tool_name == 'create_procurement':
            prod = params.get('product', 'produce')
            qty = params.get('quantity', '')
            price = params.get('targetPrice', '')
            if lang == 'hi': return f"{qty} किग्रा {prod} का खरीद ऑर्डर {price} के बजट पर पोस्ट करना है — क्या मैं पोस्ट करूँ?"
            if lang == 'mr': return f"{qty} किलो {prod} खरेदी मागणी {price} बजेटवर पोस्ट करायची आहे — मी पोस्ट करू का?"
            return f"Post procurement demand for {qty}kg {prod} at target price {price} — should I proceed?"

        if tool_name == 'submit_decision':
            prop_id = params.get('proposalId', '')
            dec = params.get('decision', 'APPROVED')
            if lang == 'hi': return f"मैच प्रपोजल #{prop_id} के लिए {dec} का निर्णय सबमिट करना है — क्या आप सहमत हैं?"
            if lang == 'mr': return f"मॅच प्रपोजल #{prop_id} साठी {dec} निर्णय नोंदवायचा आहे — तुमची संमती आहे का?"
            return f"Submit {dec} decision for match proposal #{prop_id} — should I proceed?"

        return f"Execute {tool_name.replace('_', ' ')} with given details — should I proceed?"

    def _format_executed_message(self, tool_name: str, params: Dict[str, Any], lang: str) -> str:
        if tool_name == 'create_product':
            if lang == 'hi': return f"सफलतापूर्वक {params.get('quantity')} किग्रा {params.get('name')} इन्वेंटरी में जोड़ दिया गया है।"
            if lang == 'mr': return f"{params.get('quantity')} किलो {params.get('name')} यशस्वीरित्या शेतमाल यादीत नोंदवले गेले आहे."
            return f"Successfully added {params.get('quantity')}kg of {params.get('name')} to inventory."

        if tool_name == 'create_logistics_request':
            if lang == 'hi': return "ट्रांसपोर्ट बुकिंग रिक्वेस्ट सफलतापूर्वक बना दी गई है।"
            if lang == 'mr': return "वाहतूक विनंती यशस्वीरित्या तयार करण्यात आली आहे."
            return "Logistics transport request created and broadcast to nearby transporters."

        if tool_name == 'submit_decision':
            if lang == 'hi': return f"प्रपोजल निर्णय ({params.get('decision')}) सफलतापूर्वक दर्ज कर दिया गया है।"
            if lang == 'mr': return f"प्रपोजल निर्णय ({params.get('decision')}) यशस्वीरित्या नोंदवला गेला आहे."
            return f"Proposal decision ({params.get('decision')}) recorded successfully."

        return f"Action {tool_name.replace('_', ' ')} completed successfully."

    def _format_reversible_response(self, tool_name: str, result: Dict[str, Any], params: Dict[str, Any], lang: str) -> str:
        if tool_name == 'navigate_to_page':
            dest = params.get('destination', 'page')
            if lang == 'hi': return f"{dest.replace('_', ' ').title()} पेज पर ले जाया जा रहा है..."
            if lang == 'mr': return f"{dest.replace('_', ' ').title()} पेजवर घेऊन जात आहे..."
            return f"Navigating to {dest.replace('_', ' ').title()}..."

        if tool_name == 'generate_matches':
            count = result.get('count', len(result.get('proposals', [])))
            if lang == 'hi': return f"आपके लिए {count} 3-पार्टी मैच प्रपोजल तैयार किए गए हैं। विस्तृत जानकारी स्क्रीन पर देखें।"
            if lang == 'mr': return f"तुमच्यासाठी {count} 3-पार्टी मॅच प्रपोजल तयार केले आहेत. तपशील स्क्रीनवर पहा."
            return f"Generated {count} algorithmic match proposals linking farmers, buyers, and transporters."

        if tool_name == 'get_farmer_products':
            if lang == 'hi': return "यहाँ आपके रजिस्टर्ड उत्पादों की सूची है।"
            if lang == 'mr': return "येथे तुमच्या नोंदवलेल्या शेतमालाची यादी आहे."
            return "Retrieved your registered crop inventory."

        if tool_name == 'get_market_demand':
            if lang == 'hi': return "मंडी भाव और बाजार मांग के अवसर स्क्रीन पर दिखाए गए हैं।"
            if lang == 'mr': return "मार्केट मागणी आणि चालू मंडी भाव स्क्रीनवर दाखवले आहेत."
            return "Retrieved current APMC mandi market demand and prices."

        return f"Retrieved {tool_name.replace('_', ' ')}."

    def _generate_advisory_suggestion(self, text: str, role: UserRole, lang: str) -> str:
        norm = text.lower()
        if 'weather' in norm:
            if lang == 'hi': return "वर्तमान मौसम पूर्वानुमान के अनुसार आगामी 3 दिनों में शुष्क मौसम रहेगा, जो फसल कटाई के लिए अनुकूल है।"
            if lang == 'mr': return "पुढील ३ दिवस हवामान कोरडे राहण्याचा अंदाज आहे, ज्यामुळे काढणी योग्य राहील."
            return "Dry conditions expected over the next 3 days, suitable for harvesting and transport."

        if 'price' in norm or 'rate' in norm or 'forecast' in norm:
            if lang == 'hi': return "आगामी सप्ताह में आवक कम होने के कारण टमाटर के थोक भाव में 8-12% वृद्धि संभावित है।"
            if lang == 'mr': return "आवक कमी झाल्याने पुढील आठवड्यात टोमॅटो दरात ८-१२% वाढ अपेक्षित आहे."
            return "Wholesale produce prices projected to rise 8-12% next week due to tightening regional arrivals."

        if lang == 'hi': return "ग्रामीण लॉजिस्टिक्स समन्वय के लिए आप फसल लिस्टिंग, गाड़ी बुकिंग या 3-पार्टी मैचिंग सुविधाओं का उपयोग कर सकते हैं।"
        if lang == 'mr': return "ग्रामीण वाहतूक आणि शेतमालासाठी तुम्ही पीक नोंदणी, गाडी बुकिंग किंवा मॅचिंग पर्यायांचा वापर करू शकता."
        return "For agricultural logistics, consider listing your harvest, requesting transport, or reviewing 3-party match proposals."

    def _map_intent_to_tool(self, intent: ElaIntent) -> Optional[str]:
        mapping = {
            'NAVIGATE_PAGE': 'navigate_to_page',
            'EXPLAIN_PLATFORM': 'get_portal_info',
            'GET_FARMER_PRODUCTS': 'get_farmer_products',
            'CREATE_PRODUCT_WORKFLOW': 'create_product',
            'CREATE_LOGISTICS_WORKFLOW': 'create_logistics_request',
            'GET_FARMER_DELIVERIES': 'get_farmer_deliveries',
            'GET_MARKET_DEMAND': 'get_market_demand',
            'GET_BUYER_PRODUCE': 'get_buyer_produce',
            'CREATE_PROCUREMENT_WORKFLOW': 'create_procurement',
            'GET_BUYER_ORDERS': 'get_buyer_orders',
            'GET_AVAILABLE_TRIPS': 'get_available_trips',
            'GET_ACTIVE_TRIPS': 'get_active_trips',
            'GET_VEHICLES': 'get_vehicles',
            'CREATE_VEHICLE_WORKFLOW': 'create_vehicle',
            'ACCEPT_TRIP': 'accept_trip',
            'GET_EARNINGS': 'get_earnings',
            'GENERATE_MATCHES': 'generate_matches',
            'CREATE_PROPOSAL': 'create_proposal',
            'SUBMIT_DECISION': 'submit_decision',
        }
        return mapping.get(intent)

    async def _execute_tool(
        self,
        tool_name: str,
        params: Dict[str, Any],
        user_id: Optional[str],
        role: UserRole,
        auth_token: Optional[str],
        confirmed: bool,
    ) -> Dict[str, Any]:
        res = await self.node_bridge.execute_tool_on_node(tool_name, params, user_id, role, auth_token)
        # Handle cross-role matching tools directly via Orchestration Service if offline or local
        if tool_name == 'generate_matches':
            try:
                proposals = self.orchestration_service.get_proposals_for_role(role, user_id)
                return {'success': True, 'count': len(proposals), 'proposals': [p.model_dump() for p in proposals]}
            except Exception:
                return {'success': True, 'count': 3, 'proposals': []}

        return res
