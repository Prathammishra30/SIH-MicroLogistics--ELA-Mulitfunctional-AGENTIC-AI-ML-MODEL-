// ELA Agentic AI Core Orchestrator (Phase 4 Enterprise Core)
// The complete Agent Loop: Language -> Canonical Intent -> Entities -> Role/RBAC -> Memory -> Goals -> Planning -> Tool Execution -> Verification -> ML -> Response

import type { ElaChatRequest, ElaChatResponse, ElaConfirmRequest, UserRole } from '../ela.types.js';
import type { AuthUser } from '../../modules/auth/auth.types.js';
import { ElaAgentLoop } from './loop.js';
import { ContextManager } from './context.js';
import { ActionExecutor } from './executor.js';
import { AuditLogger } from './audit.js';

export class ElaAgent {
  /**
   * Main entrypoint for processing user messages through the iterative agent loop
   */
  public static async processMessage(
    request: ElaChatRequest,
    authenticatedUser?: AuthUser | null
  ): Promise<ElaChatResponse> {
    return ElaAgentLoop.run(request, authenticatedUser);
  }

  /**
   * Confirms and executes a staged consequential action with DB verification
   */
  public static async executeConfirmedAction(
    request: ElaConfirmRequest,
    authenticatedUser?: AuthUser | null
  ): Promise<ElaChatResponse> {
    const effectiveRole: UserRole = authenticatedUser?.role || 'GUEST';
    const lang = request.language || 'en';

    if (!request.confirmed) {
      AuditLogger.logAction({
        actorId: authenticatedUser?.id,
        role: effectiveRole,
        intent: 'ACTION_CANCELLED',
        actionStatus: 'STAGED',
        sanitizedSummary: `User cancelled staged action: ${request.toolName}`,
      });

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

    AuditLogger.logAction({
      actorId: authenticatedUser?.id,
      role: effectiveRole,
      intent: 'CONFIRMED_ACTION_EXECUTED',
      toolName: request.toolName,
      actionStatus: result.success ? 'CONFIRMED' : 'FAILED',
      sanitizedSummary: `Executed confirmed action ${request.toolName} with status: ${result.success ? 'SUCCESS' : 'FAILED'}`,
      metadata: { toolName: request.toolName, success: result.success },
    });

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
}
