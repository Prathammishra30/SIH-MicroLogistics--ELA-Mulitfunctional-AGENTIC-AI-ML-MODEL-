// ELA Agentic AI Core Orchestrator (Phase 3 Enterprise Architecture)
// The complete Agent Loop: Language -> Canonical Intent -> Entities -> Role/RBAC -> Memory -> Goals -> Planning -> Tool Execution -> Verification -> ML -> Response

import type { ElaChatRequest, ElaChatResponse, ElaConfirmRequest, SupportedLanguage } from '../ela.types.js';
import type { AuthUser } from '../../modules/auth/auth.types.js';
import type { PredictionResult } from '../ml/types.js';
import { SecurityGuard } from './security.js';
import { IntentResolver } from './intent.js';
import { ContextManager } from './context.js';
import { AgentPlanner } from './planner.js';
import { ActionExecutor, type VerifiedExecutionResult } from './executor.js';
import { GoalManager } from './goals.js';
import { ResponseBuilder } from './response.js';
import { ConversationMemory } from '../memory/conversationMemory.js';
import { UserMemory } from '../memory/userMemory.js';
import { MLGateway } from '../ml/mlGateway.js';

export class ElaAgent {
  public static async processMessage(
    request: ElaChatRequest,
    authenticatedUser?: AuthUser | null
  ): Promise<ElaChatResponse> {
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

    // 1. Critical Security Shield: Check for raw passwords, OTPs, PINs
    if (SecurityGuard.containsSensitiveCredentials(rawMessage)) {
      SecurityGuard.logAudit({
        timestamp: new Date().toISOString(),
        userId: authenticatedUser?.id,
        role: authenticatedUser?.role || 'GUEST',
        actionStatus: 'CREDENTIAL_SHIELDED',
        sanitizedSummary: 'User input contained sensitive credential pattern - safely intercepted.',
      });

      const lang = (request.context?.language || 'en') as SupportedLanguage;
      return {
        message:
          'Please enter your password, OTP, or verification code directly into the secure login form. For your protection, ELA never processes, stores, or transmits authentication secrets.',
        intent: 'GENERAL_HELP',
        language: lang,
        detectedRole: authenticatedUser?.role || 'GUEST',
        suggestions: ResponseBuilder.getDefaultSuggestions(authenticatedUser?.role || 'GUEST', lang),
        timestamp: new Date().toISOString(),
      };
    }

    // 2. Build Context & Multi-Turn Memory Layer
    const context = ContextManager.buildContext(request.context, authenticatedUser);

    // 3. Resolve Multilingual Input to Canonical Intent & Entities
    const canonical = IntentResolver.resolve(rawMessage, context.role, context.language);

    // 4. Update Conversation Memory with newly accumulated entities
    const accumulatedEntities = ConversationMemory.updateEntities(context.sessionId, canonical.entities);
    ConversationMemory.setLastIntent(context.sessionId, canonical.intent);

    // 5. Goal Management: Decompose goal into subtasks
    const goalPlan = GoalManager.decomposeGoal(canonical.intent, accumulatedEntities, context.role, rawMessage);
    ConversationMemory.setActiveGoal(context.sessionId, goalPlan);

    // 6. Agent Planner: Formulate tool execution plan
    const plan = AgentPlanner.plan(canonical, context);

    if (!plan.isExecutable) {
      // Return conversational guidance or explanation
      const reply = this.getConversationalResponse(canonical.intent, context.language, plan.denialReason);
      return ResponseBuilder.buildResponse({
        message: reply,
        intent: canonical.intent,
        language: context.language,
        role: context.role,
        suggestions: ResponseBuilder.getDefaultSuggestions(context.role, context.language),
      });
    }

    // 7. Execute Planned Step & Verify Database Results
    const firstStep = plan.steps[0];
    let executionResult: VerifiedExecutionResult | null = null;
    let mlPrediction: PredictionResult<unknown> | null = null;

    if (firstStep) {
      executionResult = await ActionExecutor.executeWithVerification(
        firstStep.toolName,
        firstStep.arguments,
        context
      );
    }

    // 8. ML Intelligence Integration: Attach proactive predictive insights
    try {
      const mlGateway = MLGateway.getInstance();
      if (canonical.entities.product && (canonical.intent === 'GET_MARKET_DEMAND' || canonical.intent === 'CREATE_PRODUCT_WORKFLOW')) {
        mlPrediction = await mlGateway.predictPrice({
          cropName: canonical.entities.product,
          mandiLocation: canonical.entities.destination || 'Pune APMC',
          grade: canonical.entities.grade || 'A',
        });
      } else if (canonical.entities.destination && canonical.intent === 'CREATE_LOGISTICS_WORKFLOW') {
        mlPrediction = await mlGateway.predictEta({
          pickupLocation: 'Farm',
          destination: canonical.entities.destination,
          distanceKm: 85,
          vehicleType: canonical.entities.vehicleType || 'Pickup',
        });
      }
    } catch {
      // ML gateway non-blocking
    }

    // 9. Persist user preferences in user memory if authenticated
    if (authenticatedUser && canonical.entities.product) {
      UserMemory.updatePreferences(authenticatedUser.id, {
        preferredLanguage: context.language,
        frequentCrops: [canonical.entities.product],
      });
    }

    // 10. Construct final localized response
    return ResponseBuilder.buildResponse({
      message: executionResult?.userFacingMessage || 'I have processed your request.',
      intent: canonical.intent,
      language: context.language,
      role: context.role,
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
      mlPrediction,
      suggestions: ResponseBuilder.getDefaultSuggestions(context.role, context.language),
    });
  }

  /**
   * Confirms and executes a staged consequential action with DB verification
   */
  public static async executeConfirmedAction(
    request: ElaConfirmRequest,
    authenticatedUser?: AuthUser | null
  ): Promise<ElaChatResponse> {
    const effectiveRole = authenticatedUser?.role || 'GUEST';
    const lang = request.language || 'en';

    if (!request.confirmed) {
      return {
        message: 'Action cancelled.',
        intent: 'GENERAL_HELP',
        language: lang,
        detectedRole: effectiveRole,
        timestamp: new Date().toISOString(),
      };
    }

    const context = ContextManager.buildContext({ language: lang }, authenticatedUser);
    context.confirmed = true;

    const result = await ActionExecutor.executeWithVerification(
      request.toolName,
      request.params,
      context
    );

    return {
      message:
        result.userFacingMessage ||
        (result.success
          ? 'Action confirmed and verified in database.'
          : `Action could not be verified: ${result.error || 'Unknown error'}`),
      intent: 'GENERAL_HELP',
      language: lang,
      detectedRole: effectiveRole,
      actionResult: {
        toolName: result.toolName,
        success: result.success,
        data: result.resultData,
        error: result.error,
      },
      timestamp: new Date().toISOString(),
    };
  }

  private static getConversationalResponse(intent: string, lang: string, denialReason?: string): string {
    if (denialReason) return denialReason;

    const responses: Record<string, Record<string, string>> = {
      EXPLAIN_PLATFORM: {
        en: 'AgriRoute connects farmers directly to mandi buyers and verified local transport. You can list crops, check live market rates, and request pickup in seconds.',
        hi: 'एग्रीरूट किसानों को सीधे व्यापारियों और स्थानीय ट्रांसपोर्ट से जोड़ता है। आप अपनी फसल लिस्ट कर सकते हैं और आसानी से गाड़ी बुक कर सकते हैं।',
        mr: 'अ‍ॅग्रीरूट शेतकऱ्यांना थेट बाजारपेठेतील खरेदीदार आणि वाहनांशी जोडते. तुम्ही शेतमाल नोंदवून थेट गाडी मागवू शकता.',
      },
      GENERAL_HELP: {
        en: "Hello! I'm ELA, your AgriRoute logistics intelligence assistant. How can I help you manage your produce, procurement, or trips today?",
        hi: 'नमस्ते! मैं ईला (ELA) हूँ, आपकी एग्रीरूट लॉजिस्टिक्स सहायक। आज मैं आपकी फसल, खरीद या ट्रिप्स में क्या सहायता कर सकती हूँ?',
        mr: 'नमस्कार! मी ईला (ELA), तुमची अ‍ॅग्रीरूट लॉजिस्टिक्स सहाय्यक. शेतमाल, खरेदी किंवा वाहतुकीत मी कशी मदत करू शकेन?',
      },
    };

    return responses[intent]?.[lang] || responses[intent]?.['en'] || responses['GENERAL_HELP']?.[lang] || 'How may I assist you with AgriRoute logistics?';
  }
}
