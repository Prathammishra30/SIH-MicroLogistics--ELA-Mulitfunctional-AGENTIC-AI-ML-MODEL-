// ELA Response Builder & Natural Language Formatter
// Builds localized agent responses, ML confidence badges, and actionable suggestion chips

import type {
  UserRole,
  SupportedLanguage,
  ElaChatResponse,
  ElaNavigationAction,
  ElaConfirmationAction,
  ElaIntent,
} from '../ela.types.js';
import type { PredictionResult } from '../ml/types.js';

export class ResponseBuilder {
  public static buildResponse(params: {
    message: string;
    intent: ElaIntent;
    language: SupportedLanguage;
    role: UserRole;
    navigationAction?: ElaNavigationAction | null;
    confirmationAction?: ElaConfirmationAction | null;
    actionResult?: { toolName: string; success: boolean; data?: unknown; error?: string } | null;
    mlPrediction?: PredictionResult<unknown> | null;
    suggestions?: string[];
  }): ElaChatResponse {
    let finalMessage = params.message;

    // Attach ML prediction explanation if available
    if (params.mlPrediction?.explanation) {
      finalMessage += `\n\n🤖 **ELA Predictive Insights (${params.mlPrediction.modelName} ${params.mlPrediction.modelVersion})**:\n${params.mlPrediction.explanation}`;
    }

    return {
      message: finalMessage,
      intent: params.intent,
      language: params.language,
      detectedRole: params.role,
      navigationAction: params.navigationAction || null,
      confirmationAction: params.confirmationAction || null,
      actionResult: params.actionResult || null,
      suggestions: params.suggestions || this.getDefaultSuggestions(params.role, params.language),
      timestamp: new Date().toISOString(),
    };
  }

  public static getDefaultSuggestions(role: UserRole, lang: SupportedLanguage): string[] {
    if (role === 'FARMER') {
      if (lang === 'mr') return ['माझी उत्पादने', 'बाजार मागणी', 'माझी डिलिव्हरी', 'वाहतूक मागणी'];
      if (lang === 'hi') return ['मेरे उत्पाद', 'मंडी मांग', 'मेरी डिलीवरी', 'गाड़ी बुक करें'];
      if (lang === 'ta') return ['எனது பொருட்கள்', 'சந்தை தேவை', 'விநியோகங்கள்', 'போக்குவரத்து கோரிக்கை'];
      if (lang === 'te') return ['నా ఉత్పత్తులు', 'మార్కెట్ డిమాండ్', 'డెలివరీలు', 'రవాణా అభ్యర్థన'];
      if (lang === 'bn') return ['আমার পণ্য', 'বাজার চাহিদা', 'ডেলিভারি', 'লজিস্টিক অনুরোধ'];
      if (lang === 'kn') return ['ನನ್ನ ಉತ್ಪನ್ನಗಳು', 'ಮಾರುಕಟ್ಟೆ ಬೇಡಿಕೆ', 'ಡೆಲಿವರಿಗಳು', 'ಸಾರಿಗೆ ವಿನಂತಿ'];
      return ['My Products', 'Market Demand', 'Deliveries', 'Request Transport'];
    }
    if (role === 'BUYER') {
      if (lang === 'mr') return ['खरेदी मागणी नोंदवा', 'शेतमाल शोधा', 'माझ्या ऑर्डर्स', 'शेतकरी नेटवर्क'];
      if (lang === 'hi') return ['खरीद मांग पोस्ट करें', 'उपज देखें', 'मेरे ऑर्डर्स', 'किसान नेटवर्क'];
      if (lang === 'ta') return ['கொள்முதல் கோரிக்கை', 'பொருட்களின் பட்டியல்', 'ஆர்டர்கள்', 'விவசாயிகள்'];
      if (lang === 'te') return ['సేకరణ డిమాండ్', 'ఉత్పత్తుల కేటలాగ్', 'ఆర్డర్లు', 'రైతు నెట్‌వర్క్'];
      if (lang === 'bn') return ['ক্রয় পোস্ট করুন', 'পণ্য ক্যাটালগ', 'অর্ডার', 'কৃষক নেটওয়ার্ক'];
      if (lang === 'kn') return ['ಖರೀದಿ ಪೋಸ್ಟ್ ಮಾಡಿ', 'ಉತ್ಪನ್ನಗಳ ಪಟ್ಟಿ', 'ಆರ್ಡರ್‌ಗಳು', 'ರೈತ ಜಾಲ'];
      return ['Post Procurement', 'Produce Catalog', 'Orders', 'Farmer Network'];
    }
    if (role === 'TRANSPORTER') {
      if (lang === 'mr') return ['उपलब्ध फेऱ्या', 'सक्रिय फेऱ्या', 'माझी वाहने', 'माझी कमाई'];
      if (lang === 'hi') return ['उपलब्ध ट्रिप्स', 'सक्रिय ट्रिप्स', 'मेरी गाड़ियां', 'मेरी कमाई'];
      if (lang === 'ta') return ['கிடைக்கும் பயணங்கள்', 'செயலில் உள்ள பயணங்கள்', 'எனது வாகனங்கள்', 'வருமானம்'];
      if (lang === 'te') return ['అందుబాటులో ఉన్న ట్రిప్పులు', 'యాక్టివ్ ట్రిప్పులు', 'నా వాహనాలు', 'ఆదాయం'];
      if (lang === 'bn') return ['উপলব্ধ ট্রিপ', 'সক্রিয় ট্রিপ', 'আমার যানবাহন', 'উপার্জন'];
      if (lang === 'kn') return ['ಲಭ್ಯವಿರುವ ಟ್ರಿಪ್‌ಗಳು', 'ಸಕ್ರಿಯ ಟ್ರಿಪ್‌ಗಳು', 'ನನ್ನ ವಾಹನಗಳು', 'ಗಳಿಕೆ'];
      return ['Available Trips', 'Active Trips', 'My Vehicles', 'Earnings'];
    }

    // Universal / Guest Suggestions
    if (lang === 'mr') return ['पोर्टल निवडा', 'अ‍ॅग्रीरूट कसे कार्य करते', 'लॉगिन मदत', 'ईला काय करू शकते?'];
    if (lang === 'hi') return ['पोर्टल चुनें', 'एग्रीरूट कैसे काम करता है', 'लॉगिन में मदद', 'ईला क्या कर सकती है?'];
    if (lang === 'ta') return ['போர்ட்டலைத் தேர்வுசெய்க', 'அக்ரிரூட் எவ்வாறு செயல்படுகிறது', 'உள்நுழைவு உதவி', 'இலா என்ன செய்ய முடியும்?'];
    if (lang === 'te') return ['పోర్టల్ ఎంచుకోండి', 'అగ్రిరూట్ ఎలా పనిచేస్తుంది', 'లాగిన్ సహాయం', 'ఎలా ఏమి చేయగలదు?'];
    if (lang === 'bn') return ['পোর্টাল নির্বাচন করুন', 'অ্যাগ্রিরুট কীভাবে কাজ করে', 'লগইন সাহায্য', 'ইলা কী করতে পারে?'];
    if (lang === 'kn') return ['ಪೋರ್ಟಲ್ ಆಯ್ಕೆಮಾಡಿ', 'ಅಗ್ರಿರೌಟ್ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ', 'ಲಾಗಿನ್ ಸಹಾಯ', 'ಇಲಾ ಏನು ಮಾಡಬಲ್ಲದು?'];
    return ['Choose Portal', 'How AgriRoute Works', 'Help Me Login', 'What Can You Do?'];
  }
}
