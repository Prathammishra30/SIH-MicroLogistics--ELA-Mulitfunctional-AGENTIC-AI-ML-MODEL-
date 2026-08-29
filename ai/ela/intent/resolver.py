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
                r'\b(bhejna|bhejo|pathvayche|send|add|जोडा|जोड़ें|kharidna|purchase|deliveries|products|trips|vehicles|earnings|kamai)\b|\b(buy|purchase)\s+\w+|\b(book|request|find)\s+(transport|truck|load|trips)|\btransport\s+(chahiye|request|booking|pune|mumbai|nashik)',
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
            r'(i am a transporter|i\'m a transporter|im a transporter|main transporter|transporter hoon|driver|मी वाहतूकदार|मैं ट्रांसपोर्टर|போக்குவரத்து|రவாణాదారు|পরিবহনকারী|ಸಾರಿಗೆದಾರ|actually.*transporter|switch to transporter)',
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
        elif re.search(r'transporter.*(login|sign in)|वाहतूकदार.*लॉगिन|ड्राइवर.*लॉगिन|போக்குவரத்து.*உள்நுழை|రவாణాదారు.*లాగిన్', norm, re.IGNORECASE):
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

        # 4. ML Intelligence Intents
        elif re.search(r'predict.*demand|demand.*(forecast|prediction|bhavishya|अंदाज)|मागणी अंदाज|मार्केट अंदाज', norm, re.IGNORECASE):
            intent = 'GET_MARKET_DEMAND'
            confidence = 0.92
        elif re.search(r'price.*(forecast|prediction|bhavishya|अंदाज)|भाव अंदाज|भाव काय|expected price|rate prediction|expected market price', norm, re.IGNORECASE):
            intent = 'GET_MARKET_DEMAND'
            confidence = 0.91
        elif re.search(r'eta|arrival time|delivery time|kab tak|पोहोचेल|ఎప్పుడు చేరుతుంది|எப்போது வரும்', norm, re.IGNORECASE):
            intent = 'GET_FARMER_DELIVERIES'
            confidence = 0.90
        elif re.search(r'recommend|kya (ugana|bechna|kharidna)|best crop|best load|काय पिकवावे|काय विकावे', norm, re.IGNORECASE):
            intent = 'GET_MARKET_DEMAND'
            confidence = 0.88

        # 5. Farmer Domain Intents
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
            r'(bhejna|bhejo|pathvayche|transport chahiye|gaadi chahiye|truck chahiye|send|transport).*(pune|mumbai|nashik|mandi|bazar|tomato|onion|wheat|crop|mal|produce|गाडी|ट्रक|टमाटर|कांदा)|(pune|mumbai|nashik|पुणे|मुंबई|tomato|onion|tamatar).*(bhejna|bhejo|pathvayche|ट्रक|गाडी)|request transport|book truck',
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

        # 6. Buyer Domain Intents
        elif re.search(
            r'(kharidna|kharidne|procurement|buy|purchase).*(\d+|kg|ton|mt|tomato|tomatoes|tamatar|onion|onions|wheat|potato|potatoes|vegetable|produce|crop|mal)|(tomato|tomatoes|tamatar|onion|onions|wheat|potato|potatoes|माल|फसल|उपज).*(kharidna|kharidne|खरेदी करायची|हवे आहेत|buy|purchase)',
            norm,
            re.IGNORECASE,
        ):
            intent = 'CREATE_PROCUREMENT_WORKFLOW'
            target_role = 'BUYER'
            confidence = 0.94
        elif re.search(
            r'produce catalog|browse farmers|available produce|शेतमालाची यादी|शेतमाल|उपलब्ध माल|fasal dekho|किसान उपज|పంటల జాబಿತಾ|பொருட்களின் பட்டியல்|விளைபொருட்களை|விவசாயிகளின்',
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

        # 7. Transporter Domain Intents
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
        elif re.search(
            r'available trips|trips|loads|available loads|उपलब्ध भाडी|ट्रिप्स|ट्रिप|लोड|खोजें|माल शोधा|கிடைக்கும் பயணங்கள்|ట్రిప్పులు|উপলব্ধ ট্রিপ|ಲಭ್ಯವಿರುವ ಟ್ರಿಪ್ಗಳು',
            norm,
            re.IGNORECASE,
        ):
            intent = 'GET_AVAILABLE_TRIPS'
            target_role = 'TRANSPORTER'
            confidence = 0.95
        elif re.search(r'earnings|income|payout|settlement|kamai|kamaye|earning|माझी कमाई|कमाई|उत्पन्न|பணம்|வருவாய்|ఆదాయం|উপার্জন|ಗಳಿಕೆ', norm, re.IGNORECASE):
            intent = 'GET_EARNINGS'
            target_role = 'TRANSPORTER'
            confidence = 0.95

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
        # Script checks
        for ch in text:
            code = ord(ch)
            if 0x0900 <= code <= 0x097F:
                if any(m_word in text.lower() for m_word in ['आहे', 'करा', 'पाहिजे', 'नाही', 'शेतकरी', 'भाडे', 'बाजार']):
                    return 'mr'
                return 'hi'
            elif 0x0B80 <= code <= 0x0BFF:
                return 'ta'
            elif 0x0C00 <= code <= 0x0C7F:
                return 'te'
            elif 0x0980 <= code <= 0x09FF:
                return 'bn'
            elif 0x0C80 <= code <= 0x0CFF:
                return 'kn'

        # Latin Hinglish/Marathi checks
        norm = text.lower()
        if any(w in norm.split() for w in ['kisan', 'fasal', 'karna', 'chahiye', 'bhejna', 'mandi', 'bhav', 'kya', 'hai', 'kaise', 'tamatar', 'hoon']):
            return 'hi'
        if any(w in norm.split() for w in ['shetkari', 'aahe', 'vikayche', 'pahije', 'bhad', 'pathva']):
            return 'mr'

        return fallback
