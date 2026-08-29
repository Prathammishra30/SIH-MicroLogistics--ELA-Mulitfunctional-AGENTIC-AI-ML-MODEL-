// ELA API Controller
// Handles chat, message actions, telemetry feedback, and ML model observability
// Bridges to standalone Python ELA Service while retaining Node as authoritative application authority

import type { Request, Response } from 'express';
import { ElaAgent } from '../ai/ela/agent.js';
import { FeedbackCollector } from '../ai/learning/feedbackCollector.js';
import { MLGateway } from '../ai/ml/mlGateway.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { verifyJwtToken, getCurrentUser } from '../modules/auth/auth.service.js';
import { prisma } from '../config/prisma.js';
import { ConversationMemory } from '../ai/memory/conversationMemory.js';
import { ActionExecutor } from '../ai/ela/executor.js';
import type { AuthUser } from '../modules/auth/auth.types.js';
import type { ElaChatRequest, ElaChatResponse } from '../ai/ela.types.js';

const PYTHON_ELA_URL = process.env.PYTHON_ELA_URL || 'http://127.0.0.1:8000';

export async function forwardChatToPythonELA(
  chatRequest: ElaChatRequest,
  authUser: AuthUser | null
): Promise<ElaChatResponse | null> {
  try {
    const payload = {
      message: chatRequest.message,
      context: chatRequest.context || {},
      user: authUser
        ? {
            id: authUser.id,
            name: authUser.name,
            role: authUser.role,
          }
        : null,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${PYTHON_ELA_URL}/v1/ela/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as Record<string, unknown>;
      return {
        message: String(data.message || ''),
        intent: data.intent as ElaChatResponse['intent'],
        detectedRole: data.detected_role as ElaChatResponse['detectedRole'],
        language: data.language as ElaChatResponse['language'],
        actionResult: data.action_result as ElaChatResponse['actionResult'],
        navigationAction: data.navigation_action as ElaChatResponse['navigationAction'],
        confirmationAction: data.confirmation_action as ElaChatResponse['confirmationAction'],
        mlPrediction: data.ml_prediction as ElaChatResponse['mlPrediction'],
        suggestions: (data.suggestions as string[]) || [],
        timestamp: String(data.timestamp || new Date().toISOString()),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function resolveOptionalUser(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7).trim();
  if (!token) return null;

  try {
    const payload = verifyJwtToken(token);
    if (!payload?.sessionId) return null;

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session || session.revokedAt !== null || session.expiresAt < new Date()) {
      return null;
    }

    if (session.userId !== payload.userId) return null;

    return await getCurrentUser(payload.userId);
  } catch {
    return null;
  }
}

export async function handleChatMessage(req: Request, res: Response): Promise<void> {
  try {
    const chatRequest = req.body as ElaChatRequest;
    if (!chatRequest || !chatRequest.message) {
      sendError(res, 'Missing required "message" in request body.', 400);
      return;
    }

    const authUser = await resolveOptionalUser(req);

    // Try Python ELA Service first
    const pythonResponse = await forwardChatToPythonELA(chatRequest, authUser);
    if (pythonResponse) {
      sendSuccess(res, 'ELA response generated successfully via Python Intelligence Service.', pythonResponse);
      return;
    }

    // Fallback to local TypeScript Core if Python service is not running
    const response = await ElaAgent.processMessage(chatRequest, authUser);
    sendSuccess(res, 'ELA response generated successfully.', response);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal ELA processing error';
    sendError(res, `Failed to process message: ${msg}`, 500);
  }
}

export async function handleConfirmAction(req: Request, res: Response): Promise<void> {
  try {
    const { actionId, toolName, params, confirmed, language } = req.body;
    if (!actionId || !toolName) {
      sendError(res, 'actionId and toolName are required for action confirmation.', 400);
      return;
    }

    const authUser = await resolveOptionalUser(req);
    const response = await ElaAgent.executeConfirmedAction(
      { actionId, toolName, params: params || {}, confirmed: Boolean(confirmed), language },
      authUser
    );

    sendSuccess(res, 'Action processed successfully.', response);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Action confirmation failed';
    sendError(res, `Failed to execute action: ${msg}`, 500);
  }
}

export async function handleInternalToolExecution(req: Request, res: Response): Promise<void> {
  try {
    const { toolName, params, userId, role } = req.body;
    const authUser = userId ? await getCurrentUser(userId) : null;
    const effectiveRole = authUser?.role || role || 'GUEST';

    const result = await ActionExecutor.executeWithVerification(toolName, params || {}, {
      language: 'en',
      role: effectiveRole,
      authenticatedUser: authUser,
      currentPage: '/',
      confirmed: true,
    });

    sendSuccess(res, 'Internal tool execution completed.', result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Internal tool execution failed';
    sendError(res, `Internal tool failed: ${msg}`, 500);
  }
}

export function handleFeedback(req: Request, res: Response): void {
  try {
    const { rating, feedbackText, correctedIntent, role, userId } = req.body;
    const rec = FeedbackCollector.recordUserFeedback({
      userId,
      role: role || 'GUEST',
      rating: rating === 'NEGATIVE' ? 'NEGATIVE' : 'POSITIVE',
      feedbackText: feedbackText || '',
      correctedIntent,
    });

    sendSuccess(res, 'Feedback recorded into self-learning telemetry dataset.', {
      feedbackId: rec.id,
      recordedAt: rec.timestamp,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Feedback recording failed';
    sendError(res, `Failed to record feedback: ${msg}`, 500);
  }
}

export function handleGetMLModels(_req: Request, res: Response): void {
  const mlGateway = MLGateway.getInstance();
  const versions = mlGateway.getModelVersions();
  sendSuccess(res, 'Active ML model versions retrieved.', {
    models: versions,
    activePredictorCount: versions.length,
  });
}

export async function handleGetRecommendations(req: Request, res: Response): Promise<void> {
  try {
    const mlGateway = MLGateway.getInstance();
    const location = (req.query.location as string) || 'pune';
    const crops = await mlGateway.recommendationEngine.getFarmerCropRecommendations(location);
    sendSuccess(res, 'Crop and market recommendations generated.', {
      location,
      recommendedCrops: crops,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Recommendation failed';
    sendError(res, `Failed to get recommendations: ${msg}`, 500);
  }
}

export function handleGetSessionState(req: Request, res: Response): void {
  const sessionId = String(req.params.id || '');
  const session = ConversationMemory.getSession(sessionId);
  sendSuccess(res, 'Session conversation state retrieved.', { session });
}

export function handleGetTasks(req: Request, res: Response): void {
  const sessionId = String(req.params.id || '');
  const session = ConversationMemory.getSession(sessionId);
  sendSuccess(res, 'Session tasks retrieved.', {
    activeGoal: session.activeGoal,
    subtasks: session.activeGoal?.subtasks || [],
  });
}

export function handleHealthCheck(_req: Request, res: Response): void {
  const mlGateway = MLGateway.getInstance();
  sendSuccess(res, 'ELA AI Assistant is operational.', {
    status: 'ONLINE',
    version: '4.0.0-enterprise',
    pythonService: `${PYTHON_ELA_URL}/v1/ela/health`,
    registeredModels: mlGateway.getModelVersions().map((m) => m.modelName),
    timestamp: new Date().toISOString(),
  });
}
