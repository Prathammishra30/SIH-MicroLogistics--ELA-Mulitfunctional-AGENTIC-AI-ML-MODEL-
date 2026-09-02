# Multilingual Intent Resolver (Phase 4 Python Core)
import re
from ai.ela.agent.state import UserRole, SupportedLanguage, ElaIntent
from ai.ela.entities.extractor import EntityExtractor
from ai.ela.intent.types import CanonicalIntent


class IntentResolver:
    @classmethod
    def resolve(
        cls,
        text: str,
        current_role: UserRole = 'GUEST',
        preferred_language: SupportedLanguage = 'en',
    ) -> CanonicalIntent:
        norm = text.lower()
        entities = EntityExtractor.extract_entities(text)
        lang = cls.detect_language(text, preferred_language)

        intent: ElaIntent = 'GENERAL_HELP'
        target_role: UserRole = current_role
        confidence = 0.85

        # 1. Role Declarations & Natural Language Role Switching (Highest Priority unless combined with specific action)
        has_specific_action = bool(
            re.search(
                r'\b(bhejna|bhejo|pathvayche|send|add|जोडा|जोड़ें|भेजना|भेजने|भेजो|भेज|पाठवायचे|पाठवा|वाहतूक|kharidna|purchase|procurement|procure|deliveries|products|trips|vehicles|earnings|kamai)\b|\b(buy|purchase|procure)\s+\w+|\b(book|request|find)\s+(transport|truck|load|trips|\d+|ton|tonne|tonnes|kg|tomato|tomatoes|tamatar|produce|crop)|\btransport\s+(chahiye|request|booking|pune|mumbai|nashik)|(?:पुणे|नाशिक|मुंबई|टमाटर|कांदा|टोमॅटो|\d+\s*(?:kg|kilo|ton|टन|किलो))',
                norm,
                re.IGNORECASE,
            )
        )
        is_login_req = bool(
            re.search(
                r'login|sign in|auth|प्रवेश|नोंदणी|खाते|लॉगिन|लॉगइन|लॉग इन|लागिन|உள்நுழை|வேண்டும்|లాగిన్|লগইন|ಲಾಗಿನ್',
                norm,
                re.IGNORECASE,
            )
        )

        if re.search(
            r'(i am a farmer|i\'m a farmer|im a farmer|main farmer|main kisan|kisan hoon|shetkari aahe|मी शेतकरी|मैं किसान|நான்.*விவசாயி|விவசாயி நான்|రైతును|কৃষক|ರೈತ|actually.*farmer|switch to farmer)',
            norm,
            re.IGNORECASE,
        ):
            target_role = 'FARMER'
            if not has_specific_action:
                return CanonicalIntent(
                    intent='LOGIN_GUIDANCE' if is_login_req else 'ROLE_DECLARATION',
                    target_role=target_role,
                    language=lang,
                    entities=entities,
                    raw_text=text,
                    confidence=0.95,
                )
        elif re.search(
            r'(i am a buyer|i\'m a buyer|im a buyer|main buyer|vyapari|kharidar|मी खरेदीदार|मैं व्यापारी|வாங்குபவர்|வணிகர்|కొనుగోలుదారు|ক্রেতা|ಖರೀದಿದಾರ|actually.*buyer|switch to buyer)',
            norm,
            re.IGNORECASE,
        ):
            target_role = 'BUYER'
            if not has_specific_action:
                return CanonicalIntent(
                    intent='LOGIN_GUIDANCE' if is_login_req else 'ROLE_DECLARATION',
                    target_role=target_role,
                    language=lang,
                    entities=entities,
                    raw_text=text,
                    confidence=0.95,
                )
        elif re.search(
            r'(i am a transporter|i\'m a transporter|im a transporter|main transporter|transporter hoon|driver|मी वाहतूकदार|मैं ट्रांसपोर्टर|माझ्याकडे.*ट्रक|ट्रक आहे|उपलब्ध फेऱ्या|போக்குவரத்து|రవాణాదారు|পরিবহনকারী|ಸಾರಿಗೆದಾರ|actually.*transporter|switch to transporter|\b(?:i have|mere paas|my)\s+(?:a\s+)?(?:\d+\s*(?:ton|tonne|tonnes|kg)\s*)?(?:truck|pickup|lorry|mini truck|gadi|gaadi|वाहन|गाडी|गाड़ी|ट्रक)\b)',
            norm,
            re.IGNORECASE,
        ):
            target_role = 'TRANSPORTER'
            if not has_specific_action:
                return CanonicalIntent(
                    intent='LOGIN_GUIDANCE' if is_login_req else 'ROLE_DECLARATION',
                    target_role=target_role,
                    language=lang,
                    entities=entities,
                    raw_text=text,
                    confidence=0.95,
                )

        # 2. Explicit Role Login Queries
        if re.search(r'farmer.*(login|sign in)|किसान.*(लॉगिन|प्रवेश)|शेतकरी.*(लॉगिन|प्रवेश)|விவசாயி.*உள்நுழை|రైతు.*లాగిన్', norm, re.IGNORECASE):
            intent = 'LOGIN_GUIDANCE'
            target_role = 'FARMER'
            confidence = 0.95
        elif re.search(r'buyer.*(login|sign in)|खरीददार.*लॉगिन|खरेदीदार.*लॉगिन|வணிகர்.*உள்நுழை|கொள்முதல்|வாங்குபவர்.*உள்நுழை|కొనుగోలుదారు.*లాగిన్', norm, re.IGNORECASE):
            intent = 'LOGIN_GUIDANCE'
            target_role = 'BUYER'
            confidence = 0.95
        elif re.search(r'transporter.*(login|sign in)|वाहतूकदार.*लॉगिन|ड्राइवर.*लॉगिन|போக்குவரத்து.*உள்நுழை|రవాణాదారు.*లాగిన్', norm, re.IGNORECASE):
            intent = 'LOGIN_GUIDANCE'
            target_role = 'TRANSPORTER'
            confidence = 0.95
        elif re.search(r'help me login|login help|guide login|लॉगिन में मदद|लॉगिन मदत|लॉगिन करा', norm, re.IGNORECASE):
            intent = 'LOGIN_GUIDANCE'
            target_role = 'GUEST'
            confidence = 0.92

        # 3. Platform Explanation & Universal Guidance
        elif re.search(r'farmer.*(kya karta|benefit|faayda)|शेतकऱ्यांसाठी.*फायदा|किसानों के लिए.*फायदा', norm, re.IGNORECASE):
            intent = 'EXPLAIN_PLATFORM'
            confidence = 0.92
        elif (
            re.search(
                r'how does agriroute work|how agriroute works|what is agriroute|what can you do|what can ela do|about agriroute|एग्रीरूट कैसे काम करता है|कसे कार्य करते|फायदा होईल|அக்ரிரூட் எவ்வாறு செயல்படுகிறது|అగ్రిరూట్ ఎలా పనిచేస్తుంది',
                norm,
                re.IGNORECASE,
            )
            or re.search(
                r'(agriroute|एग्रीरूट|अ.*ग्रीरूट|அக்ரிரூட்|అగ్రిరూట్).*(work|कार्य|काम|help|मदत|मदद|फायदा|செயல்படுகிறது|பயன்படுகிறது)',
                norm,
                re.IGNORECASE,
            )
        ):
            intent = 'EXPLAIN_PLATFORM'
            confidence = 0.93
        elif re.search(r'choose portal|select portal|पोर्टल निवडा|पोर्टल चुनें|போர்ட்டலைத் தேர்வுசெய்க|పోర్టల్ ఎంచుకోండి', norm, re.IGNORECASE):
            intent = 'GENERAL_HELP'
            target_role = 'GUEST'
            confidence = 0.92

        # 4. Transporter Domain Specific Matching
        elif re.search(
            r'available trips|trips|loads|available loads|उपलब्ध भाडी|उपलब्ध फेऱ्या|फेऱ्या|भाडी|ट्रिप्स|ट्रिप|लोड|खोजें|माल शोधा|கிடைக்கும் பயணங்கள்|ట్రిప్పులు|উপলব্ধ ট্রিপ|ಲಭ್ಯವಿರುವ ಟ್ರಿಪ್ಗಳು|\b(?:i have|mere paas|माझ्याकडे|my)\s+(?:a\s+)?(?:\d+\s*(?:ton|tonne|tonnes|kg)\s*)?(?:truck|pickup|lorry|mini truck|gadi|gaadi|वाहन|गाडी|गाड़ी|ट्रक)\b',
            norm,
            re.IGNORECASE,
        ):
            intent = 'GET_AVAILABLE_TRIPS'
            target_role = 'TRANSPORTER'
            confidence = 0.95
        elif (
            re.search(
                r'my vehicles|vehicles|trucks|fleet|registered (trucks|vehicles)|माझी वाहने|वाहने|गाड्या|मेरी गाड़ियां|गाड़ियां|வாகனங்கள்|వాహనాలు|truck.*list|gaadi.*list|गाड़ी.*लिस्ट',
                norm,
                re.IGNORECASE,
            )
            and not re.search(r'\b(add|register|insert|naya|नवीन|जोडा|जोड़ें)\b', norm, re.IGNORECASE)
        ):
            intent = 'GET_VEHICLES'
            target_role = 'TRANSPORTER'
            confidence = 0.95
        elif re.search(
            r'\b(add|register)\b.*(vehicle|truck|pickup|गाडी|ट्रक|वाहन)|(gadi|gaadi|truck).*(add|जोडा|जोड़ें)',
            norm,
            re.IGNORECASE,
        ):
            intent = 'CREATE_VEHICLE_WORKFLOW'
            target_role = 'TRANSPORTER'
            confidence = 0.94
        elif re.search(r'earnings|income|payout|settlement|kamai|kamaye|earning|माझी कमाई|कमाई|उत्पन्न|பணம்|வருவாய்|ఆదాయం|উপার্জন|ಗಳಿಕೆ', norm, re.IGNORECASE):
            intent = 'GET_EARNINGS'
            target_role = 'TRANSPORTER'
            confidence = 0.95

        # 5. Buyer Domain Specific Matching
        elif re.search(
            r'(kharidna|kharidne|procurement|buy|purchase|procure|find).*(\d+|kg|ton|tonne|tonnes|mt|tomato|tomatoes|tamatar|onion|onions|wheat|potato|potatoes|vegetable|produce|crop|mal)|(tomato|tomatoes|tamatar|onion|onions|wheat|potato|potatoes|माल|फसल|उपज).*(kharidna|kharidne|खरेदी करायची|हवे आहेत|buy|purchase|procure|procurement)',
            norm,
            re.IGNORECASE,
        ):
            intent = 'CREATE_PROCUREMENT_WORKFLOW'
            target_role = 'BUYER'
            confidence = 0.94
        elif re.search(
            r'produce catalog|browse farmers|available produce|शेतमालाची यादी|शेतमाल|उपलब्ध माल|fasal dekho|किसान उपज|పంటల జాబితా|பொருட்களின் பட்டியல்|விளைபொருட்களை|விவசாயிகளின்',
            norm,
            re.IGNORECASE,
        ):
            intent = 'GET_BUYER_PRODUCE'
            target_role = 'BUYER'
            confidence = 0.95
        elif re.search(r'buyer orders|my orders|track orders|माझ्या ऑर्डर्स|ऑर्डर्स|खरीद ऑर्डर|order status|ஆர்டர்கள்|ఆర్డర్లు', norm, re.IGNORECASE):
            intent = 'GET_BUYER_ORDERS'
            target_role = 'BUYER'
            confidence = 0.95

        # 6. ML Intelligence Intents
        elif re.search(r'predict.*demand|demand.*(forecast|prediction|bhavishya|अंदाज)|मागणी अंदाज|मार्केट अंदाज', norm, re.IGNORECASE):
            intent = 'GET_MARKET_DEMAND'
            confidence = 0.92
        elif re.search(r'price.*(forecast|prediction|bhavishya|अंदाज)|भाव अंदाज|भाव काय|expected price|rate prediction|expected market price', norm, re.IGNORECASE):
            intent = 'GET_MARKET_DEMAND'
            confidence = 0.91
        elif re.search(r'eta|arrival time|delivery time|kab tak|पोहोचेल|ఎప్పుడు చేరుతుంది|எப்போது வரும்', norm, re.IGNORECASE):
            intent = 'GET_FARMER_DELIVERIES'
            confidence = 0.90
        elif re.search(r'\b(recommend\s+(?:crop|crop\s+to\s+grow|what\s+to\s+grow|produce\s+to\s+grow)|kya\s+(?:ugaye|ugana|bechna|kharidna)|best\s+crop|best\s+load|काय\s+पिकवावे|काय\s+विकावे)\b', norm, re.IGNORECASE):
            intent = 'GET_MARKET_DEMAND'
            confidence = 0.88

        # 7. Farmer Domain Intents
        elif (
            re.search(
                r'\b(?:i have|mere paas|माझ्याकडे|we have|got)\b.*(?:\d+\s*(?:kg|ton|quintal|किलो|टन))?.*(?:tomato|tomatoes|tamatar|onion|onions|potato|potatoes|wheat|rice|produce|crop|mal|fasal|फसल|टमाटर|कांदा|टोमॅटो|आलू|बटाटा|गहू|गेहूं)',
                norm,
                re.IGNORECASE,
            )
            or (
                entities.commodity
                and entities.quantity
                and not re.search(r'\b(?:buy|purchase|procure|खरीद|हवे|order)\b', norm, re.IGNORECASE)
            )
        ):
            intent = 'CREATE_LOGISTICS_WORKFLOW'
            target_role = 'FARMER'
            confidence = 0.94
        elif re.search(
            r'(add|register|list).*(tomato|onion|potato|wheat|rice|produce|crop|mal|fasal|फसल|टमाटर|कांदा|बटाटा|गहू|गेहूँ|भाजीपाला)|(tomato|onion|potato|wheat|rice|टमाटर|कांदा|टोमॅटो|उत्पादन|पीक|crop|fasal|फसल).*(add|जोडा|जोड़ें|bechna|विकायचे)',
            norm,
            re.IGNORECASE,
        ):
            intent = 'CREATE_PRODUCT_WORKFLOW'
            target_role = 'FARMER'
            confidence = 0.94
        elif re.search(
            r'my products|products|crops|उत्पाद|मेरी फसल|मेरे उत्पाद|माझी पिके|माझी उत्पादने|उत्पादने|mere products|fasal dikhao|sabhi fasal|sab fasal|fasal.*product|sab product|பொருட்கள்|உత్పత్తులు|పంటలు|পণ্য|ফসল|ಉತ್ಪನ್ನಗಳು|ಬೆಳೆಗಳು',
            norm,
            re.IGNORECASE,
        ):
            intent = 'GET_FARMER_PRODUCTS'
            target_role = 'FARMER'
            confidence = 0.95
        elif re.search(
            r'(bhejna|bhejo|bhejne|pathvayche|pathva|transport chahiye|gaadi chahiye|truck chahiye|send|transport|move|dispatch|सुरू|वाहतूक|पाठवायचे|पाठवा|भेजना|भेजने|भेजो|भेज|கொண்டு\s*செல்ல|அனுப்ப|రవాణా|పంపాలి|পাঠাতে|পাঠানো|ಸಾಗಿಸಬೇಕಾಗಿದೆ|ರವಾನಿಸಲು).*(pune|mumbai|nashik|mandi|bazar|tomato|onion|wheat|crop|mal|produce|गाडी|ट्रक|टमाटर|कांदा|टोमॅटो|शेतमाल|तக்காளி|టమాటాలు|টমেটো|ಟೊಮೆಟೊ)|(pune|mumbai|nashik|पुणे|मुंबई|नाशिक|tomato|onion|tamatar|टमाटर|टोमॅटो|தக்காளி|టమాటాలు|টমেটো|ಟೊಮೆಟೊ|\d+\s*(?:kg|kilo|ton|टन|किलो|கிலோ|కేజీలు|কেজি|ಕೆಜಿ)).*(bhejna|bhejo|bhejne|pathvayche|pathva|send|transport|move|ट्रक|गाडी|वाहतूक|पाठवायचे|भेजना|भेजने|भेजो|भेज|கொண்டு\s*செல்ல|రవాణా|পাঠাতে|ಸಾಗಿಸ)|request transport|book truck|(?:fast|fastest|quickest|sasta|cheapest|jaldi|urgent|safe|safest|surakshit|swast|lavkar|kam kharch|खर्च\s*कम|कम\s*खर्च|कमी\s*खर्च)\s+(?:option|truck|gadi|gaadi|service|do|chahiye|kara|dyacha|rakhna)|(?:fast|fastest|sasta|cheapest|jaldi|urgent)\s+option|\b(?:वाहतूक\s*करायची|वाहतूक\s*पाहिजे|ट्रान्सपोर्ट\s*पाहिजे|போக்குவரத்து\s*வேண்டும்|రవాణా\s*కావాలి|পরিবহন\s*চাই|ಸಾರಿಗೆ\s*ಬೇಕು)\b|replan|re-plan|गाड़ी उपलब्ध नहीं|गाडी उपलब्ध नाही|दूसरा विकल्प|दुसरा पर्याय|alternative vehicle|change truck|change vehicle|truck unavailable|vehicle unavailable',
            norm,
            re.IGNORECASE,
        ):
            intent = 'CREATE_LOGISTICS_WORKFLOW'
            target_role = 'FARMER'
            confidence = 0.93
        elif re.search(
            r'deliveries|delivery|shipment|shipments|meri shipments|माझी डिलिव्हरी|डिलिव्हरी तपासा|चालू डिलिव्हरी|डिलिव्हरी|डिलीवरी|shipment status|track delivery|விநியோக|விநியோகம்|விநியோகங்களை|டெலிவரி|డెలివరీ|డెలివరీలు|ಡೆಲಿವರಿ|ಡಾಲಿವರಿ',
            norm,
            re.IGNORECASE,
        ):
            intent = 'GET_FARMER_DELIVERIES'
            target_role = 'FARMER'
            confidence = 0.94
        elif re.search(r'market demand|mandi|market|बाजार मागणी|मार्केट|मंडी भाव|demand dikhao|மந்தை தேவை|சந்தை தேவை|మార్కెట్ డిమాండ్|বাজার চাহিদা|ಮಾರುಕಟ್ಟೆ|ಬೇಡಿಕೆ', norm, re.IGNORECASE):
            intent = 'GET_MARKET_DEMAND'
            confidence = 0.92

        return CanonicalIntent(
            intent=intent,
            target_role=target_role,
            language=lang,
            entities=entities,
            raw_text=text,
            confidence=confidence,
        )

    @classmethod
    def detect_language(cls, text: str, fallback: SupportedLanguage = 'en') -> SupportedLanguage:
        from ai.ela.language.detector import detect_language_script
        code, _ = detect_language_script(text)
        if code in ['en', 'hi', 'mr', 'ta', 'te', 'bn', 'kn']:
            return code  # type: ignore
        return fallback
