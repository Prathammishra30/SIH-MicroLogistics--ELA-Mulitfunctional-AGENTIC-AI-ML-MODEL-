// ELA Agent Orchestrator
// RuralFlow Multilingual Logistics Intelligence Assistant

import type {
  ElaChatRequest,
  ElaChatResponse,
  ElaExecutionContext,
  ElaMessage,
  ElaNavigationAction,
  SupportedLanguage,
  UserRole,
} from './ela.types.js';
import type { AuthUser } from '../modules/auth/auth.types.js';
import { buildSystemPromptWithContext } from './ela.prompts.js';
import { ElaToolRegistry } from './ela.tools.js';
import { LlmProviderFactory } from './providers/provider.factory.js';

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

    // Determine strict backend role (never trust client claimed role over auth)
    const effectiveRole: UserRole = authenticatedUser?.role || 'GUEST';
    const clientLanguage = (request.context?.language || 'en') as SupportedLanguage;
    const supportedLangs: SupportedLanguage[] = ['en', 'hi', 'mr', 'ta', 'te', 'bn', 'kn'];
    const validLang: SupportedLanguage = supportedLangs.includes(clientLanguage)
      ? clientLanguage
      : 'en';

    const executionContext: ElaExecutionContext = {
      authenticatedUser: authenticatedUser || null,
      role: effectiveRole,
      language: validLang,
      currentPage: request.context?.currentPage || '/',
    };

    // Retrieve authorized tools for the user's role
    const availableTools = ElaToolRegistry.getToolsForRole(effectiveRole);

    // Build system prompt
    const systemPrompt = buildSystemPromptWithContext(executionContext);

    // Format conversation history
    const history: ElaMessage[] = request.history ? [...request.history] : [];
    history.push({
      role: 'user',
      content: rawMessage,
      timestamp: new Date().toISOString(),
    });

    const provider = LlmProviderFactory.getProvider();

    try {
      const completion = await provider.generateCompletion({
        systemPrompt,
        messages: history,
        tools: availableTools,
        context: executionContext,
      });

      let navigationAction: ElaNavigationAction | null = null;
      let actionResultData: {
        toolName: string;
        success: boolean;
        data?: unknown;
        error?: string;
      } | null = null;

      // Execute authorized tools if requested
      if (completion.toolCalls && completion.toolCalls.length > 0) {
        for (const toolCall of completion.toolCalls) {
          const toolResult = await ElaToolRegistry.executeTool(
            toolCall.name,
            toolCall.arguments,
            executionContext
          );

          if (toolResult.navigation) {
            navigationAction = toolResult.navigation;
          }

          actionResultData = {
            toolName: toolResult.toolName,
            success: toolResult.success,
            data: toolResult.data,
            error: toolResult.error,
          };

          // If tool produced a clean user-facing override message
          if (toolResult.userFacingMessage && !completion.text) {
            completion.text = toolResult.userFacingMessage;
          }
        }
      }

      return {
        message: completion.text || 'I have processed your request.',
        intent: completion.intent,
        language: validLang,
        detectedRole: effectiveRole,
        navigationAction,
        suggestions: completion.suggestions,
        actionResult: actionResultData,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[ELA Agent Error]', error);

      // Graceful fallback to deterministic engine on unexpected provider exception
      const fallbackProvider = LlmProviderFactory.getFallbackProvider();
      const fallbackCompletion = await fallbackProvider.generateCompletion({
        systemPrompt,
        messages: history,
        tools: availableTools,
        context: executionContext,
      });

      let navigationAction: ElaNavigationAction | null = null;
      if (fallbackCompletion.toolCalls && fallbackCompletion.toolCalls.length > 0) {
        for (const toolCall of fallbackCompletion.toolCalls) {
          const res = await ElaToolRegistry.executeTool(
            toolCall.name,
            toolCall.arguments,
            executionContext
          );
          if (res.navigation) {
            navigationAction = res.navigation;
          }
        }
      }

      return {
        message: fallbackCompletion.text,
        intent: fallbackCompletion.intent,
        language: validLang,
        detectedRole: effectiveRole,
        navigationAction,
        suggestions: fallbackCompletion.suggestions,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
