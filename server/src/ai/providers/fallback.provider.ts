// Fallback Rule-Based Multilingual Intent & Tool Execution Provider
// RuralFlow ELA Engine — Zero-latency deterministic parser for 7 Indian Languages

import type { ILlmProvider, LlmCompletionOptions, LlmCompletionResult } from './llm.interface.js';
import type { ElaIntent, ElaToolCall, SupportedLanguage, UserRole } from '../ela.types.js';

interface IntentRule {
  intent: ElaIntent;
  targetTool?: string;
  targetDestination?: string;
  patterns: RegExp[];
  roleFilter?: UserRole[];
  responseKey: string;
}

export class FallbackLlmProvider implements ILlmProvider {
  public readonly name = 'RuralFlow Native Multilingual Engine';

  public isAvailable(): boolean {
    return true;
  }

  private rules: IntentRule[] = [
    // --- AUTH & COMMON ---
    {
      intent: 'LOGIN_GUIDANCE',
      targetTool: 'navigate_to_page',
      targetDestination: 'login_farmer',
      patterns: [
        /farmer.*(login|sign in|auth)|किसान.*(लॉगिन|प्रवेश)|शेतकरी.*(लॉगिन|प्रवेश)|kisan.*login|shetkari.*login|விவசாயி.*உள்நுழைவு|రైతు.*లాగిన్/i,
      ],
      responseKey: 'login_farmer',
    },
    {
      intent: 'LOGIN_GUIDANCE',
      targetTool: 'navigate_to_page',
      targetDestination: 'login_buyer',
      patterns: [
        /buyer.*(login|sign in|auth)|खरीददार.*(लॉगिन|प्रवेश)|खरेदीदार.*(लॉगिन|प्रवेश)|kharidar.*login|வணிகர்.*உள்நுழைவு|కొనుగోలుదారు.*లాగిన్/i,
      ],
      responseKey: 'login_buyer',
    },
    {
      intent: 'LOGIN_GUIDANCE',
      targetTool: 'navigate_to_page',
      targetDestination: 'login_transporter',
      patterns: [
        /transporter.*(login|sign in|auth)|ड्राइवर.*लॉगिन|वाहतूकदार.*(लॉगिन|प्रवेश)|transporter.*login|driver.*login|போக்குவரத்து.*உள்நுழைவு|రవాణాదారు.*లాగిన్/i,
      ],
      responseKey: 'login_transporter',
    },
    {
      intent: 'LOGIN_GUIDANCE',
      patterns: [
        /^(login|sign in|log in|प्रवेश करा|लॉगिन|உள்நுழைக|లాగిన్)/i,
      ],
      responseKey: 'login_general',
    },
    {
      intent: 'NAVIGATE_HOME',
      targetTool: 'navigate_to_page',
      targetDestination: 'home',
      patterns: [
        /home|main page|मुख्य पृष्ठ|मुख्य पान|घर|హోమ్|முகப்பு|হোম/i,
      ],
      responseKey: 'home',
    },

    // --- FARMER INTENTS ---
    {
      intent: 'OPEN_ADD_PRODUCT',
      targetTool: 'navigate_to_page',
      targetDestination: 'farmer_add_product',
      patterns: [
        /add product|new product|add crop|नया उत्पाद|नया माल|नवीन पीक|नवे उत्पादन|product add|crop add|பயிர் சேர்க்க|பொருளை சேர்க்க|పంట జోడించండి|ఉత్పత్తిని జోడించండి/i,
      ],
      roleFilter: ['FARMER', 'ADMIN'],
      responseKey: 'farmer_add_product',
    },
    {
      intent: 'OPEN_FARMER_PRODUCTS',
      targetTool: 'navigate_to_page',
      targetDestination: 'farmer_products',
      patterns: [
        /my products|products|crops|उत्पाद|मेरी फसल|मेरे उत्पाद|माझी पिके|माझी उत्पादने|उत्पादने|mere products|fasal dikhao|பொருட்கள்|பொருட்கள்|ఉత్పత్తులు|పంటలు|পণ্য|ফসল|ಉತ್ಪನ್ನಗಳು|ಬೆಳೆಗಳು/i,
      ],
      roleFilter: ['FARMER', 'ADMIN'],
      responseKey: 'farmer_products',
    },
    {
      intent: 'OPEN_LOGISTICS_REQUEST',
      targetTool: 'navigate_to_page',
      targetDestination: 'farmer_logistics',
      patterns: [
        /logistics request|request transport|book truck|gaadi chahiye|वाहतूक मागणी|गाडी पाहिजे|ट्रक बुक|transport chahiye|రవాణా అభ్యర్థన|போக்குவரத்து கோரிக்கை/i,
      ],
      roleFilter: ['FARMER', 'ADMIN'],
      responseKey: 'farmer_logistics',
    },
    {
      intent: 'OPEN_MARKET_DEMAND',
      targetTool: 'navigate_to_page',
      targetDestination: 'farmer_markets',
      patterns: [
        /market demand|mandi|market|बाजार मागणी|मार्केट|मंडी भाव|demand dikhao|மந்தை தேவை|சந்தை தேவை|మార్కెట్ డిమాండ్|বাজার চাহিদা/i,
      ],
      roleFilter: ['FARMER', 'ADMIN'],
      responseKey: 'farmer_markets',
    },
    {
      intent: 'OPEN_DELIVERIES',
      targetTool: 'navigate_to_page',
      targetDestination: 'farmer_deliveries',
      patterns: [
        /deliveries|delivery|shipment|shipments|meri shipments|माझी डिलिव्हरी|डिलिव्हरी तपासा|डिलिव्हरी|डिलीवरी|shipment status|track delivery|விநியோக|விநியோகம்|డెలివరీ|డెలివరీలు/i,
      ],
      roleFilter: ['FARMER', 'ADMIN'],
      responseKey: 'farmer_deliveries',
    },
    {
      intent: 'OPEN_FARMER_DASHBOARD',
      targetTool: 'navigate_to_page',
      targetDestination: 'farmer_dashboard',
      patterns: [
        /farmer dashboard|kisan dashboard|शेतकरी डॅशबोर्ड|किसान डैशबोर्ड/i,
      ],
      roleFilter: ['FARMER', 'ADMIN'],
      responseKey: 'farmer_dashboard',
    },

    // --- BUYER INTENTS ---
    {
      intent: 'OPEN_POST_PROCUREMENT',
      targetTool: 'navigate_to_page',
      targetDestination: 'buyer_procurement',
      patterns: [
        /post procurement|create procurement|buy produce|procurement demand|खरीद मांग|मागणी नोंदवा|procurement form|खरीदी ऑर्डर|కొనుగోలు అభ్యర్థన|கொள்முதல் கோரிக்கை|கொள்முதல்/i,
      ],
      roleFilter: ['BUYER', 'ADMIN'],
      responseKey: 'buyer_procurement',
    },
    {
      intent: 'OPEN_PRODUCE_CATALOG',
      targetTool: 'navigate_to_page',
      targetDestination: 'buyer_produce',
      patterns: [
        /produce catalog|browse farmers|available produce|शेतमालाची यादी|शेतमाल|उपलब्ध माल|fasal dekho|किसान उपज|పంటల జాబితా|பொருட்களின் பட்டியல்/i,
      ],
      roleFilter: ['BUYER', 'ADMIN'],
      responseKey: 'buyer_produce',
    },
    {
      intent: 'OPEN_BUYER_ORDERS',
      targetTool: 'navigate_to_page',
      targetDestination: 'buyer_orders',
      patterns: [
        /buyer orders|my orders|track orders|माझ्या ऑर्डर्स|ऑर्डर्स|खरीद ऑर्डर|order status|ஆர்டர்கள்|ఆర్డర్లు/i,
      ],
      roleFilter: ['BUYER', 'ADMIN'],
      responseKey: 'buyer_orders',
    },
    {
      intent: 'OPEN_BUYER_DASHBOARD',
      targetTool: 'navigate_to_page',
      targetDestination: 'buyer_dashboard',
      patterns: [
        /buyer dashboard|व्यापारी डॅशबोर्ड|खरेदीदार डॅशबोर्ड/i,
      ],
      roleFilter: ['BUYER', 'ADMIN'],
      responseKey: 'buyer_dashboard',
    },

    // --- TRANSPORTER INTENTS ---
    {
      intent: 'OPEN_AVAILABLE_TRIPS',
      targetTool: 'navigate_to_page',
      targetDestination: 'transporter_trips',
      patterns: [
        /available trips|find loads|loads|उपलब्ध फेऱ्या|फेऱ्या|ट्रिप शोधा|भाड़ा ढूंढो|loads available|ట్రిప్పు|ట్రిప్స్|பயணங்கள்/i,
      ],
      roleFilter: ['TRANSPORTER', 'ADMIN'],
      responseKey: 'transporter_trips',
    },
    {
      intent: 'OPEN_ACTIVE_TRIPS',
      targetTool: 'navigate_to_page',
      targetDestination: 'transporter_active_trips',
      patterns: [
        /active trips|current trips|सक्रिय फेऱ्या|चालू ट्रिप्स|active shipments|ऑनगोइंग फेऱ्या|నడుస్తున్న ట్రిప్పులు/i,
      ],
      roleFilter: ['TRANSPORTER', 'ADMIN'],
      responseKey: 'transporter_active_trips',
    },
    {
      intent: 'OPEN_VEHICLES',
      targetTool: 'navigate_to_page',
      targetDestination: 'transporter_vehicles',
      patterns: [
        /my vehicles|vehicles|trucks|fleet|माझी वाहने|वाहने|गाड्या|मेरी गाड़ियां|गाड़ियां|add vehicle|வாகனங்கள்|వాహనాలు/i,
      ],
      roleFilter: ['TRANSPORTER', 'ADMIN'],
      responseKey: 'transporter_vehicles',
    },
    {
      intent: 'OPEN_EARNINGS',
      targetTool: 'navigate_to_page',
      targetDestination: 'transporter_earnings',
      patterns: [
        /earnings|income|revenue|माझी कमाई|कमाई|कमवा|வருமானம்|ఆదాయం/i,
      ],
      roleFilter: ['TRANSPORTER', 'ADMIN'],
      responseKey: 'transporter_earnings',
    },
    {
      intent: 'OPEN_PERFORMANCE',
      targetTool: 'navigate_to_page',
      targetDestination: 'transporter_performance',
      patterns: [
        /performance|ratings|कामगिरी|रेटिंग|செயல்திறன்|పనితీరు/i,
      ],
      roleFilter: ['TRANSPORTER', 'ADMIN'],
      responseKey: 'transporter_performance',
    },
    {
      intent: 'OPEN_TRANSPORTER_DASHBOARD',
      targetTool: 'navigate_to_page',
      targetDestination: 'transporter_dashboard',
      patterns: [
        /transporter dashboard|ड्राइवर डैशबोर्ड|वाहतूकदार डॅशबोर्ड/i,
      ],
      roleFilter: ['TRANSPORTER', 'ADMIN'],
      responseKey: 'transporter_dashboard',
    },
  ];

  public async generateCompletion(options: LlmCompletionOptions): Promise<LlmCompletionResult> {
    const userMessage = options.messages[options.messages.length - 1]?.content || '';
    const userRole = options.context.authenticatedUser?.role || options.context.role || 'GUEST';
    const lang = (options.context.language || 'en') as SupportedLanguage;

    // Detect language from text if possible
    const detectedLang = this.detectLanguage(userMessage, lang);

    // Evaluate rules
    for (const rule of this.rules) {
      const isPatternMatch = rule.patterns.some((p) => p.test(userMessage));
      if (isPatternMatch) {
        // If rule has roleFilter and user is authenticated in a different role
        if (rule.roleFilter && userRole !== 'GUEST' && !rule.roleFilter.includes(userRole)) {
          return {
            text: this.getRoleMismatchMessage(rule.intent, userRole, detectedLang),
            intent: 'GENERAL_HELP',
            suggestions: this.getDefaultSuggestions(userRole, detectedLang),
          };
        }

        const toolCalls: ElaToolCall[] = [];
        if (rule.targetTool && rule.targetDestination) {
          toolCalls.push({
            name: rule.targetTool,
            arguments: { destination: rule.targetDestination },
          });
        }

        const responseText = this.getLocalizedResponse(rule.responseKey, detectedLang);
        return {
          text: responseText,
          intent: rule.intent,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          suggestions: this.getIntentSuggestions(rule.intent, userRole, detectedLang),
        };
      }
    }

    // Role statement check ("I am a farmer", "Main kisan hoon", etc.)
    const roleIntent = this.checkRoleDeclaration(userMessage, detectedLang);
    if (roleIntent) {
      return roleIntent;
    }

    // Default friendly assistant fallback response
    return {
      text: this.getDefaultGreeting(userRole, detectedLang),
      intent: 'GENERAL_HELP',
      suggestions: this.getDefaultSuggestions(userRole, detectedLang),
    };
  }

  private detectLanguage(text: string, currentLang: SupportedLanguage): SupportedLanguage {
    // If context already specifies a non-English language and text doesn't contradict scripts, keep context lang
    if (currentLang === 'mr' && /[\u0900-\u097F]/.test(text)) {
      return 'mr';
    }
    if (currentLang === 'hi' && /[\u0900-\u097F]/.test(text)) {
      return 'hi';
    }

    // Check for distinct Indic Unicode scripts
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu
    if (/[\u0980-\u09FF]/.test(text)) return 'bn'; // Bengali
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'; // Kannada

    // Devanagari discrimination: Marathi vs Hindi
    if (/[\u0900-\u097F]/.test(text)) {
      if (/आहे|नाही|कसे|माझे|माझा|माझी|पाहिजे|करा|दाखवा|तपासा|शेतकरी|फेऱ्या|पिके|उत्पादने|वाहने|खरेदीदार|वाहतूकदार/.test(text)) {
        return 'mr';
      }
      return 'hi';
    }

    // Transliteration hints
    if (/\b(hai|hain|karo|batao|kisan|gaadi|chahiye|bhejna|bhejo|dikhao)\b/i.test(text)) return 'hi';
    if (/\b(aahe|kasa|shetkari|pahije|dakhva|gadi|majhi|majhe|ferya)\b/i.test(text)) return 'mr';

    return currentLang;
  }

  private checkRoleDeclaration(text: string, lang: SupportedLanguage): LlmCompletionResult | null {
    if (/(i am a farmer|main kisan|kisan hoon|shetkari aahe|मी शेतकरी आहे|मैं किसान हूँ|நான் ஒரு விவசாயி|నేను రైతును|আমি একজন কৃষক|ನಾನು ರೈತ)/i.test(text)) {
      return {
        text: this.getLocalizedResponse('role_farmer_ack', lang),
        intent: 'OPEN_FARMER_DASHBOARD',
        toolCalls: [{ name: 'navigate_to_page', arguments: { destination: 'farmer_dashboard' } }],
        suggestions: this.getDefaultSuggestions('FARMER', lang),
      };
    }
    if (/(i am a buyer|main buyer|vyapari hoon|kharidar|मी खरेदीदार आहे|मैं व्यापारी हूँ|நான் ஒரு வாங்குபவர்|నేను కొనుగోలుదారుని|আমি একজন ক্রেতা|ನಾನು ಖರೀದಿದಾರ)/i.test(text)) {
      return {
        text: this.getLocalizedResponse('role_buyer_ack', lang),
        intent: 'OPEN_BUYER_DASHBOARD',
        toolCalls: [{ name: 'navigate_to_page', arguments: { destination: 'buyer_dashboard' } }],
        suggestions: this.getDefaultSuggestions('BUYER', lang),
      };
    }
    if (/(i am a transporter|transporter hoon|driver hoon|मी वाहतूकदार आहे|मैं ट्रांसपोर्टर हूँ|நான் ஒரு போக்குவரத்து|నేను రవాణాదారుని|আমি একজন পরিবহনকারী|ನಾನು ಸಾರಿಗೆದಾರ)/i.test(text)) {
      return {
        text: this.getLocalizedResponse('role_transporter_ack', lang),
        intent: 'OPEN_TRANSPORTER_DASHBOARD',
        toolCalls: [{ name: 'navigate_to_page', arguments: { destination: 'transporter_dashboard' } }],
        suggestions: this.getDefaultSuggestions('TRANSPORTER', lang),
      };
    }
    return null;
  }

  private getLocalizedResponse(key: string, lang: SupportedLanguage): string {
    const dict: Record<string, Record<SupportedLanguage, string>> = {
      login_farmer: {
        en: 'Opening the Farmer login portal for you.',
        hi: 'आपके लिए किसान लॉगिन पोर्टल खोला जा रहा है।',
        mr: 'तुमच्यासाठी शेतकरी लॉगिन पोर्टल उघडत आहे.',
        ta: 'உங்களுக்காக விவசாயி உள்நுழைவு போர்டல் திறக்கப்படுகிறது.',
        te: 'మీ కోసం రైతు లాగిన్ పోర్టల్ తెరవబడుతోంది.',
        bn: 'আপনার জন্য কৃষক লগইন পোর্টাল খোলা হচ্ছে।',
        kn: 'ನಿಮಗಾಗಿ ರೈತರ ಲಾಗಿನ್ ಪೋರ್ಟಲ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
      },
      login_buyer: {
        en: 'Opening the Commercial Buyer login portal.',
        hi: 'व्यापारी/खरीददार लॉगिन पोर्टल खोला जा रहा है।',
        mr: 'व्यापारी/खरेदीदार लॉगिन पोर्टल उघडत आहे.',
        ta: 'வணிக வாங்குபவர் உள்நுழைவு போர்டல் திறக்கப்படுகிறது.',
        te: 'వాణిజ్య కొనుగోలుదారు లాగిన్ పోర్టల్ తెరవబడుతోంది.',
        bn: 'বাণিজ্যিক ক্রেতা লগইন পোর্টাল খোলা হচ্ছে।',
        kn: 'ವಾಣಿಜ್ಯ ಖರೀದಿದಾರರ ಲಾಗಿನ್ ಪೋರ್ಟಲ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
      },
      login_transporter: {
        en: 'Opening the Transporter login portal.',
        hi: 'ट्रांसपोर्टर लॉगिन पोर्टल खोला जा रहा है।',
        mr: 'वाहतूकदार लॉगिन पोर्टल उघडत आहे.',
        ta: 'போக்குவரத்து உள்நுழைவு போர்டல் திறக்கப்படுகிறது.',
        te: 'రవాణాదారు లాగిన్ పోర్టల్ తెరవబడుతోంది.',
        bn: 'পরিবহনকারী লগইন পোর্টাল খোলা হচ্ছে।',
        kn: 'ಸಾರಿಗೆದಾರರ ಲಾಗಿನ್ ಪೋರ್ಟಲ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
      },
      login_general: {
        en: 'Please select your role portal to sign in securely (Farmer, Buyer, or Transporter).',
        hi: 'कृपया सुरक्षित लॉगिन के लिए अपना रोल चुनें (किसान, खरीदार, या ट्रांसपोर्टर)।',
        mr: 'कृपया सुरक्षित लॉगिनसाठी तुमची भूमिका निवडा (शेतकरी, खरेदीदार किंवा वाहतूकदार).',
        ta: 'பாதுகாப்பாக உள்நுழைய உங்கள் பாத்திரத்தைத் தேர்ந்தெடுக்கவும்.',
        te: 'దయచేసి సురక్షితంగా లాగిన్ అవ్వడానికి మీ పాత్రను ఎంచుకోండి.',
        bn: 'অনুগ্রহ করে নিরাপদ লগইনের জন্য আপনার ভূমিকা নির্বাচন করুন।',
        kn: 'ಸುರಕ್ಷಿತವಾಗಿ ಲಾಗಿನ್ ಮಾಡಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
      },
      home: {
        en: 'Navigating to the RuralFlow Home page.',
        hi: 'ग्रामीण प्रवाह के मुख्य पृष्ठ पर जा रहे हैं।',
        mr: 'मुख्य पृष्ठावर जात आहोत.',
        ta: 'முகப்புப் பக்கத்திற்கு செல்கிறது.',
        te: 'హోమ్ పేజీకి నావిగేట్ చేస్తోంది.',
        bn: 'মূল পৃষ্ঠায় যাচ্ছি।',
        kn: 'ಮುಖಪುಟಕ್ಕೆ ನ್ಯಾವಿಗೇಟ್ ಮಾಡಲಾಗುತ್ತಿದೆ.',
      },
      farmer_products: {
        en: 'Navigating to your registered products catalog.',
        hi: 'आपके पंजीकृत उत्पादों की सूची पर जा रहे हैं।',
        mr: 'तुमच्या नोंदणीकृत उत्पादनांच्या यादीवर जात आहोत.',
        ta: 'உங்கள் பதிவுசெய்யப்பட்ட பொருட்கள் பட்டியலுக்கு செல்கிறது.',
        te: 'మీ నమోదిత ఉత్పత్తుల కేటలాగ్‌కు నావిగేట్ చేస్తోంది.',
        bn: 'আপনার নিবন্ধিত পণ্য তালিকায় নিয়ে যাচ্ছি।',
        kn: 'ನಿಮ್ಮ ನೋಂದಾಯಿತ ಉತ್ಪನ್ನಗಳ ಪಟ್ಟಿಗೆ ನ್ಯಾವಿಗೇಟ್ ಮಾಡಲಾಗುತ್ತಿದೆ.',
      },
      farmer_add_product: {
        en: 'Opening the Add New Product form.',
        hi: 'नया उत्पाद जोड़ने का फॉर्म खोला जा रहा है।',
        mr: 'नवीन पीक/उत्पादन जोडण्याचा फॉर्म उघडत आहे.',
        ta: 'புதிய தயாரிப்பு சேர்க்கும் படிவம் திறக்கப்படுகிறது.',
        te: 'కొత్త ఉత్పత్తిని జోడించే ఫారమ్ తెరవబడుతోంది.',
        bn: 'নতুন পণ্য যোগ করার ফর্ম খোলা হচ্ছে।',
        kn: 'ಹೊಸ ಉತ್ಪನ್ನವನ್ನು ಸೇರಿಸುವ ಫಾರ್ಮ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
      },
      farmer_logistics: {
        en: 'Opening the Logistics Request form to find transport for your produce.',
        hi: 'आपकी उपज के लिए ट्रांसपोर्ट खोजने का लॉजिस्टिक्स फॉर्म खोला जा रहा है।',
        mr: 'तुमच्या शेतमालाच्या वाहतुकीसाठी लॉजिस्टिक्स विनंती फॉर्म उघडत आहे.',
        ta: 'உங்கள் விளைபொருட்களுக்கான போக்குவரத்து கோரிக்கை படிவம் திறக்கப்படுகிறது.',
        te: 'మీ ఉత్పత్తుల రవాణా అభ్యర్థన ఫారమ్ తెరవబడుతోంది.',
        bn: 'আপনার ফসলের জন্য পরিবহন অনুরোধের ফর্ম খোলা হচ্ছে।',
        kn: 'ನಿಮ್ಮ ಉತ್ಪನ್ನಗಳ ಸಾರಿಗೆ ವಿನಂತಿ ಫಾರ್ಮ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
      },
      farmer_markets: {
        en: 'Navigating to live APMC Market Demands and Opportunities.',
        hi: 'मंडी की लाइव बाजार मांग और अवसरों पर ले जाया जा रहा है।',
        mr: 'थेट बाजार मागणी आणि संधींकडे जात आहोत.',
        ta: 'சந்தை தேவைகள் மற்றும் வாய்ப்புகளுக்கு செல்கிறது.',
        te: 'ప్రత్యక్ష మార్కెట్ డిమాండ్లు మరియు అవకాశాలకు నావిగేట్ చేస్తోంది.',
        bn: 'লাইভ বাজার চাহিদা এবং সুযোগে নিয়ে যাচ্ছি।',
        kn: 'ನೇರ ಮಾರುಕಟ್ಟೆ ಬೇಡಿಕೆಗಳಿಗೆ ನ್ಯಾವಿಗೇಟ್ ಮಾಡಲಾಗುತ್ತಿದೆ.',
      },
      farmer_deliveries: {
        en: 'Opening your Deliveries & Shipment Tracking page.',
        hi: 'आपकी डिलीवरी और शिपमेंट ट्रैकिंग खोली जा रही है।',
        mr: 'तुमच्या डिलिव्हरी आणि ट्रॅकिंग पृष्ठावर जात आहोत.',
        ta: 'உங்கள் விநியோகங்கள் மற்றும் கண்காணிப்பு பக்கம் திறக்கப்படுகிறது.',
        te: 'మీ డెలివరీలు & షిప్‌మెంట్ ట్రాకింగ్ పేజీ తెరవబడుతోంది.',
        bn: 'আপনার ডেলিভারি এবং ট্র্যাকিং পৃষ্ঠা খোলা হচ্ছে।',
        kn: 'ನಿಮ್ಮ ಡೆಲಿವರಿಗಳು ಮತ್ತು ಟ್ರ್ಯಾಕಿಂಗ್ ಪುಟ ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
      },
      farmer_dashboard: {
        en: 'Navigating to Farmer Dashboard.',
        hi: 'किसान डैशबोर्ड पर ले जाया जा रहा है।',
        mr: 'शेतकरी डॅशबोर्डवर जात आहोत.',
        ta: 'விவசாயி டாஷ்போர்டிற்கு செல்கிறது.',
        te: 'రైతు డాష్‌బోర్డ్‌కు నావిగేట్ చేస్తోంది.',
        bn: 'কৃষক ড্যাশবোর্ডে যাচ্ছি।',
        kn: 'ರೈತರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ನ್ಯಾವಿಗೇಟ್ ಮಾಡಲಾಗುತ್ತಿದೆ.',
      },
      buyer_procurement: {
        en: 'Opening the Post Procurement form for APMC buyers.',
        hi: 'व्यापारियों के लिए खरीद मांग (Procurement) फॉर्म खोला जा रहा है।',
        mr: 'व्यापाऱ्यांसाठी खरेदी मागणी (Procurement) फॉर्म उघडत आहे.',
        ta: 'கொள்முதல் படிவம் திறக்கப்படுகிறது.',
        te: 'కొనుగోలు ఫారమ్ తెరవబడుతోంది.',
        bn: 'ক্রয় অনুরোধ ফর্ম খোলা হচ্ছে।',
        kn: 'ಖರೀದಿ ವಿನಂತಿ ಫಾರ್ಮ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
      },
      buyer_produce: {
        en: 'Opening the Farmer Produce Catalog.',
        hi: 'किसानों की उपलब्ध उपज की सूची खोली जा रही है।',
        mr: 'शेतमालाची सूची उघडत आहे.',
        ta: 'விவசாய விளைபொருட்கள் பட்டியல் திறக்கப்படுகிறது.',
        te: 'రైతు ఉత్పత్తుల కేటలాగ్ తెరవబడుతోంది.',
        bn: 'কৃষক পণ্যের ক্যাটালগ খোলা হচ্ছে।',
        kn: 'ರೈತರ ಉತ್ಪನ್ನಗಳ ಪಟ್ಟಿ ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
      },
      buyer_orders: {
        en: 'Navigating to your Orders & Live Tracking.',
        hi: 'आपके ऑर्डर्स और लाइव ट्रैकिंग पेज पर जा रहे हैं।',
        mr: 'तुमच्या ऑर्डर्स आणि ट्रॅकिंग पृष्ठावर जात आहोत.',
        ta: 'உங்கள் ஆர்டர்கள் பக்கத்திற்கு செல்கிறது.',
        te: 'మీ ఆర్డర్ల పేజీకి నావిగేట్ చేస్తోంది.',
        bn: 'আপনার অর্ডার পৃষ্ঠায় যাচ্ছি।',
        kn: 'ನಿಮ್ಮ ಆರ್ಡರ್‌ಗಳ ಪುಟಕ್ಕೆ ನ್ಯಾವಿಗೇಟ್ ಮಾಡಲಾಗುತ್ತಿದೆ.',
      },
      buyer_dashboard: {
        en: 'Navigating to Buyer Dashboard.',
        hi: 'खरीदार डैशबोर्ड पर जा रहे हैं।',
        mr: 'खरेदीदार डॅशबोर्डवर जात आहोत.',
        ta: 'வாங்குபவர் டாஷ்போர்டிற்கு செல்கிறது.',
        te: 'కొనుగోలుదారు డాష్‌బోర్డ్‌కు నావిగేట్ చేస్తోంది.',
        bn: 'ক্রেতা ড্যাশবোর্ডে যাচ্ছি।',
        kn: 'ಖರೀದಿದಾರರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ನ್ಯಾವಿಗೇಟ್ ಮಾಡಲಾಗುತ್ತಿದೆ.',
      },
      transporter_trips: {
        en: 'Opening Available Logistics Loads & Trips.',
        hi: 'उपलब्ध ट्रिप्स और माल भाड़ा सूची खोली जा रही है।',
        mr: 'उपलब्ध फेऱ्या आणि मालवाहतूक यादी उघडत आहे.',
        ta: 'கிடைக்கும் பயணங்கள் பட்டியல் திறக்கப்படுகிறது.',
        te: 'అందుబాటులో ఉన్న ట్రిప్పులు తెరవబడుతున్నాయి.',
        bn: 'উপলব্ধ ট্রিপ তালিকা খোলা হচ্ছে।',
        kn: 'ಲಭ್ಯವಿರುವ ಟ್ರಿಪ್‌ಗಳ ಪಟ್ಟಿ ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
      },
      transporter_active_trips: {
        en: 'Opening Active Shipments and Ongoing Trips.',
        hi: 'सक्रिय शिपमेंट्स और चल रही यात्राएं खोली जा रही हैं।',
        mr: 'सक्रिय फेऱ्या आणि चालू वाहतूक उघडत आहे.',
        ta: 'செயலில் உள்ள பயணங்கள் திறக்கப்படுகிறது.',
        te: 'యాక్టివ్ ట్రిప్పులు తెరవబడుతున్నాయి.',
        bn: 'সক্রিয় ট্রিপ খোলা হচ্ছে।',
        kn: 'ಸಕ್ರಿಯ ಟ್ರಿಪ್‌ಗಳು ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
      },
      transporter_vehicles: {
        en: 'Opening your Registered Vehicles management page.',
        hi: 'आपके पंजीकृत वाहनों का प्रबंधन पृष्ठ खोला जा रहा है।',
        mr: 'तुमच्या नोंदणीकृत वाहनांचे व्यवस्थापन पृष्ठ उघडत आहे.',
        ta: 'உங்கள் வாகனங்கள் மேலாண்மை பக்கம் திறக்கப்படுகிறது.',
        te: 'మీ వాహనాల నిర్వహణ పేజీ తెరవబడుతోంది.',
        bn: 'আপনার যানবাহন পরিচালনা পৃষ্ঠা খোলা হচ্ছে।',
        kn: 'ನಿಮ್ಮ ವಾಹನಗಳ ನಿರ್ವಹಣಾ ಪುಟ ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
      },
      transporter_earnings: {
        en: 'Opening your Earnings & Settlement summary.',
        hi: 'आपकी कमाई और भुगतान सारांश खोला जा रहा है।',
        mr: 'तुमची कमाई आणि देयक सारांश उघडत आहे.',
        ta: 'உங்கள் வருவாய் சுருக்கம் திறக்கப்படுகிறது.',
        te: 'మీ ఆదాయాల సారాంశం తెరవబడుతోంది.',
        bn: 'আপনার উপার্জনের বিবরণ খোলা হচ্ছে।',
        kn: 'ನಿಮ್ಮ ಆದಾಯದ ಸಾರಾಂಶ ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
      },
      transporter_performance: {
        en: 'Opening your Transporter Performance & Ratings report.',
        hi: 'आपकी प्रदर्शन रिपोर्ट और रेटिंग्स खोली जा रही हैं।',
        mr: 'तुमचा कामगिरी अहवाल आणि रेटिंग्ज उघडत आहेत.',
        ta: 'உங்கள் செயல்திறன் அறிக்கை திறக்கப்படுகிறது.',
        te: 'మీ పనితీరు నివేదిక తెరవబడుతోంది.',
        bn: 'আপনার পারফরম্যান্স রিপোর্ট খোলা হচ্ছে।',
        kn: 'ನಿಮ್ಮ ಕಾರ್ಯಕ್ಷಮತೆ ವರದಿ ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
      },
      transporter_dashboard: {
        en: 'Navigating to Transporter Dashboard.',
        hi: 'ट्रांसपोर्टर डैशबोर्ड पर जा रहे हैं।',
        mr: 'वाहतूकदार डॅशबोर्डवर जात आहोत.',
        ta: 'போக்குவரத்து டாஷ்போர்டிற்கு செல்கிறது.',
        te: 'రవాణాదారు డాష్‌బోర్డ్‌కు నావిగేట్ చేస్తోంది.',
        bn: 'পরিবহন ড্যাশবোর্ডে যাচ্ছি।',
        kn: 'ಸಾರಿಗೆದಾರರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ನ್ಯಾವಿಗೇಟ್ ಮಾಡಲಾಗುತ್ತಿದೆ.',
      },
      role_farmer_ack: {
        en: 'Welcome! As a Farmer, you can list produce, request transport, and track deliveries. How may I assist you today?',
        hi: 'नमस्ते किसान भाई! आप अपनी फसल सूचीबद्ध कर सकते हैं, गाड़ी बुक कर सकते हैं और डिलीवरी ट्रैक कर सकते हैं।',
        mr: 'नमस्कार शेतकरी मित्र! तुम्ही तुमची पिके जोडू शकता, वाहतूक विनंती करू शकता आणि डिलिव्हरी ट्रॅक करू शकता.',
        ta: 'வணக்கம் விவசாயி! உங்கள் விளைபொருட்களை பட்டியலிடலாம், போக்குவரத்தை பதிவு செய்யலாம்.',
        te: 'నమస్కారం రైతు మిత్రమా! మీరు మీ పంటలను జాబితా చేయవచ్చు మరియు రవాణాను బుక్ చేసుకోవచ్చు.',
        bn: 'স্বাগতম কৃষক ভাই! আপনি আপনার ফসল তালিকাভুক্ত করতে এবং পরিবহন বুক করতে পারেন।',
        kn: 'ನಮಸ್ಕಾರ ರೈತರೇ! ನಿಮ್ಮ ಬೆಳೆಯನ್ನು ಪಟ್ಟಿ ಮಾಡಬಹುದು ಮತ್ತು ಸಾರಿಗೆ ಬುಕ್ ಮಾಡಬಹುದು.',
      },
      role_buyer_ack: {
        en: 'Welcome! As a Commercial Buyer, you can post procurement demands and browse farm fresh produce.',
        hi: 'नमस्ते व्यापारी जी! आप खरीद मांग पोस्ट कर सकते हैं और ताज़ा कृषि उपज ब्राउज़ कर सकते हैं।',
        mr: 'नमस्कार व्यापारी मित्र! तुम्ही खरेदी मागणी नोंदवू शकता आणि थेट शेतमाल शोधू शकता.',
        ta: 'வணக்கம் வணிகரே! நீங்கள் கொள்முதல் தேவைகளை பதிவு செய்து விவசாய பொருட்களை வாங்கலாம்.',
        te: 'నమస్కారం కొనుగోలుదారు గారు! మీరు సేకరణ అభ్యర్థనలను పోస్ట్ చేయవచ్చు.',
        bn: 'স্বাগতম ক্রেতা! আপনি ক্রয়ের চাহিদা পোস্ট করতে পারেন।',
        kn: 'ಸ್ವಾಗತ ಖರೀದಿದಾರರೇ! ನೀವು ಖರೀದಿ ಬೇಡಿಕೆಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಬಹುದು.',
      },
      role_transporter_ack: {
        en: 'Welcome! As a Transporter, you can manage your fleet, discover loads, and track trips.',
        hi: 'नमस्ते ट्रांसपोर्टर जी! आप अपने वाहन प्रबंधित कर सकते हैं, भाड़ा ढूंढ सकते हैं और ट्रिप्स ट्रैक कर सकते हैं।',
        mr: 'नमस्कार वाहतूकदार मित्र! तुम्ही तुमची वाहने व्यवस्थापित करू शकता आणि उपलब्ध फेऱ्या शोधू शकता.',
        ta: 'வணக்கம் போக்குவரத்துதாரரே! உங்கள் வாகனங்களை நிர்வகித்து புதிய சுமைகளைத் தேடலாம்.',
        te: 'నమస్కారం రవాణాదారు గారు! మీరు వాహనాలను నిర్వహించవచ్చు మరియు కొత్త ట్రిప్పులను కనుగొనవచ్చు.',
        bn: 'স্বাগতম পরিবহনকারী! আপনি আপনার গাড়ি পরিচালনা ও নতুন ট্রিপ খুঁজে পেতে পারেন।',
        kn: 'ಸ್ವಾಗತ ಸಾರಿಗೆದಾರರೇ! ನಿಮ್ಮ ವಾಹನಗಳನ್ನು ನಿರ್ವಹಿಸಬಹುದು ಮತ್ತು ಹೊಸ ಟ್ರಿಪ್‌ಗಳನ್ನು ಹುಡುಕಬಹುದು.',
      },
    };

    return dict[key]?.[lang] || dict[key]?.['en'] || 'How may I assist you with RuralFlow logistics?';
  }

  private getRoleMismatchMessage(intent: ElaIntent, userRole: UserRole, lang: SupportedLanguage): string {
    const messages: Record<SupportedLanguage, string> = {
      en: `This section is designed for another role. You are currently logged in as ${userRole}. Here are the tools available for you:`,
      hi: `यह अनुभाग आपकी वर्तमान भूमिका (${userRole}) के लिए उपलब्ध नहीं है। आपके लिए उपलब्ध विकल्प:`,
      mr: `हा विभाग तुमच्या भूमिकेसाठी (${userRole}) उपलब्ध नाही. तुमच्यासाठी उपलब्ध पर्याय:`,
      ta: `இந்த பகுதி உங்கள் பாத்திரத்திற்கு (${userRole}) கிடைக்கவில்லை. உங்களுக்கான விருப்பங்கள்:`,
      te: `ఈ విభాగం మీ పాత్రకు (${userRole}) అందుబాటులో లేదు. మీ కోసం అందుబాటులో ఉన్న ఎంపికలు:`,
      bn: `এই বিভাগটি আপনার ভূমিকার (${userRole}) জন্য উপলব্ধ নয়। আপনার জন্য উপলব্ধ বিকল্প:`,
      kn: `ಈ ವಿಭಾಗವು ನಿಮ್ಮ ಪಾತ್ರಕ್ಕೆ (${userRole}) ಲಭ್ಯವಿಲ್ಲ. ನಿಮಗಾಗಿ ಲಭ್ಯವಿರುವ ಆಯ್ಕೆಗಳು:`,
    };
    return messages[lang] || messages['en'];
  }

  private getDefaultGreeting(role: UserRole, lang: SupportedLanguage): string {
    const greetings: Record<SupportedLanguage, string> = {
      en: "Hello! I'm ELA, your RuralFlow logistics assistant. How can I help you navigate or manage your shipments today?",
      hi: "नमस्ते! मैं ईला (ELA) हूँ, आपकी रूरलफ्लो लॉजिस्टिक्स सहायक। आज मैं आपकी क्या सहायता कर सकती हूँ?",
      mr: "नमस्कार! मी ईला (ELA), तुमची रूरलफ्लो लॉजिस्टिक्स सहाय्यक. मी तुम्हाला कशी मदत करू शकेन?",
      ta: "வணக்கம்! நான் இலா (ELA), உங்கள் ரூரல்ஃப்ளோ தளவாட உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
      te: "నమస్కారం! నేను ఎలా (ELA), మీ రూరల్‌ఫ్లో లాజిస్టిక్స్ అసిస్టెంట్. నేను మీకు ఎలా సహాయపడగలను?",
      bn: "নমস্কার! আমি ইলা (ELA), আপনার রুরালফ্লো লজিস্টিক সহকারী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
      kn: "ನಮಸ್ಕಾರ! ನಾನು ಇಲಾ (ELA), ನಿಮ್ಮ ರೂರಲ್‌ಫ್ಲೋ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
    };
    return greetings[lang] || greetings['en'];
  }

  private getDefaultSuggestions(role: UserRole, lang: SupportedLanguage): string[] {
    if (role === 'FARMER') {
      if (lang === 'mr') return ['माझी उत्पादने', 'वाहतूक मागणी', 'बाजार मागणी', 'माझी डिलिव्हरी'];
      if (lang === 'hi') return ['मेरे उत्पाद', 'गाड़ी बुक करें', 'मंडी मांग', 'मेरी डिलीवरी'];
      return ['My Products', 'Logistics Request', 'Market Demand', 'My Deliveries'];
    }
    if (role === 'BUYER') {
      if (lang === 'mr') return ['खरेदी मागणी नोंदवा', 'शेतमाल शोधा', 'माझ्या ऑर्डर्स'];
      if (lang === 'hi') return ['खरीद मांग पोस्ट करें', 'उपज देखें', 'मेरे ऑर्डर्स'];
      return ['Post Procurement', 'Produce Catalog', 'My Orders'];
    }
    if (role === 'TRANSPORTER') {
      if (lang === 'mr') return ['उपलब्ध फेऱ्या', 'माझी वाहने', 'सक्रिय फेऱ्या', 'माझी कमाई'];
      if (lang === 'hi') return ['उपलब्ध ट्रिप्स', 'मेरी गाड़ियां', 'सक्रिय फेऱ्या', 'मेरी कमाई'];
      return ['Available Trips', 'My Vehicles', 'Active Trips', 'My Earnings'];
    }

    // Guest / Common
    if (lang === 'mr') return ['शेतकरी लॉगिन', 'व्यापारी लॉगिन', 'वाहतूकदार लॉगिन', 'मुख्य पृष्ठ'];
    if (lang === 'hi') return ['किसान लॉगिन', 'व्यापारी लॉगिन', 'ट्रांसपोर्टर लॉगिन', 'मुख्य पृष्ठ'];
    return ['Farmer Login', 'Buyer Login', 'Transporter Login', 'Home Page'];
  }

  private getIntentSuggestions(intent: ElaIntent, role: UserRole, lang: SupportedLanguage): string[] {
    return this.getDefaultSuggestions(role, lang);
  }
}
