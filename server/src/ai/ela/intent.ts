// Canonical Intent Model & Resolution Pipeline (Phase 4 Enterprise Core)
// Unifies multilingual representations into single internal canonical intent structures

import type { UserRole, SupportedLanguage, ElaIntent } from '../ela.types.js';
import { EntityExtractor, type CanonicalEntities } from './entities.js';

export interface CanonicalIntent {
  intent: ElaIntent;
  targetRole: UserRole;
  language: SupportedLanguage;
  entities: CanonicalEntities;
  rawText: string;
  confidence: number;
}

export class IntentResolver {
  public static resolve(
    text: string,
    currentRole: UserRole,
    preferredLanguage: SupportedLanguage = 'en'
  ): CanonicalIntent {
    const norm = text.toLowerCase();
    const entities = EntityExtractor.extractEntities(text);
    const lang = this.detectLanguage(text, preferredLanguage);

    let intent: ElaIntent = 'GENERAL_HELP';
    let targetRole: UserRole = currentRole;
    let confidence = 0.85;

    // 1. Role Declarations & Natural Language Role Switching (Highest Priority)
    const isLoginReq =
      /login|sign in|auth|प्रवेश|नोंदणी|खाते|लॉगिन|लॉगइन|लॉग इन|लागिन|உள்நுழைய|வேண்டும்|లాగిన్|লগইন|ಲಾಗಿನ್/i.test(
        norm
      );

    if (
      /(i am a farmer|i'm a farmer|im a farmer|main farmer|main kisan|kisan hoon|shetkari aahe|मी शेतकरी|मैं किसान|நான்.*விவசாயி|விவசாயி நான்|రైతును|কৃষক|ರೈತ|actually.*farmer|switch to farmer)/i.test(
        norm
      )
    ) {
      targetRole = 'FARMER';
      intent = isLoginReq ? 'LOGIN_GUIDANCE' : 'ROLE_DECLARATION';
      confidence = 0.95;
    } else if (
      /(i am a buyer|i'm a buyer|im a buyer|main buyer|vyapari|kharidar|मी खरेदीदार|मैं व्यापारी|வாங்குபவர்|வணிகர்|కొనుగోలుదారు|ক্রেতা|ಖರೀದಿದಾರ|actually.*buyer|switch to buyer)/i.test(
        norm
      )
    ) {
      targetRole = 'BUYER';
      intent = isLoginReq ? 'LOGIN_GUIDANCE' : 'ROLE_DECLARATION';
      confidence = 0.95;
    } else if (
      /(i am a transporter|i'm a transporter|im a transporter|main transporter|transporter hoon|driver|मी वाहतूकदार|मैं ट्रांसपोर्टर|போக்குவரத்து|రవాణాదారు|পরিবহনকারী|ಸಾರಿಗೆದಾರ|actually.*transporter|switch to transporter)/i.test(
        norm
      )
    ) {
      targetRole = 'TRANSPORTER';
      intent = isLoginReq ? 'LOGIN_GUIDANCE' : 'ROLE_DECLARATION';
      confidence = 0.95;
    }

    // 2. Explicit Role Login Queries
    else if (/farmer.*(login|sign in)|किसान.*(लॉगिन|प्रवेश)|शेतकरी.*(लॉगिन|प्रवेश)|விவசாயி.*உள்நுழைவு|రైతు.*లాగిన్/i.test(norm)) {
      intent = 'LOGIN_GUIDANCE';
      targetRole = 'FARMER';
      confidence = 0.95;
    } else if (/buyer.*(login|sign in)|खरीददार.*लॉगिन|खरेदीदार.*लॉगिन|வணிகர்.*உள்நுழைவு|கொள்முதல்|வாங்குபவர்.*உள்நுழை|కొనుగోలుదారు.*లాగిన్/i.test(norm)) {
      intent = 'LOGIN_GUIDANCE';
      targetRole = 'BUYER';
      confidence = 0.95;
    } else if (/transporter.*(login|sign in)|वाहतूकदार.*लॉगिन|ड्राइवर.*लॉगिन|போக்குவரத்து.*உள்நுழைவு|రవాణాదారు.*లాగిన్/i.test(norm)) {
      intent = 'LOGIN_GUIDANCE';
      targetRole = 'TRANSPORTER';
      confidence = 0.95;
    } else if (/help me login|login help|guide login|लॉगिन में मदद|लॉगिन मदत|लॉगिन करा/i.test(norm)) {
      intent = 'LOGIN_GUIDANCE';
      targetRole = 'GUEST';
      confidence = 0.92;
    }

    // 3. Platform Explanation & Universal Guidance
    else if (/farmer.*(kya karta|benefit|faayda)|शेतकऱ्यांसाठी.*फायदा|किसानों के लिए.*फायदा/i.test(norm)) {
      intent = 'EXPLAIN_PLATFORM';
      confidence = 0.92;
    } else if (
      /how does agriroute work|how agriroute works|what is agriroute|what can you do|what can ela do|about agriroute|एग्रीरूट कैसे काम करता है|कसे कार्य करते|फायदा होईल|அக்ரிரூட் எவ்வாறு செயல்படுகிறது|అగ్రిరూట్ ఎలా పనిచేస్తుంది/i.test(
        norm
      ) ||
      /(agriroute|एग्रीरूट|अ.*ग्रीरूट|அக்ரிரூட்|అగ్రిరూట్).*(work|कार्य|काम|help|मदत|मदद|फायदा|செயல்படுகிறது|பயன்படுகிறது)/i.test(
        norm
      )
    ) {
      intent = 'EXPLAIN_PLATFORM';
      confidence = 0.93;
    } else if (/choose portal|select portal|पोर्टल निवडा|पोर्टल चुनें|போர்ட்டலைத் தேர்வுசெய்க|పోర్టల్ ఎంచుకోండి/i.test(norm)) {
      intent = 'GENERAL_HELP';
      targetRole = 'GUEST';
      confidence = 0.92;
    }

    // 4. ML Intelligence Intents
    else if (/predict.*demand|demand.*(forecast|prediction|bhavishya|अंदाज)|मागणी अंदाज|मार्केट अंदाज/i.test(norm)) {
      intent = 'GET_MARKET_DEMAND';
      confidence = 0.92;
    } else if (/price.*(forecast|prediction|bhavishya|अंदाज)|भाव अंदाज|भाव काय|expected price|rate prediction|expected market price/i.test(norm)) {
      intent = 'GET_MARKET_DEMAND';
      confidence = 0.91;
    } else if (/eta|arrival time|delivery time|kab tak|पोहोचेल|ఎప్పుడు చేరుతుంది|எப்போது வரும்/i.test(norm)) {
      intent = 'GET_FARMER_DELIVERIES';
      confidence = 0.9;
    } else if (/recommend|kya (ugana|bechna|kharidna)|best crop|best load|काय पिकवावे|काय विकावे/i.test(norm)) {
      intent = 'GET_MARKET_DEMAND';
      confidence = 0.88;
    }

    // 5. Farmer Domain Intents
    else if (
      /(add|register|list).*(tomato|onion|potato|wheat|rice|produce|crop|mal|fasal|फसल|टमाटर|कांदा|बटाटा|गहू|गेहूँ|भाजीपाला)|(tomato|onion|potato|wheat|rice|टमाटर|कांदा|टोमॅटो|उत्पादन|पीक|crop|fasal|फसल).*(add|जोडा|जोड़ें|bechna|विकायचे)/i.test(
        norm
      )
    ) {
      intent = 'CREATE_PRODUCT_WORKFLOW';
      targetRole = 'FARMER';
      confidence = 0.94;
    } else if (
      /my products|products|crops|उत्पाद|मेरी फसल|मेरे उत्पाद|माझी पिके|माझी उत्पादने|उत्पादने|mere products|fasal dikhao|sabhi fasal|sab fasal|fasal.*product|sab product|பொருட்கள்|உత్పత్తులు|పంటలు|পণ্য|ফসল|ಉತ್ಪನ್ನಗಳು|ಬೆಳೆಗಳು/i.test(
        norm
      )
    ) {
      intent = 'GET_FARMER_PRODUCTS';
      targetRole = 'FARMER';
      confidence = 0.95;
    } else if (
      /(bhejna|bhejo|pathvayche|transport chahiye|gaadi chahiye|truck chahiye|send|transport).*(pune|mumbai|nashik|mandi|bazar|tomato|onion|wheat|crop|mal|produce|गाडी|ट्रक|टमाटर|कांदा)|(pune|mumbai|nashik|पुणे|मुंबई|tomato|onion).*(bhejna|bhejo|pathvayche|ट्रक|गाडी)|request transport|book truck/i.test(
        norm
      )
    ) {
      intent = 'CREATE_LOGISTICS_WORKFLOW';
      targetRole = 'FARMER';
      confidence = 0.93;
    } else if (
      /deliveries|delivery|shipment|shipments|meri shipments|माझी डिलिव्हरी|डिलिव्हरी तपासा|चालू डिलिव्हरी|डिलिव्हरी|डिलीवरी|shipment status|track delivery|விநியோக|விநியோகம்|விநியோகங்களை|டெலிவரி|డెలివరీ|డెలివరీలు|ಡೆಲಿವರಿ|ಡেলিভারಿ/i.test(
        norm
      )
    ) {
      intent = 'GET_FARMER_DELIVERIES';
      targetRole = 'FARMER';
      confidence = 0.94;
    } else if (/market demand|mandi|market|बाजार मागणी|मार्केट|मंडी भाव|demand dikhao|மந்தை தேவை|சந்தை தேவை|మార్కెట్ డిమాండ్|বাজার চাহিদা|ಮಾರುಕಟ್ಟೆ|ಬೇಡಿಕೆ/i.test(norm)) {
      intent = 'GET_MARKET_DEMAND';
      confidence = 0.92;
    }

    // 6. Buyer Domain Intents
    else if (
      /(kharidna|kharidne|procurement|buy|purchase).*(\d+|kg|ton|mt|tomato|tomatoes|onion|onions|wheat|potato|potatoes|vegetable|produce|crop|mal)|(tomato|tomatoes|onion|onions|wheat|potato|potatoes|माल|फसल|उपज).*(kharidna|kharidne|खरेदी करायची|हवे आहेत|buy|purchase)/i.test(
        norm
      )
    ) {
      intent = 'CREATE_PROCUREMENT_WORKFLOW';
      targetRole = 'BUYER';
      confidence = 0.94;
    } else if (
      /produce catalog|browse farmers|available produce|शेतमालाची यादी|शेतमाल|उपलब्ध माल|fasal dekho|किसान उपज|పంటల జాబితా|பொருட்களின் பட்டியல்|விளைபொருட்களை|விவசாயிகளின்/i.test(
        norm
      )
    ) {
      intent = 'GET_BUYER_PRODUCE';
      targetRole = 'BUYER';
      confidence = 0.95;
    } else if (/buyer orders|my orders|track orders|माझ्या ऑर्डर्स|ऑर्डर्स|खरीद ऑर्डर|order status|ஆர்டர்கள்|ఆర్డర్లు/i.test(norm)) {
      intent = 'GET_BUYER_ORDERS';
      targetRole = 'BUYER';
      confidence = 0.95;
    }

    // 7. Transporter Domain Intents
    else if (
      /my vehicles|vehicles|trucks|fleet|registered (trucks|vehicles)|माझी वाहने|वाहने|गाड्या|मेरी गाड़ियां|गाड़ियां|வாகனங்கள்|வாహనాలు|truck.*list|gaadi.*list|गाड़ी.*लिस्ट/i.test(
        norm
      ) &&
      !/\b(add|insert|naya|नवीन|जोडा|जोड़ें)\b/i.test(norm)
    ) {
      intent = 'GET_VEHICLES';
      targetRole = 'TRANSPORTER';
      confidence = 0.95;
    } else if (
      /\b(add|register)\b.*(vehicle|truck|pickup|गाडी|ट्रक|वाहन)|(gadi|gaadi|truck).*(add|जोडा|जोड़ें)/i.test(norm)
    ) {
      intent = 'CREATE_VEHICLE_WORKFLOW';
      targetRole = 'TRANSPORTER';
      confidence = 0.93;
    } else if (/available trips|find loads|loads|उपलब्ध फेऱ्या|फेऱ्या|ट्रिप शोधा|भाड़ा ढूंढो|loads available|ట్రిప్పు|ట్రిప్స్|பயணங்கள்|nearby loads/i.test(norm)) {
      intent = 'GET_AVAILABLE_TRIPS';
      targetRole = 'TRANSPORTER';
      confidence = 0.95;
    } else if (/active trips|current trips|सक्रिय फेऱ्या|चालू ट्रिप्स|active shipments|ऑनगोइंग फेऱ्या|నడుస్తున్న ట్రిప్పులు/i.test(norm)) {
      intent = 'GET_ACTIVE_TRIPS';
      targetRole = 'TRANSPORTER';
      confidence = 0.94;
    } else if (
      /earnings|income|revenue|payout|कमाई|कमवा|माझी कमाई|मेरी कमाई|வருமானம்|ఆదాయం|kamai|kamai.*kitna|total kamai/i.test(
        norm
      )
    ) {
      intent = 'GET_EARNINGS';
      targetRole = 'TRANSPORTER';
      confidence = 0.95;
    }

    return {
      intent,
      targetRole,
      language: lang,
      entities,
      rawText: text,
      confidence,
    };
  }

  private static detectLanguage(text: string, fallback: SupportedLanguage): SupportedLanguage {
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu
    if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'; // Kannada

    if (/[\u0900-\u097F]/.test(text)) {
      if (/आहे|नाही|कसे|माझे|माझा|माझी|पाहिजे|करा|दाखवा|तपासा|शेतकरी|फेऱ्या|पिके|उत्पादने|वाहने|खरेदीदार|वाहतूकदार/.test(text)) {
        return 'mr';
      }
      return 'hi';
    }

    return fallback;
  }
}
