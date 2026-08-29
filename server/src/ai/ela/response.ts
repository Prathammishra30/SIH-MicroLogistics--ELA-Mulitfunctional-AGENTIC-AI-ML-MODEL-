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

    if (lang === 'mr') return ['शेतकरी लॉगिन', 'व्यापारी लॉगिन', 'वाहतूकदार लॉगिन', 'मुख्य पृष्ठ'];
    if (lang === 'hi') return ['किसान लॉगिन', 'व्यापारी लॉगिन', 'ट्रांसपोर्टर लॉगिन', 'मुख्य पृष्ठ'];
    return ['Farmer Login', 'Buyer Login', 'Transporter Login', 'Home Page'];
  }
}
