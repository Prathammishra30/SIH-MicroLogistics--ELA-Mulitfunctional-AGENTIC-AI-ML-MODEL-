# Multi-Dimensional Confidence & Natural Language Clarification Engine (Phase 4 Python Core)
from typing import List, Optional, Dict
from pydantic import BaseModel
from ai.ela.agent.state import ElaIntent, CanonicalEntities, ConfidenceScore, SupportedLanguage, UserRole


class ClarificationCheckResult(BaseModel):
    needs_clarification: bool
    missing_entities: List[str]
    clarification_question: Optional[str] = None
    confidence: ConfidenceScore


class ConfidenceEngine:
    @classmethod
    def evaluate(
        cls,
        intent: ElaIntent,
        entities: CanonicalEntities,
        raw_confidence: float,
        lang: SupportedLanguage = 'en',
        role: UserRole = 'GUEST',
    ) -> ClarificationCheckResult:
        missing: List[str] = []

        # 1. Determine Required Entities based on Intent
        if intent == 'CREATE_LOGISTICS_WORKFLOW':
            if not entities.destination:
                missing.append('destination')
            if not entities.product and not entities.quantity:
                missing.append('product_or_quantity')
        elif intent == 'CREATE_PRODUCT_WORKFLOW':
            if not entities.product:
                missing.append('product')
        elif intent == 'CREATE_PROCUREMENT_WORKFLOW':
            if not entities.product:
                missing.append('product')
            if not entities.quantity:
                missing.append('quantity')
        elif intent == 'CREATE_VEHICLE_WORKFLOW':
            if not entities.vehicle_type and not entities.vehicle_reg_no:
                missing.append('vehicle_details')

        # 2. Compute Multi-Dimensional Confidence Scores
        intent_conf = min(1.0, max(0.1, raw_confidence))
        entity_conf = 0.95 if len(missing) == 0 else max(0.4, 0.95 - len(missing) * 0.25)
        lang_conf = 0.92
        role_conf = 0.90

        overall = intent_conf * 0.4 + entity_conf * 0.35 + lang_conf * 0.15 + role_conf * 0.1

        conf = ConfidenceScore(
            intent_confidence=round(intent_conf, 2),
            entity_confidence=round(entity_conf, 2),
            language_confidence=round(lang_conf, 2),
            role_confidence=round(role_conf, 2),
            overall_confidence=round(overall, 2),
        )

        if missing:
            question = cls.generate_clarification_question(intent, missing, entities, lang)
            return ClarificationCheckResult(
                needs_clarification=True,
                missing_entities=missing,
                clarification_question=question,
                confidence=conf,
            )

        return ClarificationCheckResult(
            needs_clarification=False,
            missing_entities=[],
            confidence=conf,
        )

    @classmethod
    def generate_clarification_question(
        cls,
        intent: ElaIntent,
        missing: List[str],
        entities: CanonicalEntities,
        lang: SupportedLanguage,
    ) -> str:
        product = entities.product or 'produce'

        if intent == 'CREATE_LOGISTICS_WORKFLOW':
            if 'destination' in missing:
                questions: Dict[SupportedLanguage, str] = {
                    'en': f"Sure! Where would you like to send the {product} (e.g., Pune APMC, Mumbai) and what is the quantity?",
                    'hi': f"ज़रूर! आप {product} कहाँ भेजना चाहते हैं (जैसे पुणे मंडी, मुंबई) और कितनी मात्रा है?",
                    'mr': f"नक्कीच! तुम्ही {product} कुठे पाठवू इच्छिता (उदा. पुणे बाजार समिती, मुंबई) आणि किती प्रमाण आहे?",
                    'ta': f"நிச்சயமாக! {product} ஐ எங்கு அனுப்ப விரும்புகிறீர்கள் (எ.கா. புனே மண்டி) மற்றும் அளவு என்ன?",
                    'te': f"ఖచ్చితంగా! మీరు {product}ను ఎక్కడికి పంపాలనుకుంటున్నారు (ఉదా. పూణే మండి) మరియు పరిమాణం ఎంత?",
                    'bn': f"অবশ্যই! আপনি {product} কোথায় পাঠাতে চান (যেমন পুনে মান্ডি) এবং পরিমাণ কত?",
                    'kn': f"ಖಂಡಿತ! ನೀವು {product} ಅನ್ನು ಎಲ್ಲಿಗೆ ಕಳುಹಿಸಲು ಬಯಸುತ್ತೀರಿ (ಉದಾ. ಪುಣೆ ಮಂಡಿ) ಮತ್ತು ಪ್ರಮಾಣ ಎಷ್ಟು?",
                }
                return questions.get(lang, questions['en'])

        if intent == 'CREATE_PRODUCT_WORKFLOW' and 'product' in missing:
            questions: Dict[SupportedLanguage, str] = {
                'en': 'Which crop or produce would you like to list (e.g., Tomatoes, Onions, Wheat)?',
                'hi': 'आप कौन सी फसल या उपज जोड़ना चाहते हैं (जैसे टमाटर, प्याज, गेहूं)?',
                'mr': 'तुम्ही कोणते पीक किंवा शेतमाल नोंदवू इच्छिता (उदा. टोमॅटो, कांदा, गहू)?',
                'ta': 'நீங்கள் எந்த பயிர் அல்லது விளைபொருளை பட்டியலிட விரும்புகிறீர்கள் (எ.கா. தக்காளி, வெங்காயம், கோதுமை)?',
                'te': 'మీరు ఏ పంట లేదా ఉత్పత్తులను జాబಿತా చేయాలనుకుంటున్నారు (ఉదా. టమాటాలు, ఉల్లిపాయలు, గోధుమలు)?',
                'bn': 'আপনি কোন ফসল বা পণ্য তালিকাভুক্ত করতে চান (যেমন টমেটো, পেঁয়াজ, গম)?',
                'kn': 'ನೀವು ಯಾವ ಬೆಳೆ ಅಥವಾ ಉತ್ಪನ್ನವನ್ನು ಪಟ್ಟಿ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ (ಉದಾ. ಟೊಮೆಟೊ, ಈರುಳ್ಳಿ, ಗೋಧಿ)?',
            }
            return questions.get(lang, questions['en'])

        if intent == 'CREATE_PROCUREMENT_WORKFLOW':
            questions: Dict[SupportedLanguage, str] = {
                'en': 'What crop and quantity would you like to procure (e.g., 500 kg Tomatoes)?',
                'hi': 'आप किस फसल और कितनी मात्रा की खरीद करना चाहते हैं (जैसे 500 किलो टमाटर)?',
                'mr': 'तुम्ही कोणत्या पिकाची आणि किती प्रमाणाची खरेदी करू इच्छिता (उदा. ५०० किलो टोमॅटो)?',
                'ta': 'நீங்கள் எந்த பயிர் மற்றும் அளவை வாங்க விரும்புகிறீர்கள் (எ.கா. 500 கிலோ தக்காளி)?',
                'te': 'మీరు ఏ పంట మరియు పరిమాణాన్ని సేకరించాలనుకుంటున్నారు (ఉదా. 500 కిలోల టమాటాలు)?',
                'bn': 'আপনি কোন ফসল এবং কী পরিমাণে কিনতে চান (যেমন ৫০০ কেজি টমেটো)?',
                'kn': 'ನೀವು ಯಾವ ಬೆಳೆ ಮತ್ತು ಎಷ್ಟು ಪ್ರಮಾಣವನ್ನು ಖರೀದಿಸಲು ಬಯಸುತ್ತೀರಿ (ಉದಾ. 500 ಕೆಜಿ ಟೊಮೆಟೊ)?',
            }
            return questions.get(lang, questions['en'])

        if intent == 'CREATE_VEHICLE_WORKFLOW':
            questions: Dict[SupportedLanguage, str] = {
                'en': 'What type of vehicle (e.g., Pickup, Mini Truck) and registration number would you like to add?',
                'hi': 'आप किस प्रकार का वाहन (जैसे पिकअप, मिनी ट्रक) और गाड़ी नंबर जोड़ना चाहते हैं?',
                'mr': 'तुम्ही कोणत्या प्रकारचे वाहन (उदा. पिकअप, मिनी ट्रक) आणि वाहन क्रमांक जोडू इच्छिता?',
                'ta': 'எந்த வகையான வாகனம் (எ.கா. பிக்கப், மினி டிரக்) மற்றும் பதிவு எண்ணை சேர்க்க விரும்புகிறீர்கள்?',
                'te': 'మీరు ఏ రకమైన వాహనం এবং பதிவு எண்ணை சேர்க்க விரும்புகிறீர்கள்?',
                'bn': 'আপনি কোন ধরনের যানবাহন (যেমন পিকআপ, মিনি ট্রাক) এবং রেজিস্ট্রেশন নম্বর যোগ করতে চান?',
                'kn': 'ನೀವು ಯಾವ ರೀತಿಯ ವಾಹನ (ಉದಾ. ಪಿಕಪ್, ಮಿನಿ ಟ್ರಕ್) ಮತ್ತು ನೋಂದಣಿ ಸಂಖ್ಯೆಯನ್ನು ಸೇರಿಸಲು ಬಯಸುತ್ತೀರಿ?',
            }
            return questions.get(lang, questions['en'])

        return "Could you please provide a few more details to help me process your request?"
