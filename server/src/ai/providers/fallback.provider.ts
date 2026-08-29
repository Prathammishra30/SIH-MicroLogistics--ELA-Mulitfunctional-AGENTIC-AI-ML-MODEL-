// Fallback Rule-Based Multilingual Intent & Agentic Tool Execution Provider
// AgriRoute / RuralFlow ELA Universal AI Engine (Phase 2 Action & Security Engine)

import type { ILlmProvider, LlmCompletionOptions, LlmCompletionResult } from './llm.interface.js';
import type {
  ElaIntent,
  ElaToolCall,
  SupportedLanguage,
  UserRole,
} from '../ela.types.js';

interface IntentRule {
  intent: ElaIntent;
  targetTool?: string;
  targetDestination?: string;
  patterns: RegExp[];
  roleFilter?: UserRole[];
  responseKey: string;
  toolArgsExtractor?: (text: string) => Record<string, unknown>;
}

export class FallbackLlmProvider implements ILlmProvider {
  public readonly name = 'AgriRoute Universal Multilingual Agent Engine';

  public isAvailable(): boolean {
    return true;
  }

  private rules: IntentRule[] = [
    // ==========================================
    // 0. SENSITIVE CREDENTIAL SHIELD (CRITICAL SECURITY)
    // ==========================================
    {
      intent: 'GENERAL_HELP',
      patterns: [
        /\b(password|passcode|secret|otp|verification code|pin|123456|cvv)\b/i,
      ],
      responseKey: 'sensitive_credential_shield',
    },

    // ==========================================
    // 1. PUBLIC LANDING & PLATFORM EXPLANATIONS
    // ==========================================
    {
      intent: 'EXPLAIN_PLATFORM',
      patterns: [
        /farmer.*(kya karta|benefit|kaise kaam|help|madat|faayda|features|काम|मदत)|(शेतकऱ्यांसाठी|किसानों के लिए).*(फायदा|माहिती|काय आहे)/i,
      ],
      responseKey: 'explain_farmer',
    },
    {
      intent: 'EXPLAIN_PLATFORM',
      patterns: [
        /buyer.*(kya karta|benefit|kaise kaam|help|madat|faayda|features|काम|मदत)|(खरेदीदारांसाठी|व्यापारियों के लिए).*(फायदा|माहिती|काय आहे)/i,
      ],
      responseKey: 'explain_buyer',
    },
    {
      intent: 'EXPLAIN_PLATFORM',
      patterns: [
        /transporter.*(kya karta|benefit|kaise kaam|help|madat|faayda|features|काम|मदत)|(वाहतूकदारांसाठी|ट्रांसपोर्टर के लिए).*(फायदा|माहिती|काय आहे)/i,
      ],
      responseKey: 'explain_transporter',
    },

    // ==========================================
    // 2. AUTHENTICATION & LOGIN/REGISTER ROUTING
    // ==========================================
    {
      intent: 'LOGIN_GUIDANCE',
      targetTool: 'navigate_to_page',
      targetDestination: 'login_farmer',
      patterns: [
        /farmer.*(login|sign in|auth)|किसान.*(लॉगिन|प्रवेश)|शेतकरी.*(लॉगिन|प्रवेश)|kisan.*login|shetkari.*login|விவசாயி.*உள்நுழைவு|రైతు.*లాగిన్|কৃষক.*লগইন/i,
      ],
      responseKey: 'login_farmer',
    },
    {
      intent: 'REGISTER_GUIDANCE',
      targetTool: 'navigate_to_page',
      targetDestination: 'login_farmer',
      patterns: [
        /farmer.*(register|sign up|account|create account)|किसान.*(खाता|पंजीकरण)|शेतकरी.*(खाते|नोंदणी)|kisan.*account|shetkari.*khate/i,
      ],
      responseKey: 'register_farmer',
    },
    {
      intent: 'LOGIN_GUIDANCE',
      targetTool: 'navigate_to_page',
      targetDestination: 'login_buyer',
      patterns: [
        /buyer.*(login|sign in|auth)|खरीददार.*(लॉगिन|प्रवेश)|खरेदीदार.*(लॉगिन|प्रवेश)|व्यापारी.*(लॉगिन|प्रवेश)|kharidar.*login|vyapari.*login|வணிகர்.*உள்நுழைவு|కొనుగోలుదారు.*లాగిన్/i,
      ],
      responseKey: 'login_buyer',
    },
    {
      intent: 'REGISTER_GUIDANCE',
      targetTool: 'navigate_to_page',
      targetDestination: 'login_buyer',
      patterns: [
        /buyer.*(register|sign up|account|create account)|खरीददार.*(खाता|पंजीकरण)|खरेदीदार.*(खाते|नोंदणी)|kharidar.*account/i,
      ],
      responseKey: 'register_buyer',
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
      intent: 'REGISTER_GUIDANCE',
      targetTool: 'navigate_to_page',
      targetDestination: 'login_transporter',
      patterns: [
        /transporter.*(register|sign up|account|create account)|वाहतूकदार.*(खाते|नोंदणी)|ट्रांसपोर्टर.*(खाता|पंजीकरण)/i,
      ],
      responseKey: 'register_transporter',
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

    // ==========================================
    // 3. FARMER REAL WORKFLOWS & DATA TOOLS
    // ==========================================
    {
      intent: 'CREATE_PRODUCT_WORKFLOW',
      targetTool: 'create_product',
      patterns: [
        /add.*(tomato|onion|potato|wheat|rice|produce|crop|mal|फसल|टमाटर|कांदा|बटाटा|गहू|भाजीपाला)|(tomato|onion|potato|wheat|rice|टमाटर|कांदा|टोमॅटो|उत्पादन|पीक).*(add|जोडा|जोड़ें|bechna|विकायचे)/i,
      ],
      roleFilter: ['FARMER', 'ADMIN'],
      responseKey: 'farmer_add_product',
      toolArgsExtractor: (text: string) => {
        let name = 'Tomatoes';
        if (/onion|कांदा|प्याज/i.test(text)) name = 'Fresh Onions';
        if (/potato|बटाटा|आलू/i.test(text)) name = 'Fresh Potatoes';
        if (/wheat|गहू|गेहूं/i.test(text)) name = 'Sharbati Wheat';
        if (/tomato|टमाटर|टोमॅटो/i.test(text)) name = 'Organic Tomatoes';

        let quantity = '500 kg';
        const qMatch = text.match(/(\d+[\s]*(?:kg|quintal|ton|mt|किलो|टन))/i);
        if (qMatch) quantity = qMatch[1];

        return { name, quantity, category: 'Fresh Vegetables & Produce', grade: 'Grade A' };
      },
    },
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
      intent: 'GET_FARMER_PRODUCTS',
      targetTool: 'get_farmer_products',
      patterns: [
        /my products|products|crops|उत्पाद|मेरी फसल|मेरे उत्पाद|माझी पिके|माझी उत्पादने|उत्पादने|mere products|fasal dikhao|பொருட்கள்|ఉత్పత్తులు|పంటలు|পণ্য|ফসল|ಉತ್ಪನ್ನಗಳು|ಬೆಳೆಗಳು/i,
      ],
      roleFilter: ['FARMER', 'ADMIN'],
      responseKey: 'farmer_products',
    },
    {
      intent: 'CREATE_LOGISTICS_WORKFLOW',
      targetTool: 'create_logistics_request',
      patterns: [
        /(bhejna|bhejo|pathvayche|transport chahiye|gaadi chahiye).*(pune|mumbai|nashik|mandi|bazar)|(pune|mumbai|nashik|पुणे|मुंबई).*(bhejna|bhejo|pathvayche|ट्रक|गाडी)/i,
      ],
      roleFilter: ['FARMER', 'ADMIN'],
      responseKey: 'farmer_logistics',
      toolArgsExtractor: (text: string) => {
        let destination = 'Pune APMC Mandi';
        if (/mumbai|मुंबई/i.test(text)) destination = 'Navi Mumbai APMC Mandi';
        if (/nashik|नासिक/i.test(text)) destination = 'Nashik Krishi Mandi';

        let productName = 'Organic Produce';
        if (/tomato|टमाटर|टोमॅटो/i.test(text)) productName = 'Organic Tomatoes';
        if (/onion|कांदा|प्याज/i.test(text)) productName = 'Fresh Onions';

        let quantity = '500 kg';
        const qMatch = text.match(/(\d+[\s]*(?:kg|quintal|ton|mt|किलो|टन))/i);
        if (qMatch) quantity = qMatch[1];

        return { productName, destination, quantity, pickupLocation: 'Village Farm Cluster', estimatedEarnings: '₹2,800' };
      },
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
      intent: 'GET_MARKET_DEMAND',
      targetTool: 'get_market_demand',
      patterns: [
        /market demand|mandi|market|बाजार मागणी|मार्केट|मंडी भाव|demand dikhao|மந்தை தேவை|சந்தை தேவை|మార్కెట్ డిమాండ్|বাজার চাহিদা|ಮಾರುಕಟ್ಟೆ|ಬೇಡಿಕೆ/i,
      ],
      roleFilter: ['FARMER', 'BUYER', 'ADMIN'],
      responseKey: 'farmer_markets',
    },
    {
      intent: 'GET_FARMER_DELIVERIES',
      targetTool: 'get_farmer_deliveries',
      patterns: [
        /deliveries|delivery|shipment|shipments|meri shipments|माझी डिलिव्हरी|डिलिव्हरी तपासा|डिलिव्हरी|डिलीवरी|shipment status|track delivery|விநியோக|விநியோகம்|விநியோகங்களை|டெலிவரி|డెలివరీ|డెలివరీలు|ಡೆಲಿವರಿ|ডেলিভারি/i,
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

    // ==========================================
    // 4. BUYER REAL WORKFLOWS & DATA TOOLS
    // ==========================================
    {
      intent: 'CREATE_PROCUREMENT_WORKFLOW',
      targetTool: 'create_procurement',
      patterns: [
        /(kharidna|kharidne|procurement).*(\d+|kg|ton|mt|tomato|onion|wheat|vegetable)|(tomatoes|onions|wheat|माल).*(kharidna|kharidne|खरेदी करायची|हवे आहेत)/i,
      ],
      roleFilter: ['BUYER', 'ADMIN'],
      responseKey: 'buyer_procurement',
      toolArgsExtractor: (text: string) => {
        let product = 'Organic Tomatoes';
        if (/onion|कांदा|प्याज/i.test(text)) product = 'Fresh Onions';
        if (/wheat|गहू|गेहूं/i.test(text)) product = 'Quality Wheat';

        let quantity = '500 kg';
        const qMatch = text.match(/(\d+[\s]*(?:kg|quintal|ton|mt|किलो|टन))/i);
        if (qMatch) quantity = qMatch[1];

        let targetPrice = '₹40/kg';
        const pMatch = text.match(/(\d+)\s*(?:rs|rupees|रु|रुपये)/i);
        if (pMatch) targetPrice = `₹${pMatch[1]}/kg`;

        return { product, quantity, targetPrice, destination: 'Navi Mumbai APMC Mandi', requiredBy: 'Tomorrow, 5:00 PM' };
      },
    },
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
      intent: 'GET_BUYER_PRODUCE',
      targetTool: 'get_buyer_produce',
      patterns: [
        /produce catalog|browse farmers|available produce|शेतमालाची यादी|शेतमाल|उपलब्ध माल|fasal dekho|किसान उपज|पంటల జాబితా|பொருட்களின் பட்டியல்/i,
      ],
      roleFilter: ['BUYER', 'ADMIN', 'GUEST'],
      responseKey: 'buyer_produce',
    },
    {
      intent: 'GET_BUYER_ORDERS',
      targetTool: 'get_buyer_orders',
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

    // ==========================================
    // 5. TRANSPORTER REAL WORKFLOWS & FLEET TOOLS
    // ==========================================
    {
      intent: 'GET_AVAILABLE_TRIPS',
      targetTool: 'get_available_trips',
      patterns: [
        /available trips|find loads|loads|उपलब्ध फेऱ्या|फेऱ्या|ट्रिप शोधा|भाड़ा ढूंढो|loads available|ట్రిప్పు|ట్రిప్స్|பயணங்கள்|nearby loads/i,
      ],
      roleFilter: ['TRANSPORTER', 'ADMIN', 'GUEST'],
      responseKey: 'transporter_trips',
    },
    {
      intent: 'GET_ACTIVE_TRIPS',
      targetTool: 'get_active_trips',
      patterns: [
        /active trips|current trips|सक्रिय फेऱ्या|चालू ट्रिप्स|active shipments|ऑनगोइंग फेऱ्या|నడుస్తున్న ట్రిప్పులు/i,
      ],
      roleFilter: ['TRANSPORTER', 'ADMIN'],
      responseKey: 'transporter_active_trips',
    },
    {
      intent: 'CREATE_VEHICLE_WORKFLOW',
      targetTool: 'create_vehicle',
      patterns: [
        /(add|register).*(vehicle|truck|pickup|गाडी|ट्रक|वाहन)|(gadi|gaadi|truck).*(add|जोडा|जोड़ें)/i,
      ],
      roleFilter: ['TRANSPORTER', 'ADMIN'],
      responseKey: 'transporter_vehicles',
      toolArgsExtractor: (text: string) => {
        let type = 'Pickup (1.5 MT)';
        if (/mini truck|chota hathi|छोटा हाथी/i.test(text)) type = 'Tata Ace / Mini Truck (750 kg)';
        if (/3 wheeler|auto|तीन चाकी/i.test(text)) type = '3-Wheeler Loader (500 kg)';

        let registration = `MH 12 RF ${Math.floor(1000 + Math.random() * 9000)}`;
        const regMatch = text.match(/([A-Z]{2}[\s-]?[0-9]{1,2}[\s-]?[A-Z]{1,2}[\s-]?[0-9]{4})/i);
        if (regMatch) registration = regMatch[1].toUpperCase();

        return { type, registration, capacity: '1.5 MT' };
      },
    },
    {
      intent: 'GET_VEHICLES',
      targetTool: 'get_vehicles',
      patterns: [
        /my vehicles|vehicles|trucks|fleet|माझी वाहने|वाहने|गाड्या|मेरी गाड़ियां|गाड़ियां|வாகனங்கள்|వాహనాలు/i,
      ],
      roleFilter: ['TRANSPORTER', 'ADMIN'],
      responseKey: 'transporter_vehicles',
    },
    {
      intent: 'GET_EARNINGS',
      targetTool: 'get_earnings',
      patterns: [
        /earnings|income|revenue|payout|कमाई|कमवा|माझी कमाई|मेरी कमाई|வருமானம்|ఆదాయం/i,
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

    // Detect language from text
    const detectedLang = this.detectLanguage(userMessage, lang);

    // 1. Check for sensitive credentials first
    if (/\b(password|passcode|secret|otp|verification code|pin|123456|cvv)\b/i.test(userMessage)) {
      return {
        text: this.getLocalizedResponse('sensitive_credential_shield', detectedLang),
        intent: 'GENERAL_HELP',
        suggestions: this.getDefaultSuggestions(userRole, detectedLang),
      };
    }

    // 2. Evaluate rules
    for (const rule of this.rules) {
      const isPatternMatch = rule.patterns.some((p) => p.test(userMessage));
      if (isPatternMatch) {
        // If rule has roleFilter and user is authenticated in an unauthorized role
        if (rule.roleFilter && userRole !== 'GUEST' && !rule.roleFilter.includes(userRole)) {
          return {
            text: this.getRoleMismatchMessage(rule.intent, userRole, detectedLang),
            intent: 'GENERAL_HELP',
            suggestions: this.getDefaultSuggestions(userRole, detectedLang),
          };
        }

        const toolCalls: ElaToolCall[] = [];
        if (rule.targetTool) {
          let args: Record<string, unknown> = {};
          if (rule.targetDestination) {
            args = { destination: rule.targetDestination };
          } else if (rule.toolArgsExtractor) {
            args = rule.toolArgsExtractor(userMessage);
          }
          toolCalls.push({
            name: rule.targetTool,
            arguments: args,
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

    // 3. Role statement check on Public / Landing page ("I am a farmer", "Main kisan hoon", etc.)
    const roleIntent = this.checkRoleDeclaration(userMessage, detectedLang);
    if (roleIntent) {
      return roleIntent;
    }

    // 4. Default friendly assistant fallback response
    return {
      text: this.getDefaultGreeting(userRole, detectedLang),
      intent: 'GENERAL_HELP',
      suggestions: this.getDefaultSuggestions(userRole, detectedLang),
    };
  }

  private detectLanguage(text: string, currentLang: SupportedLanguage): SupportedLanguage {
    if (currentLang === 'mr' && /[\u0900-\u097F]/.test(text)) {
      return 'mr';
    }
    if (currentLang === 'hi' && /[\u0900-\u097F]/.test(text)) {
      return 'hi';
    }

    // Distinct Indic Unicode scripts
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
    if (/\b(hai|hain|karo|batao|kisan|gaadi|chahiye|bhejna|bhejo|dikhao|kharidna)\b/i.test(text)) return 'hi';
    if (/\b(aahe|kasa|shetkari|pahije|dakhva|gadi|majhi|majhe|ferya|pathvayche)\b/i.test(text)) return 'mr';

    return currentLang;
  }

  private checkRoleDeclaration(text: string, lang: SupportedLanguage): LlmCompletionResult | null {
    if (/(i am a farmer|main kisan|kisan hoon|shetkari aahe|मी शेतकरी आहे|मैं किसान हूँ|நான் ஒரு விவசாயி|நான் விவசாயி|నేను రైతును|আমি একজন কৃষক|ನಾನು ರೈತ)/i.test(text)) {
      return {
        text: this.getLocalizedResponse('role_farmer_ack', lang),
        intent: 'LOGIN_GUIDANCE',
        toolCalls: [{ name: 'navigate_to_page', arguments: { destination: 'login_farmer' } }],
        suggestions: this.getDefaultSuggestions('FARMER', lang),
      };
    }
    if (/(i am a buyer|main buyer|vyapari hoon|kharidar|मी खरेदीदार आहे|मैं व्यापारी हूँ|நான் ஒரு வாங்குபவர்|நான் வாங்குபவர்|నేను కొనుగోలుదారుని|আমি একজন ক্রেতা|ನಾನು ಖರೀದಿದಾರ)/i.test(text)) {
      return {
        text: this.getLocalizedResponse('role_buyer_ack', lang),
        intent: 'LOGIN_GUIDANCE',
        toolCalls: [{ name: 'navigate_to_page', arguments: { destination: 'login_buyer' } }],
        suggestions: this.getDefaultSuggestions('BUYER', lang),
      };
    }
    if (/(i am a transporter|transporter hoon|driver hoon|मी वाहतूकदार आहे|मैं ट्रांसपोर्टर हूँ|நான் ஒரு போக்குவரத்து|நான் போக்குவரத்து|నేను రవాణాదారుని|আমি একজন পরিবহনকারী|ನಾನು ಸಾರಿಗೆದಾರ)/i.test(text)) {
      return {
        text: this.getLocalizedResponse('role_transporter_ack', lang),
        intent: 'LOGIN_GUIDANCE',
        toolCalls: [{ name: 'navigate_to_page', arguments: { destination: 'login_transporter' } }],
        suggestions: this.getDefaultSuggestions('TRANSPORTER', lang),
      };
    }
    return null;
  }

  private getLocalizedResponse(key: string, lang: SupportedLanguage): string {
    const dict: Record<string, Record<SupportedLanguage, string>> = {
      sensitive_credential_shield: {
        en: 'Please enter your password or OTP directly into the secure login form. For your security, ELA never processes, stores, or transmits passwords or verification codes.',
        hi: 'कृपया अपना पासवर्ड या ओटीपी सीधे सुरक्षित लॉगिन फॉर्म में दर्ज करें। सुरक्षा कारणों से ईला पासवर्ड या ओटीपी स्वीकार नहीं करती है।',
        mr: 'कृपया तुमचा पासवर्ड किंवा ओटीपी थेट सुरक्षित लॉगिन फॉर्ममध्ये टाका. सुरक्षेसाठी ईला कधीही पासवर्ड किंवा ओटीपी साठवत नाही.',
        ta: 'உங்கள் கடவுச்சொல் அல்லது OTP ஐ பாதுகாப்பான உள்நுழைவு படிவத்தில் உள்ளிடவும்.',
        te: 'దయచేసి మీ పాస్‌వర్డ్ లేదా OTPని నేరుగా సురక్షిత లాగిన్ ఫారమ్‌లో నమోదు చేయండి.',
        bn: 'অনুগ্রহ করে নিরাপদ লগইন ফর্মে আপনার পাসওয়ার্ড বা ওটিপি সরাসরি লিখুন।',
        kn: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ಅಥವಾ ಒಟಿಪಿಯನ್ನು ಸುರಕ್ಷಿತ ಲಾಗಿನ್ ಫಾರ್ಮ್‌ನಲ್ಲಿ ನೇರವಾಗಿ ನಮೂದಿಸಿ.',
      },
      explain_farmer: {
        en: 'AgriRoute connects farmers directly to mandi buyers and verified local transport. You can list crops, check live market rates, and request pickup in seconds.',
        hi: 'एग्रीरूट किसानों को सीधे व्यापारियों और स्थानीय ट्रांसपोर्ट से जोड़ता है। आप अपनी फसल लिस्ट कर सकते हैं और आसानी से गाड़ी बुक कर सकते हैं।',
        mr: 'अ‍ॅग्रीरूट शेतकऱ्यांना थेट बाजारपेठेतील खरेदीदार आणि वाहनांशी जोडते. तुम्ही शेतमाल नोंदवून थेट गाडी मागवू शकता.',
        ta: 'அக்ரூட் விவசாயிகளை நேரடியாக வாங்குபவர்களுடனும் உள்ளூர் போக்குவரத்தையுடனும் இணைக்கிறது.',
        te: 'అగ్రిరూట్ రైతులను నేరుగా కొనుగోలుదారులు మరియు రవాణాతో కలుపుతుంది.',
        bn: 'এগ্রিরুট কৃষকদের সরাসরি ব্যবসায়ী এবং পরিবহনের সাথে যুক্ত করে।',
        kn: 'ಅಗ್ರಿರೌಟ್ ರೈತರನ್ನು ನೇರವಾಗಿ ವ್ಯಾಪಾರಿಗಳು ಮತ್ತು ಸಾರಿಗೆಯೊಂದಿಗೆ ಸಂಪರ್ಕಿಸುತ್ತದೆ.',
      },
      explain_buyer: {
        en: 'Commercial Buyers can discover verified regional farm produce, post bulk procurement demands, and track cold/standard shipments end-to-end.',
        hi: 'व्यापारी सीधे किसानों से ताज़ा उपज खरीद सकते हैं, बल्क मांग पोस्ट कर सकते हैं और डिलीवरी ट्रैक कर सकते हैं।',
        mr: 'व्यापारी थेट शेतकऱ्यांकडून दर्जेदार शेतमाल खरेदी करू शकतात आणि थेट डिलिव्हरी ट्रॅक करू शकतात.',
        ta: 'வணிக வாங்குபவர்கள் மொத்த கொள்முதல் தேவைகளை பதிவு செய்து விவசாயிகளிடம் இருந்து வாங்கலாம்.',
        te: 'వాణిజ్య కొనుగోలుదారులు నేరుగా రైతుల నుండి ఉత్పత్తులను సేకరించవచ్చు.',
        bn: 'ব্যবসায়ীরা সরাসরি কৃষকদের কাছ থেকে পাইকারি ফসল কিনতে পারেন।',
        kn: 'ವಾಣಿಜ್ಯ ಖರೀದಿದಾರರು ನೇರವಾಗಿ ರೈತರಿಂದ ಉತ್ಪನ್ನಗಳನ್ನು ಖರೀದಿಸಬಹುದು.',
      },
      explain_transporter: {
        en: 'Transporters can discover nearby farm pickup loads, maximize truck utilization, accept instant trips, and receive timely freight settlements.',
        hi: 'ट्रांसपोर्टर नजदीकी कृषि उपज भाड़ा खोज सकते हैं, अपनी गाड़ी की क्षमता का पूरा उपयोग कर सकते हैं और कमाई बढ़ा सकते हैं।',
        mr: 'वाहतूकदार शेतातील मालाच्या उपलब्ध फेऱ्या शोधून आपल्या गाड्यांची क्षमता वाढवू शकतात आणि जास्त कमाई करू शकतात.',
        ta: 'போக்குவரத்துதாரர்கள் அருகிலுள்ள சுமைகளைக் கண்டறிந்து வருவாயை அதிகரிக்கலாம்.',
        te: 'రవాణాదారులు సమీపంలోని వ్యవసాయ లోడ్లను కనుగొని ఆదాయాన్ని పెంచుకోవచ్చు.',
        bn: 'পরিবহনকারীরা কাছাকাছি ফসল লোড খুঁজে পেয়ে আয় বৃদ্ধি করতে পারেন।',
        kn: 'ಸಾರಿಗೆದಾರರು ಹತ್ತಿರದ ಲೋಡ್‌ಗಳನ್ನು ಹುಡುಕಿ ಆದಾಯವನ್ನು ಹೆಚ್ಚಿಸಬಹುದು.',
      },
      login_farmer: {
        en: 'Opening the secure Farmer login portal for you.',
        hi: 'आपके लिए सुरक्षित किसान लॉगिन पोर्टल खोला जा रहा है।',
        mr: 'तुमच्यासाठी सुरक्षित शेतकरी लॉगिन पोर्टल उघडत आहे.',
        ta: 'உங்களுக்காக விவசாயி உள்நுழைவு போர்டல் திறக்கப்படுகிறது.',
        te: 'మీ కోసం రైతు లాగిన్ పోర్టల్ తెరవబడుతోంది.',
        bn: 'আপনার জন্য কৃষক লগইন পোর্টাল খোলা হচ্ছে।',
        kn: 'ನಿಮಗಾಗಿ ರೈತರ ಲಾಗಿನ್ ಪೋರ್ಟಲ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
      },
      register_farmer: {
        en: 'Opening the Farmer Registration portal to create your account.',
        hi: 'नया खाता बनाने के लिए किसान पंजीकरण पोर्टल खोला जा रहा है।',
        mr: 'नवीन खाते तयार करण्यासाठी शेतकरी नोंदणी पोर्टल उघडत आहे.',
        ta: 'விவசாயி பதிவு போர்டல் திறக்கப்படுகிறது.',
        te: 'రైతు నమోదు పోర్టల్ తెరవబడుతోంది.',
        bn: 'কৃষক নিবন্ধন পোর্টাল খোলা হচ্ছে।',
        kn: 'ರೈತರ ನೋಂದಣಿ ಪೋರ್ಟಲ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
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
      register_buyer: {
        en: 'Opening the Commercial Buyer registration portal.',
        hi: 'व्यापारी पंजीकरण पोर्टल खोला जा रहा है।',
        mr: 'व्यापारी नोंदणी पोर्टल उघडत आहे.',
        ta: 'வணிக வாங்குபவர் பதிவு போர்டல் திறக்கப்படுகிறது.',
        te: 'వాణిజ్య కొనుగోలుదారు నమోదు పోర్టల్ తెరవబడుతోంది.',
        bn: 'বাণিজ্যিক ক্রেতা নিবন্ধন পোর্টাল খোলা হচ্ছে।',
        kn: 'ವಾಣಿಜ್ಯ ಖರೀದಿದಾರರ ನೋಂದಣಿ ಪೋರ್ಟಲ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
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
      register_transporter: {
        en: 'Opening the Transporter fleet registration portal.',
        hi: 'ट्रांसपोर्टर पंजीकरण पोर्टल खोला जा रहा है।',
        mr: 'वाहतूकदार नोंदणी पोर्टल उघडत आहे.',
        ta: 'போக்குவரத்து பதிவு போர்டல் திறக்கப்படுகிறது.',
        te: 'రవాణాదారు నమోదు పోర్టಲ್ తెరవబడుతోంది.',
        bn: 'পরিবহনকারী নিবন্ধন পোর্টাল খোলা হচ্ছে।',
        kn: 'ಸಾರಿಗೆದಾರರ ನೋಂದಣಿ ಪೋರ್ಟಲ್ ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
      },
      login_general: {
        en: 'Please select your role portal to sign in securely (Farmer, Buyer, or Transporter).',
        hi: 'कृपया सुरक्षित लॉगिन के लिए अपना रोल चुनें (किसान, खरीदार, या ट्रांसपोर्टर)।',
        mr: 'कृपया सुरक्षित लॉगिनसाठी तुमची भूमिका निवडा (शेतकरी, खरेदीदार किंवा वाहतूकदार).',
        ta: 'பாதுகாப்பாக உள்நுழைய உங்கள் பாத்திரத்தைத் தேர்ந்தெடுக்கவும்.',
        te: 'దయచేసి సురक्षితంగా లాగిన్ అవ్వడానికి మీ పాత్రను ఎంచుకోండి.',
        bn: 'অনুগ্রহ করে নিরাপদ লগইনের জন্য আপনার ভূমিকা নির্বাচন করুন।',
        kn: 'ಸುರಕ್ಷಿತವಾಗಿ ಲಾಗಿನ್ ಮಾಡಲು ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
      },
      home: {
        en: 'Navigating to the AgriRoute Home page.',
        hi: 'एग्रीरूट के मुख्य पृष्ठ पर जा रहे हैं।',
        mr: 'मुख्य पृष्ठावर जात आहोत.',
        ta: 'முகப்புப் பக்கத்திற்கு செல்கிறது.',
        te: 'హోమ్ పేజీకి నావిగేట్ చేస్తోంది.',
        bn: 'মূল পৃষ্ঠায় যাচ্ছি।',
        kn: 'ಮುಖಪುಟಕ್ಕೆ ನ್ಯಾವಿಗೇಟ್ ಮಾಡಲಾಗುತ್ತಿದೆ.',
      },
      farmer_products: {
        en: 'Retrieving your registered products catalog from the database...',
        hi: 'डेटाबेस से आपकी पंजीकृत फसलों की सूची प्राप्त की जा रही है...',
        mr: 'डेटाबेसमधून तुमच्या पिकांची यादी आणत आहोत...',
        ta: 'உங்கள் பதிவுசெய்யப்பட்ட பயிர்களின் பட்டியல் பெறப்படுகிறது...',
        te: 'మీ నమోదిత ఉత్పత్తుల జాబితా పొందబడుతోంది...',
        bn: 'আপনার নিবন্ধিত ফসলের তালিকা আনা হচ্ছে...',
        kn: 'ನಿಮ್ಮ ನೋಂದಾಯಿತ ಉತ್ಪನ್ನಗಳ ಪಟ್ಟಿಯನ್ನು ಪಡೆಯಲಾಗುತ್ತಿದೆ...',
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
        en: 'Preparing a logistics transport request for your produce...',
        hi: 'आपकी फसल के लिए लॉजिस्टिक्स ट्रांसपोर्ट अनुरोध तैयार किया जा रहा है...',
        mr: 'तुमच्या शेतमालासाठी वाहतूक विनंती तयार करत आहोत...',
        ta: 'உங்கள் விளைபொருட்களுக்கான போக்குவரத்து கோரிக்கை தயாரிக்கப்படுகிறது...',
        te: 'మీ ఉత్పత్తుల రవాణా అభ్యర్థన సిద్ధం చేయబడుతోంది...',
        bn: 'আপনার ফসলের জন্য পরিবহন অনুরোধ প্রস্তুত করা হচ্ছে...',
        kn: 'ನಿಮ್ಮ ಉತ್ಪನ್ನಗಳ ಸಾರಿಗೆ ವಿನಂತಿ ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...',
      },
      farmer_markets: {
        en: 'Retrieving live APMC Market Demands from buyers...',
        hi: 'व्यापारियों से लाइव मंडी मांग प्राप्त की जा रही है...',
        mr: 'थेट बाजार मागणी आणत आहोत...',
        ta: 'சந்தை தேவைகள் பெறப்படுகின்றன...',
        te: 'ప్రత్యక్ష మార్కెట్ డిమాండ్లు పొందబడుతున్నాయి...',
        bn: 'লাইভ বাজার চাহিদা আনা হচ্ছে...',
        kn: 'ನೇರ ಮಾರುಕಟ್ಟೆ ಬೇಡಿಕೆಗಳನ್ನು ಪಡೆಯಲಾಗುತ್ತಿದೆ...',
      },
      farmer_deliveries: {
        en: 'Retrieving your active shipments and tracking status...',
        hi: 'आपकी सक्रिय शिपमेंट और ट्रैकिंग स्थिति प्राप्त की जा रही है...',
        mr: 'तुमच्या सक्रिय डिलिव्हरी आणि ट्रॅकिंग आणत आहोत...',
        ta: 'உங்கள் விநியோகங்களின் நிலை பெறப்படுகிறது...',
        te: 'మీ షిప్‌మెంట్ల ట్రాకింగ్ స్థితి పొందబడుతోంది...',
        bn: 'আপনার ডেলিভারির অবস্থা আনা হচ্ছে...',
        kn: 'ನಿಮ್ಮ ಡೆಲಿವರಿಗಳ ಸ್ಥಿತಿ ಪಡೆಯಲಾಗುತ್ತಿದೆ...',
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
        en: 'Preparing bulk procurement request form for you...',
        hi: 'आपके लिए खरीद मांग अनुरोध तैयार किया जा रहा है...',
        mr: 'खरेदी मागणी नोंदणी तयार करत आहोत...',
        ta: 'கொள்முதல் கோரிக்கை படிவம் தயாரிக்கப்படுகிறது...',
        te: 'కొనుగోలు అభ్యర్థన సిద్ధం చేయబడుతోంది...',
        bn: 'ক্রয় অনুরোধ প্রস্তুত করা হচ্ছে...',
        kn: 'ಖರೀದಿ ವಿನಂತಿ ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ...',
      },
      buyer_produce: {
        en: 'Fetching farm fresh produce catalog across regional farmers...',
        hi: 'क्षेत्रीय किसानों से उपलब्ध ताज़ा उपज सूची लाई जा रही है...',
        mr: 'शेतकऱ्यांकडून उपलब्ध शेतमालाची सूची आणत आहोत...',
        ta: 'விவசாய விளைபொருட்கள் பட்டியல் பெறப்படுகிறது...',
        te: 'రైతు ఉత్పత్తుల కేటలాగ్ పొందబడుతోంది...',
        bn: 'কৃষক পণ্যের ক্যাটালগ আনা হচ্ছে...',
        kn: 'ರೈತರ ಉತ್ಪನ್ನಗಳ ಪಟ್ಟಿ ಪಡೆಯಲಾಗುತ್ತಿದೆ...',
      },
      buyer_orders: {
        en: 'Retrieving your active procurement orders and live tracking...',
        hi: 'आपके खरीद ऑर्डर्स और लाइव ट्रैकिंग प्राप्त की जा रही है...',
        mr: 'तुमच्या ऑर्डर्स आणि ट्रॅकिंग आणत आहोत...',
        ta: 'உங்கள் ஆர்டர்கள் பெறப்படுகின்றன...',
        te: 'మీ ఆర్డర్ల సమాచారం పొందబడుతోంది...',
        bn: 'আপনার অর্ডার আনা হচ্ছে...',
        kn: 'ನಿಮ್ಮ ಆರ್ಡರ್‌ಗಳನ್ನು ಪಡೆಯಲಾಗುತ್ತಿದೆ...',
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
        en: 'Fetching available pickup loads and farmer requests...',
        hi: 'उपलब्ध कृषि माल भाड़ा और ट्रिप्स ढूंढी जा रही हैं...',
        mr: 'उपलब्ध फेऱ्या आणि मालवाहतूक शोधत आहोत...',
        ta: 'கிடைக்கும் சுமைகள் பெறப்படுகின்றன...',
        te: 'అందుబాటులో ఉన్న లోడ్లు పొందబడుతున్నాయి...',
        bn: 'উপলব্ধ ট্রিপ লোড আনা হচ্ছে...',
        kn: 'ಲಭ್ಯವಿರುವ ಲೋಡ್‌ಗಳನ್ನು ಪಡೆಯಲಾಗುತ್ತಿದೆ...',
      },
      transporter_active_trips: {
        en: 'Fetching your ongoing active shipments...',
        hi: 'आपकी चल रही सक्रिय यात्राएं प्राप्त की जा रही हैं...',
        mr: 'तुमच्या चालू फेऱ्यांची माहिती आणत आहोत...',
        ta: 'செயலில் உள்ள பயணங்கள் பெறப்படுகின்றன...',
        te: 'నడుస్తున్న ట్రిప్పుల సమాచారం పొందబడుతోంది...',
        bn: 'চলমান ট্রিপ আনা হচ্ছে...',
        kn: 'ಚಾಲನೆಯಲ್ಲಿರುವ ಟ್ರಿಪ್‌ಗಳನ್ನು ಪಡೆಯಲಾಗುತ್ತಿದೆ...',
      },
      transporter_vehicles: {
        en: 'Fetching your registered fleet and vehicles...',
        hi: 'आपके पंजीकृत वाहनों की सूची प्राप्त की जा रही है...',
        mr: 'तुमच्या वाहनांची यादी आणत आहोत...',
        ta: 'உங்கள் வாகனங்கள் பட்டியல் பெறப்படுகிறது...',
        te: 'మీ వాహనాల జాబితా పొందబడుతోంది...',
        bn: 'আপনার যানবাহন তালিকা আনা হচ্ছে...',
        kn: 'ನಿಮ್ಮ ವಾಹನಗಳ ಪಟ್ಟಿ ಪಡೆಯಲಾಗುತ್ತಿದೆ...',
      },
      transporter_earnings: {
        en: 'Calculating your completed trip earnings and settlements...',
        hi: 'आपकी कुल कमाई और भुगतान गणना की जा रही है...',
        mr: 'तुमची एकूण कमाई मोजत आहोत...',
        ta: 'உங்கள் வருவாய் கணக்கிடப்படுகிறது...',
        te: 'మీ ఆదాయం లెక్కించబడుతోంది...',
        bn: 'আপনার উপার্জনের হিসাব করা হচ্ছে...',
        kn: 'ನಿಮ್ಮ ಒಟ್ಟು ಆದಾಯವನ್ನು ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ...',
      },
      transporter_performance: {
        en: 'Opening your Transporter Performance & Ratings report.',
        hi: 'आपकी प्रदर्शन रिपोर्ट और रेटिंग्स खोली जा रही हैं।',
        mr: 'तुमचा कामगिरी अहवाल उघडत आहे.',
        ta: 'செயல்திறன் அறிக்கை திறக்கப்படுகிறது.',
        te: 'పనితీరు నివేదిక తెరవబడుతోంది.',
        bn: 'পারফরম্যান্স রিপোর্ট খোলা হচ্ছে।',
        kn: 'ಕಾರ್ಯಕ್ಷಮತೆ ವರದಿ ತೆರೆಯಲಾಗುತ್ತಿದೆ.',
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
        en: "Welcome! I'll open the Farmer portal for you. As a farmer, you can list harvest batches, request transport, and check market demand.",
        hi: 'नमस्ते! मैं आपको किसान पोर्टल पर ले जा रही हूँ। आप अपनी फसल लिस्ट कर सकते हैं और गाड़ी बुक कर सकते हैं।',
        mr: 'नमस्कार! मी तुम्हाला शेतकरी पोर्टलवर नेत आहे. तुम्ही शेतमाल नोंदवू शकता आणि वाहतूक मागवू शकता.',
        ta: 'வணக்கம்! நான் உங்களை விவசாயி போர்ட்டலுக்கு அழைத்துச் செல்கிறேன்.',
        te: 'నమస్కారం! నేను మిమ్మల్ని రైతు పోర్టల్‌కు తీసుకెళ్తున్నాను.',
        bn: 'স্বাগতম! আমি আপনাকে কৃষক পোর্টালে নিয়ে যাচ্ছি।',
        kn: 'ಸ್ವಾಗತ! ನಾನು ನಿಮ್ಮನ್ನು ರೈತರ ಪೋರ್ಟಲ್‌ಗೆ ಕರೆದೊಯ್ಯುತ್ತಿದ್ದೇನೆ.',
      },
      role_buyer_ack: {
        en: "Welcome! I'll open the Commercial Buyer portal for you. You can browse farm fresh crops and post bulk procurement requests.",
        hi: 'नमस्ते! मैं आपको व्यापारी पोर्टल पर ले जा रही हूँ। आप किसानों से ताज़ा उपज खरीद सकते हैं और मांग पोस्ट कर सकते हैं।',
        mr: 'नमस्कार! मी तुम्हाला व्यापारी पोर्टलवर नेत आहे. तुम्ही थेट शेतमाल खरेदी करू शकता.',
        ta: 'வணக்கம்! நான் உங்களை வணிக வாங்குபவர் போர்ட்டலுக்கு அழைத்துச் செல்கிறேன்.',
        te: 'నమస్కారం! నేను మిమ్మల్ని కొనుగోలుదారు పోర్టల్‌కు తీసుకెళ్తున్నాను.',
        bn: 'স্বাগতম! আমি আপনাকে ক্রেতা পোর্টালে নিয়ে যাচ্ছি।',
        kn: 'ಸ್ವಾಗತ! ನಾನು ನಿಮ್ಮನ್ನು ಖರೀದಿದಾರರ ಪೋರ್ಟಲ್‌ಗೆ ಕರೆದೊಯ್ಯುತ್ತಿದ್ದೇನೆ.',
      },
      role_transporter_ack: {
        en: "Welcome! I'll open the Transporter portal for you. You can manage your fleet, discover pickup loads, and track earnings.",
        hi: 'नमस्ते! मैं आपको ट्रांसपोर्टर पोर्टल पर ले जा रही हूँ। आप अपनी गाड़ियां मैनेज कर सकते हैं और भाड़ा ढूंढ सकते हैं।',
        mr: 'नमस्कार! मी तुम्हाला वाहतूकदार पोर्टलवर नेत आहे. तुम्ही गाड्या नोंदवू शकता आणि फेऱ्या शोधू शकता.',
        ta: 'வணக்கம்! நான் உங்களை போக்குவரத்து போர்ட்டலுக்கு அழைத்துச் செல்கிறேன்.',
        te: 'నమస్కారం! నేను మిమ్మల్ని రవాణాదారు పోర్టల్‌కు తీసుకెళ్తున్నాను.',
        bn: 'স্বাগতম! আমি আপনাকে পরিবহনকারী পোর্টালে নিয়ে যাচ্ছি।',
        kn: 'ಸ್ವಾಗತ! ನಾನು ನಿಮ್ಮನ್ನು ಸಾರಿಗೆದಾರರ ಪೋರ್ಟಲ್‌ಗೆ ಕರೆದೊಯ್ಯುತ್ತಿದ್ದೇನೆ.',
      },
    };

    return dict[key]?.[lang] || dict[key]?.['en'] || 'How may I assist you with AgriRoute logistics?';
  }

  private getRoleMismatchMessage(intent: ElaIntent, userRole: UserRole, lang: SupportedLanguage): string {
    const messages: Record<SupportedLanguage, string> = {
      en: `This action belongs to another role portal. You are currently authenticated as ${userRole}. Here are the actions available for you:`,
      hi: `यह सुविधा दूसरी भूमिका के लिए है। आप वर्तमान में ${userRole} के रूप में लॉग इन हैं। आपके लिए उपलब्ध विकल्प:`,
      mr: `ही सुविधा दुसऱ्या भूमिकेसाठी आहे. तुम्ही सध्या ${userRole} म्हणून लॉग इन आहात. तुमच्यासाठी पर्याय:`,
      ta: `இந்த செயல் மற்றொரு பாத்திரத்திற்கு உரியது. நீங்கள் ${userRole} ஆக உள்நுழைந்துள்ளீர்கள்.`,
      te: `ఈ చర్య మరొక పాత్రకు చెందినది. మీరు ప్రస్తుతం ${userRole}గా లాగిన్ అయ్యారు.`,
      bn: `এই কাজটি অন্য ভূমিকার জন্য। আপনি বর্তমানে ${userRole} হিসেবে লগ ইন আছেন।`,
      kn: `ಈ ಕ್ರಿಯೆಯು ಮತ್ತೊಂದು ಪಾತ್ರಕ್ಕೆ ಸೇರಿದೆ. ನೀವು ಪ್ರಸ್ತುತ ${userRole} ಆಗಿ ಲಾಗಿನ್ ಆಗಿದ್ದೀರಿ.`,
    };
    return messages[lang] || messages['en'];
  }

  private getDefaultGreeting(role: UserRole, lang: SupportedLanguage): string {
    const greetings: Record<SupportedLanguage, string> = {
      en: "Hello! I'm ELA, your AgriRoute logistics intelligence assistant. How can I help you manage your produce, procurement, or trips today?",
      hi: "नमस्ते! मैं ईला (ELA) हूँ, आपकी एग्रीरूट लॉजिस्टिक्स सहायक। आज मैं आपकी फसल, खरीद या ट्रिप्स में क्या सहायता कर सकती हूँ?",
      mr: "नमस्कार! मी ईला (ELA), तुमची अ‍ॅग्रीरूट लॉजिस्टिक्स सहाय्यक. शेतमाल, खरेदी किंवा वाहतुकीत मी तुम्हाला कशी मदत करू शकेन?",
      ta: "வணக்கம்! நான் இலா (ELA), உங்கள் அக்ரூட் தளவாட உதவியாளர். இன்று நான் உங்களுக்கு எப்படி உதவ முடியும்?",
      te: "నమస్కారం! నేను ఎలా (ELA), మీ అగ్రిరూట్ లాజిస్టిక్స్ అసిస్టెంట్. నేను మీకు ఎలా సహాయపడగలను?",
      bn: "নমস্কার! আমি ইলা (ELA), আপনার এগ্রিরুট লজিস্টিক সহকারী। আজ আমি আপনাকে কীভাবে সাহায্য করতে পারি?",
      kn: "ನಮಸ್ಕಾರ! ನಾನು ಇಲಾ (ELA), ನಿಮ್ಮ ಅಗ್ರಿರೌಟ್ ಲಾಜಿಸ್ಟಿಕ್ಸ್ ಸಹಾಯಕ. ಇಂದು ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು?",
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
