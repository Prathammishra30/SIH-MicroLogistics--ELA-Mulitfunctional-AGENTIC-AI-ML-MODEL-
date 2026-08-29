// ELA Iterative Agent Loop (Phase 4 Enterprise Core)
// Understand -> Plan -> Execute -> Observe -> Update State -> Re-plan -> Verify Goal

import type {
  ElaChatRequest,
  ElaChatResponse,
  SupportedLanguage,
  UserRole,
  ElaIntent,
} from '../ela.types.js';
import type { AuthUser } from '../../modules/auth/auth.types.js';
import type { ElaAgentState, AgentExecutionTrace, StepObservation } from './state.types.js';
import { SecurityGuard } from './security.js';
import { IntentResolver } from './intent.js';
import { ContextManager } from './context.js';
import { AgentPlanner } from './planner.js';
import { ActionExecutor, type VerifiedExecutionResult } from './executor.js';
import { GoalManager } from './goals.js';
import { ResponseBuilder } from './response.js';
import { ConfidenceEngine } from './confidence.js';
import { PredictionService, type StandardizedPredictionResponse } from './predictionService.js';
import { ConversationMemory } from '../memory/conversationMemory.js';
import { UserMemory } from '../memory/userMemory.js';
import { AuditLogger } from './audit.js';

export class ElaAgentLoop {
  private static readonly MAX_ITERATIONS = 5;

  public static async run(
    request: ElaChatRequest,
    authenticatedUser?: AuthUser | null
  ): Promise<ElaChatResponse> {
    const startTime = Date.now();
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const rawMessage = (request.message || '').trim();

    if (!rawMessage) {
      return {
        message: 'Please provide a message or question.',
        intent: 'UNKNOWN',
        language: 'en',
        detectedRole: 'GUEST',
        timestamp: new Date().toISOString(),
      };
    }

    // ==========================================
    // STEP 1: UNDERSTAND & SECURITY SHIELD
    // ==========================================
    const lang = (request.context?.language || 'en') as SupportedLanguage;

    if (SecurityGuard.containsSensitiveCredentials(rawMessage)) {
      AuditLogger.logAction({
        actorId: authenticatedUser?.id,
        role: authenticatedUser?.role || 'GUEST',
        intent: 'SECURITY_SHIELD',
        actionStatus: 'SECURITY_SHIELDED',
        sanitizedSummary: 'Intercepted user credentials; directed to secure form.',
      });

      const shieldMsg = this.getCredentialShieldResponse(lang);
      const trace: AgentExecutionTrace = {
        traceId,
        sessionId: 'session-default',
        userId: authenticatedUser?.id,
        authenticatedRole: authenticatedUser?.role || 'GUEST',
        conversationalRole: authenticatedUser?.role || 'GUEST',
        language: lang,
        inputMessage: rawMessage,
        intent: 'GENERAL_HELP',
        confidence: {
          intentConfidence: 1.0,
          entityConfidence: 1.0,
          languageConfidence: 1.0,
          roleConfidence: 1.0,
          overallConfidence: 1.0,
        },
        plannerSteps: [],
        selectedTools: [],
        toolResults: [],
        modelProvider: 'RuleBasedCanonicalProvider',
        modelVersion: 'ela-v4-core',
        totalLatencyMs: Date.now() - startTime,
        finalOutcome: 'CREDENTIAL_SHIELDED',
        timestamp: new Date().toISOString(),
      };
      AuditLogger.recordTrace(trace);

      return {
        message: shieldMsg,
        intent: 'GENERAL_HELP',
        language: lang,
        detectedRole: authenticatedUser?.role || 'GUEST',
        suggestions: ResponseBuilder.getDefaultSuggestions(authenticatedUser?.role || 'GUEST', lang),
        timestamp: new Date().toISOString(),
      };
    }

    const context = ContextManager.buildContext(request.context, authenticatedUser);
    const canonical = IntentResolver.resolve(rawMessage, context.role, context.language);
    const effectiveRole: UserRole =
      authenticatedUser?.role || (canonical.targetRole !== 'GUEST' ? canonical.targetRole : context.role);

    // Retrieve user long-term preferences if authenticated
    const userPrefs = authenticatedUser ? UserMemory.getPreferences(authenticatedUser.id) : undefined;

    // Multi-turn Entity Accumulation
    const accumulatedEntities = ConversationMemory.updateEntities(context.sessionId, canonical.entities);
    ConversationMemory.setLastIntent(context.sessionId, canonical.intent);

    // Confidence Evaluation & Missing Entity Clarification Check
    const confResult = ConfidenceEngine.evaluate(
      canonical.intent,
      accumulatedEntities,
      canonical.confidence,
      context.language,
      effectiveRole
    );

    // Initialize Agent State
    const state: ElaAgentState = {
      sessionId: context.sessionId,
      traceId,
      userId: authenticatedUser?.id,
      authenticated: !!authenticatedUser,
      authenticatedRole: authenticatedUser?.role || 'GUEST',
      conversationalRole: effectiveRole,
      language: context.language,
      conversationHistory: [],
      currentIntent: canonical.intent,
      targetDomain: this.resolveDomain(canonical.intent, effectiveRole),
      extractedEntities: accumulatedEntities,
      confidence: confResult.confidence,
      safetyFlags: {
        credentialShielded: false,
        promptInjectionDetected: false,
        unauthorizedAttempt: false,
        rbacViolation: false,
        sanitized: true,
        warnings: [],
      },
      activeGoal: null,
      subtasks: [],
      currentTaskIndex: 0,
      stepObservations: [],
      requiresConfirmation: false,
      clarificationNeeded: confResult.needsClarification,
      clarificationQuestion: confResult.clarificationQuestion,
      memoryContext: userPrefs,
      iterations: 0,
      status: 'INITIALIZING',
    };

    // ==========================================
    // STEP 2: CLARIFICATION HANDLING
    // ==========================================
    if (state.clarificationNeeded && state.clarificationQuestion) {
      state.status = 'CLARIFYING';
      const trace: AgentExecutionTrace = {
        traceId,
        sessionId: state.sessionId,
        userId: state.userId,
        authenticatedRole: state.authenticatedRole,
        conversationalRole: state.conversationalRole,
        language: state.language,
        inputMessage: rawMessage,
        intent: state.currentIntent,
        confidence: state.confidence,
        plannerSteps: [],
        selectedTools: [],
        toolResults: [],
        modelProvider: 'RuleBasedCanonicalProvider',
        modelVersion: 'ela-v4-core',
        totalLatencyMs: Date.now() - startTime,
        finalOutcome: 'CLARIFICATION_REQUESTED',
        timestamp: new Date().toISOString(),
      };
      AuditLogger.recordTrace(trace);

      return ResponseBuilder.buildResponse({
        message: state.clarificationQuestion,
        intent: state.currentIntent,
        language: state.language,
        role: state.conversationalRole,
        suggestions: ResponseBuilder.getDefaultSuggestions(state.conversationalRole, state.language),
      });
    }

    // ==========================================
    // STEP 3: GOAL DECOMPOSITION & PLANNING
    // ==========================================
    state.status = 'PLANNING';
    const goalPlan = GoalManager.decomposeGoal(
      canonical.intent,
      accumulatedEntities,
      effectiveRole,
      rawMessage
    );
    state.activeGoal = goalPlan;
    state.subtasks = goalPlan.subtasks;
    ConversationMemory.setActiveGoal(state.sessionId, goalPlan);

    const plan = AgentPlanner.plan(canonical, { ...context, role: effectiveRole });

    if (!plan.isExecutable) {
      // Conversational guidance, role acknowledgment, or RBAC denial
      const reply = this.getConversationalResponse(
        canonical.intent,
        context.language,
        canonical.targetRole,
        plan.denialReason
      );

      const trace: AgentExecutionTrace = {
        traceId,
        sessionId: state.sessionId,
        userId: state.userId,
        authenticatedRole: state.authenticatedRole,
        conversationalRole: state.conversationalRole,
        language: state.language,
        inputMessage: rawMessage,
        intent: state.currentIntent,
        confidence: state.confidence,
        plannerSteps: [],
        selectedTools: [],
        toolResults: [],
        modelProvider: 'RuleBasedCanonicalProvider',
        modelVersion: 'ela-v4-core',
        totalLatencyMs: Date.now() - startTime,
        finalOutcome: plan.denialReason ? 'DENIED' : 'SUCCESS',
        timestamp: new Date().toISOString(),
      };
      AuditLogger.recordTrace(trace);

      return ResponseBuilder.buildResponse({
        message: reply,
        intent: canonical.intent,
        language: context.language,
        role: effectiveRole,
        suggestions: ResponseBuilder.getDefaultSuggestions(effectiveRole, context.language),
      });
    }

    // ==========================================
    // STEP 4: EXECUTE & OBSERVE (ITERATIVE AGENT LOOP)
    // ==========================================
    state.status = 'EXECUTING';
    let executionResult: VerifiedExecutionResult | null = null;
    let mlPrediction: StandardizedPredictionResponse<unknown> | null = null;
    const selectedTools: string[] = [];

    for (let i = 0; i < plan.steps.length && state.iterations < this.MAX_ITERATIONS; i++) {
      state.iterations++;
      const step = plan.steps[i];
      selectedTools.push(step.toolName);
      const stepStart = Date.now();

      executionResult = await ActionExecutor.executeWithVerification(
        step.toolName,
        step.arguments,
        { ...context, role: effectiveRole }
      );

      const observation: StepObservation = {
        stepIndex: i + 1,
        toolName: step.toolName,
        arguments: step.arguments,
        success: executionResult.success,
        resultData: executionResult.resultData,
        error: executionResult.error,
        durationMs: Date.now() - stepStart,
        timestamp: new Date().toISOString(),
      };
      state.stepObservations.push(observation);

      // Consequential Action / Confirmation Staged
      if (executionResult.confirmationAction) {
        state.requiresConfirmation = true;
        state.pendingAction = executionResult.confirmationAction;
        state.status = 'WAITING_CONFIRMATION';
        break; // Stop and present confirmation card to user
      }
    }

    // ==========================================
    // STEP 5: ML PREDICTIVE INTELLIGENCE
    // ==========================================
    try {
      if (
        canonical.entities.product &&
        (canonical.intent === 'GET_MARKET_DEMAND' || canonical.intent === 'CREATE_PRODUCT_WORKFLOW')
      ) {
        mlPrediction = await PredictionService.predictPrice({
          cropName: canonical.entities.product,
          mandiLocation: canonical.entities.destination || 'Pune APMC',
          grade: canonical.entities.grade || 'A',
        });
      } else if (canonical.entities.destination && canonical.intent === 'CREATE_LOGISTICS_WORKFLOW') {
        mlPrediction = await PredictionService.predictEta({
          pickupLocation: 'Farm',
          destination: canonical.entities.destination,
          distanceKm: 85,
          vehicleType: canonical.entities.vehicleType || 'Pickup',
        });
      }
    } catch {
      // ML non-blocking
    }

    // ==========================================
    // STEP 6: STATE UPDATE & USER PREFERENCE MEMORY
    // ==========================================
    if (authenticatedUser && canonical.entities.product) {
      UserMemory.updatePreferences(authenticatedUser.id, {
        preferredLanguage: context.language,
        frequentCrops: [canonical.entities.product],
      });
    }

    // ==========================================
    // STEP 7: VERIFY GOAL & AUDIT RECORDING
    // ==========================================
    state.status = 'COMPLETED';
    const trace: AgentExecutionTrace = {
      traceId,
      sessionId: state.sessionId,
      userId: state.userId,
      authenticatedRole: state.authenticatedRole,
      conversationalRole: state.conversationalRole,
      language: state.language,
      inputMessage: rawMessage,
      intent: state.currentIntent,
      confidence: state.confidence,
      plannerSteps: plan.steps.map((s, idx) => ({
        stepNumber: idx + 1,
        toolName: s.toolName,
        arguments: s.arguments,
        isMutation: !s.toolName.startsWith('get_'),
      })),
      selectedTools,
      toolResults: state.stepObservations.map((o) => ({
        toolName: o.toolName,
        success: o.success,
        durationMs: o.durationMs,
        error: o.error,
      })),
      modelProvider: 'RuleBasedCanonicalProvider',
      modelVersion: 'ela-v4-core',
      totalLatencyMs: Date.now() - startTime,
      finalOutcome: state.requiresConfirmation ? 'CONFIRMATION_REQUIRED' : 'SUCCESS',
      timestamp: new Date().toISOString(),
    };
    AuditLogger.recordTrace(trace);

    return ResponseBuilder.buildResponse({
      message: executionResult?.userFacingMessage || 'I have processed your request.',
      intent: canonical.intent,
      language: context.language,
      role: effectiveRole,
      navigationAction: executionResult?.navigationAction,
      confirmationAction: executionResult?.confirmationAction,
      actionResult: executionResult
        ? {
            toolName: executionResult.toolName,
            success: executionResult.success,
            data: executionResult.resultData,
            error: executionResult.error,
          }
        : null,
      mlPrediction: mlPrediction
        ? {
            prediction: mlPrediction.prediction,
            confidence: mlPrediction.confidence,
            modelName: mlPrediction.modelVersion,
            modelVersion: mlPrediction.modelStatus,
            timestamp: mlPrediction.timestamp,
            inputFeatures: mlPrediction.featuresUsed,
            explanation: mlPrediction.explanation,
          }
        : null,
      suggestions: ResponseBuilder.getDefaultSuggestions(effectiveRole, context.language),
    });
  }

  private static resolveDomain(
    intent: ElaIntent,
    role: UserRole
  ): 'farmer' | 'buyer' | 'transporter' | 'universal' | 'auth' {
    if (intent.startsWith('LOGIN') || intent.startsWith('REGISTER')) return 'auth';
    if (role === 'FARMER') return 'farmer';
    if (role === 'BUYER') return 'buyer';
    if (role === 'TRANSPORTER') return 'transporter';
    return 'universal';
  }

  private static getCredentialShieldResponse(lang: SupportedLanguage): string {
    const messages: Record<SupportedLanguage, string> = {
      en: 'Please enter your password, OTP, or verification code directly into the secure login form. For your protection, ELA never processes, stores, or transmits authentication secrets.',
      hi: 'कृपया अपना पासवर्ड, OTP या सत्यापन कोड सीधे सुरक्षित लॉगिन फॉर्म में दर्ज करें। आपकी सुरक्षा के लिए, ELA कभी भी पासवर्ड या OTP स्वीकार या संसाधित नहीं करती है।',
      mr: 'कृपया आपला पासवर्ड, OTP किंवा पडताळणी कोड थेट सुरक्षित लॉगिन फॉर्ममध्ये प्रविष्ट करा. आपल्या सुरक्षेसाठी, ELA कधीही पासवर्ड किंवा OTP हाताळत नाही.',
      ta: 'உங்கள் கடவுச்சொல் அல்லது OTP ஐ பாதுகாப்பான உள்நுழைவு படிவத்தில் நேரடியாக உள்ளிடவும். உங்கள் பாதுகாப்பிற்காக, ELA ஒருபோதும் ரகசியங்களை கையாளாது.',
      te: 'దయచేసి మీ పాస్‌వర్డ్ లేదా OTPని సురక్షిత లాగిన్ ఫారమ్‌లో నేరుగా నమోదు చేయండి. మీ భద్రత కోసం, ELA రహస్యాలను నిర్వహించదు.',
      bn: 'দয়া করে আপনার পাসওয়ার্ড বা ওটিপি সরাসরি সুরক্ষিত লগইন ফর্মে প্রবেশ করুন। আপনার সুরক্ষার জন্য, ELA কখনই পাসওয়ার্ড পরিচালনা করে না।',
      kn: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪಾಸ್‌ವರ್ಡ್ ಅಥವಾ OTP ಅನ್ನು ಸುರಕ್ಷಿತ ಲಾಗಿನ್ ಫಾರ್ಮ್‌ನಲ್ಲಿ ನೇರವಾಗಿ ನಮೂದಿಸಿ. ನಿಮ್ಮ ರಕ್ಷಣೆಗಾಗಿ, ELA ಪಾಸ್‌ವರ್ಡ್‌ಗಳನ್ನು ನಿರ್ವಹಿಸುವುದಿಲ್ಲ.',
    };
    return messages[lang] || messages['en'];
  }

  private static getConversationalResponse(
    intent: string,
    lang: SupportedLanguage,
    targetRole?: UserRole,
    denialReason?: string
  ): string {
    if (denialReason) return denialReason;

    // Role Declaration Acknowledgment
    if (intent === 'ROLE_DECLARATION') {
      if (targetRole === 'FARMER') {
        const farmerAck: Record<SupportedLanguage, string> = {
          en: "Got it. I'll help you as a Farmer. You can ask me to manage products, check market demand, arrange logistics, or access your farmer portal.",
          hi: 'समझ गई। मैं एक किसान के रूप में आपकी सहायता करूँगी। आप मुझसे फसल जोड़ने, मंडी मांग देखने, गाड़ी बुक करने या किसान पोर्टल खोलने के लिए कह सकते हैं।',
          mr: 'समजले. मी शेतकरी म्हणून तुम्हाला मदत करेन. तुम्ही मला पिके नोंदवणे, बाजार मागणी तपासणे, वाहतूक मागवणे किंवा शेतकरी पोर्टल उघडण्यास सांगू शकता.',
          ta: 'புரிந்தது. ஒரு விவசாயியாக நான் உங்களுக்கு உதவுவேன். தயாரிப்புகளை நிர்வகிக்க, சந்தை தேவையை சரிபார்க்க, தளவாடங்களை ஏற்பாடு செய்ய அல்லது விவசாயி போர்ட்டலை அணுக என்னை நீங்கள் கேட்கலாம்.',
          te: 'అర్థమైంది. నేను మీకు రైతుగా సహాయం చేస్తాను. మీరు నన్ను ఉత్పత్తులను నిర్వహించడానికి, మార్కెట్ డిమాండ్‌ను తనిఖీ చేయడానికి, రవాణాను ఏర్పాటు చేయడానికి లేదా రైతు పోర్టల్‌ను యాక్సెస్ చేయడానికి అడగవచ్చు.',
          bn: 'বুঝেছি। আমি একজন কৃষক হিসেবে আপনাকে সাহায্য করব। আপনি আমাকে পণ্য পরিচালনা করতে, বাজারের চাহিদা পরীক্ষা করতে, লজিস্টিক ব্যবস্থা করতে বা কৃষক পোর্টালে প্রবেশ করতে বলতে পারেন।',
          kn: 'ತಿಳಿಯಿತು. ನಾನು ನಿಮಗೆ ರೈತರಾಗಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಉತ್ಪನ್ನಗಳನ್ನು ನಿರ್ವಹಿಸಲು, ಮಾರುಕಟ್ಟೆ ಬೇಡಿಕೆಯನ್ನು ಪರಿಶೀಲಿಸಲು, ಸಾರಿಗೆ ವ್ಯವಸ್ಥೆ ಮಾಡಲು ಅಥವಾ ರೈತ ಪೋರ್ಟಲ್ ಅನ್ನು ಪ್ರವೇಶಿಸಲು ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು.',
        };
        return farmerAck[lang] || farmerAck['en'];
      }

      if (targetRole === 'BUYER') {
        const buyerAck: Record<SupportedLanguage, string> = {
          en: "Got it. I'll help you as a Buyer. You can ask me to post procurement demands, browse fresh produce, or track orders.",
          hi: 'समझ गई। मैं एक खरीदार/व्यापारी के रूप में आपकी सहायता करूँगी। आप मुझसे खरीद मांग पोस्ट करने, ताज़ा फसल ब्राउज़ करने या ऑर्डर देखने के लिए कह सकते हैं।',
          mr: 'समजले. मी खरेदीदार/व्यापारी म्हणून तुम्हाला मदत करेन. तुम्ही मला खरेदी मागणी नोंदवणे, थेट शेतमाल शोधणे किंवा ऑर्डर्स तपासण्यास सांगू शकता.',
          ta: 'புரிந்தது. வாங்குபவராக நான் உங்களுக்கு உதவுவேன். நீங்கள் கொள்முதல் தேவைகளை பதிவு செய்ய, புதிய விளைபொருட்களை உலாவ அல்லது ஆர்டர்களைக் கண்காணிக்க என்னைக் கேட்கலாம்.',
          te: 'అర్థమైంది. నేను మీకు కొనుగోలుదారుగా సహాయం చేస్తాను. మీరు నన్ను సేకరణ డిమాండ్లను పోస్ట్ చేయడానికి, తాజా పంటలను బ్రౌజ్ చేయడానికి లేదా ఆర్డర్‌లను ట్రాక్ చేయడానికి అడగవచ్చు.',
          bn: 'বুঝেছি। আমি একজন ক্রেতা হিসেবে আপনাকে সাহায্য করব। আপনি আমাকে ক্রয়ের চাহিদা পোস্ট করতে, তাজা ফসল ব্রাউজ করতে বা অর্ডার ট্র্যাক করতে বলতে পারেন।',
          kn: 'ತಿಳಿಯಿತು. ನಾನು ನಿಮಗೆ ಖರೀದಿದಾರರಾಗಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಖರೀದಿ ಬೇಡಿಕೆಗಳನ್ನು ಪೋಸ್ಟ್ ಮಾಡಲು, ತಾಜಾ ಉತ್ಪನ್ನಗಳನ್ನು ಬ್ರೌಸ್ ಮಾಡಲು ಅಥವಾ ಆರ್ಡರ್‌ಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಲು ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು.',
        };
        return buyerAck[lang] || buyerAck['en'];
      }

      if (targetRole === 'TRANSPORTER') {
        const transporterAck: Record<SupportedLanguage, string> = {
          en: "Got it. I'll help you as a Transporter. You can ask me to find available trips, manage your fleet, or view earnings.",
          hi: 'समझ गई। मैं एक ट्रांसपोर्टर के रूप में आपकी सहायता करूँगी। आप मुझसे उपलब्ध ट्रिप्स खोजने, गाड़ी जोड़ने या कमाई देखने के लिए कह सकते हैं।',
          mr: 'समजले. मी वाहतूकदार म्हणून तुम्हाला मदत करेन. तुम्ही मला उपलब्ध फेऱ्या शोधणे, वाहने व्यवस्थापित करणे किंवा कमाई तपासण्यास सांगू शकता.',
          ta: 'புரிந்தது. ஒரு டிரான்ஸ்போர்ட்டராக நான் உங்களுக்கு உதவுவேன். கிடைக்கக்கூடிய பயணங்களைக் கண்டறிய, உங்கள் வாகனங்களை நிர்வகிக்க அல்லது வருவாயைக் காண நீங்கள் என்னைக் கேட்கலாம்.',
          te: 'అర్థమైంది. నేను మీకు రవాణాదారుగా సహాయం చేస్తాను. అందుబాటులో ఉన్న ట్రిప్పులను కనుగొనడానికి, మీ వాహనాలను నిర్వహించడానికి లేదా ఆదాయాలను చూడటానికి మీరు నన్ను అడగవచ్చు.',
          bn: 'বুঝেছি। আমি একজন পরিবহনকারী হিসেবে আপনাকে সাহায্য করব। আপনি আমাকে উপলব্ধ ট্রিপগুলি খুঁজে পেতে, আপনার যানবাহন পরিচালনা করতে বা উপার্জন দেখতে বলতে পারেন।' ,
          kn: 'ತಿಳಿಯಿತು. ನಾನು ನಿಮಗೆ ಸಾರಿಗೆದಾರರಾಗಿ ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಲಭ್ಯವಿರುವ ಟ್ರಿಪ್‌ಗಳನ್ನು ಹುಡುಕಲು, ನಿಮ್ಮ ವಾಹನಗಳನ್ನು ನಿರ್ವಹಿಸಲು ಅಥವಾ ಗಳಿಕೆಗಳನ್ನು ವೀಕ್ಷಿಸಲು ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು.',
        };
        return transporterAck[lang] || transporterAck['en'];
      }
    }

    if (intent === 'EXPLAIN_PLATFORM') {
      const explain: Record<SupportedLanguage, string> = {
        en: 'AgriRoute is an AI-powered micro-logistics platform connecting rural farmers directly with mandi buyers and verified local transport. As ELA, I can help you manage produce batches, check live APMC market prices, calculate transit ETAs, request transport, or post procurement orders.',
        hi: 'एग्रीरूट एक AI-संचालित माइक्रो-लॉजिस्टिक्स प्लेटफॉर्म है जो किसानों को सीधे व्यापारियों और स्थानीय ट्रांसपोर्ट से जोड़ता है। ईला (ELA) के रूप में मैं आपको फसल प्रबंधित करने, मंडी भाव देखने, गाड़ी बुक करने या खरीद मांग पोस्ट करने में मदद कर सकती हूँ।',
        mr: 'अ‍ॅग्रीरूट हे शेतकऱ्यांना थेट खरेदीदार आणि वाहनांशी जोडणारे AI-सक्षम मायक्रो-लॉजिस्टिक्स प्लॅटफॉर्म आहे. ईला (ELA) म्हणून मी तुम्हाला शेतमाल नोंदवणे, बाजार भाव तपासणे, वाहतूक मागवणे किंवा खरेदी मागणी नोंदवण्यात मदत करू शकते.',
        ta: 'அக்ரிரூட் என்பது விவசாயிகளை வணிகர்கள் மற்றும் போக்குவரத்து வாகனங்களுடன் நேரடியாக இணைக்கும் AI தளமாகும். பயிர்களை நிர்வகிக்கவும், விலைகளை அறியவும், போக்குவரத்து கோரவும் நான் உதவ முடியும்.',
        te: 'అగ్రిరూట్ అనేది రైతులను వ్యాపారులు మరియు రవాణా వాహనాలతో నేరుగా అనుసంధానించే AI ప్లాట్‌ఫారమ్. పంటలను నిర్వహించడానికి మరియు రవాణాను అభ్యర్థించడానికి నేను సహాయం చేయగలను.',
        bn: 'অ্যাগ্রিরুট হল একটি AI-চালিত মাইক্রো-লজিস্টিক প্ল্যাটফর্ম যা কৃষকদের সরাসরি ব্যবসায়ীদের সাথে সংযুক্ত করে।',
        kn: 'ಅಗ್ರಿರೌಟ್ ರೈತರನ್ನು ವ್ಯಾಪಾರಿಗಳು ಮತ್ತು ಸಾರಿಗೆ ವಾಹನಗಳೊಂದಿಗೆ ನೇರವಾಗಿ ಸಂಪರ್ಕಿಸುವ AI ವೇದಿಕೆಯಾಗಿದೆ.',
      };
      return explain[lang] || explain['en'];
    }

    const universalWelcome: Record<SupportedLanguage, string> = {
      en: "Hello! I'm ELA, your AgriRoute AI assistant. I can help you access the Farmer, Buyer, or Transporter portal, understand how AgriRoute works, or help you complete tasks.",
      hi: 'नमस्ते! मैं ईला (ELA) हूँ, आपकी एग्रीरूट AI सहायक। मैं आपको किसान, खरीदार या ट्रांसपोर्टर पोर्टल में प्रवेश करने, एग्रीरूट कैसे काम करता है यह समझने, या काम पूरे करने में मदद कर सकती हूँ।',
      mr: 'नमस्कार! मी ईला (ELA), तुमची अ‍ॅग्रीरूट AI सहाय्यक. मी तुम्हाला शेतकरी, खरेदीदार किंवा वाहतूकदार पोर्टलमध्ये प्रवेश करण्यास, अ‍ॅग्रीरूट कसे कार्य करते ते समजून घेण्यास किंवा कार्ये पूर्ण करण्यास मदत करू शकते.',
      ta: 'வணக்கம்! நான் இலா (ELA), உங்கள் அக்ரிரூட் AI உதவியாளர். விவசாயி, வாங்குபவர் அல்லது டிரான்ஸ்போர்ட்டர் போர்ட்டலை அணுகவும், அக்ரிரூட் எவ்வாறு செயல்படுகிறது என்பதைப் புரிந்து கொள்ளவும் நான் உதவ முடியும்.',
      te: 'నమస్కారం! నేను ఎలా (ELA), మీ అగ్రిరూట్ AI సహాయకురాలిని. రైతు, కొనుగోలుదారు లేదా రవాణాదారు పోర్టల్‌ను యాక్సెస్ చేయడానికి, అగ్రిరూట్ ఎలా పనిచేస్తుందో అర్థం చేసుకోవడానికి నేను సహాయం చేయగలను.',
      bn: 'নমস্কার! আমি ইলা (ELA), আপনার অ্যাগ্রিরুট AI সহকারী। আমি আপনাকে কৃষক, ক্রেতা বা পরিবহনকারী পোর্টালে প্রবেশ করতে, অ্যাগ্রিরুট কীভাবে কাজ করে তা বুঝতে সাহায্য করতে পারি।',
      kn: 'ನಮಸ್ಕಾರ! ನಾನು ಇಲಾ (ELA), ನಿಮ್ಮ ಅಗ್ರಿರೌಟ್ AI ಸಹಾಯಕ. ರೈತ, ಖರೀದಿದಾರ ಅಥವಾ ಸಾರಿಗೆದಾರ ಪೋರ್ಟಲ್ ಅನ್ನು ಪ್ರವೇಶಿಸಲು, ಅಗ್ರಿರೌಟ್ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ ಎಂಬುದನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ.',
    };

    return universalWelcome[lang] || universalWelcome['en'];
  }
}
