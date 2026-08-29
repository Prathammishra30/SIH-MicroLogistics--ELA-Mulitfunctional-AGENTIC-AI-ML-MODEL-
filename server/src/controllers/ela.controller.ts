// ELA API Controller
// Handles chat, message actions, telemetry feedback, and ML model observability

import type { Request, Response } from 'express';
import { ElaAgent } from '../ai/ela/agent.js';
import { FeedbackCollector } from '../ai/learning/feedbackCollector.js';
import { MLGateway } from '../ai/ml/mlGateway.js';
import { ROUTE_REGISTRY } from '../ai/tools/navigation.tools.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { verifyJwtToken, getCurrentUser } from '../modules/auth/auth.service.js';
import { prisma } from '../config/prisma.js';
import type { AuthUser } from '../modules/auth/auth.types.js';
import type { ElaChatRequest } from '../ai/ela.types.js';

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

    sendSuccess(res, 'Action confirmation processed.', response);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Action execution error';
    sendError(res, `Failed to confirm action: ${msg}`, 500);
  }
}

export async function handleFeedback(req: Request, res: Response): Promise<void> {
  try {
    const { rating, feedbackText, correctedIntent } = req.body;
    const authUser = await resolveOptionalUser(req);

    const record = FeedbackCollector.recordUserFeedback({
      userId: authUser?.id,
      role: authUser?.role || 'GUEST',
      rating: rating === 'NEGATIVE' ? 'NEGATIVE' : 'POSITIVE',
      feedbackText,
      correctedIntent,
    });

    sendSuccess(res, 'Feedback recorded successfully.', { feedbackId: record.id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to record feedback';
    sendError(res, msg, 500);
  }
}

export async function handleGetMLModels(_req: Request, res: Response): Promise<void> {
  const mlGateway = MLGateway.getInstance();
  const versions = mlGateway.getModelVersions();
  sendSuccess(res, 'Active ML Models retrieved.', { models: versions });
}

export async function handleGetRecommendations(req: Request, res: Response): Promise<void> {
  const authUser = await resolveOptionalUser(req);
  const mlGateway = MLGateway.getInstance();

  if (authUser?.role === 'TRANSPORTER') {
    const recs = await mlGateway.recommendationEngine.getTransporterLoadRecommendations();
    sendSuccess(res, 'Transporter load recommendations.', { recommendations: recs });
  } else {
    const recs = await mlGateway.recommendationEngine.getFarmerCropRecommendations();
    sendSuccess(res, 'Farmer crop recommendations.', { recommendations: recs });
  }
}

export function handleHealthCheck(_req: Request, res: Response): void {
  const mlGateway = MLGateway.getInstance();
  sendSuccess(res, 'ELA AI Assistant is operational.', {
    agentEngine: 'ELA Enterprise Agent Core (Phase 3)',
    models: mlGateway.getModelVersions().map((m) => `${m.modelName} (${m.version})`),
    supportedLanguages: ['en', 'hi', 'mr', 'ta', 'te', 'bn', 'kn'],
    registeredDestinationsCount: Object.keys(ROUTE_REGISTRY).length,
    timestamp: new Date().toISOString(),
  });
}
