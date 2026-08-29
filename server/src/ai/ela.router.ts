// ELA Router & API Endpoints
// RuralFlow AI Endpoints

import { Router } from 'express';
import type { Request, Response } from 'express';
import { ElaAgent } from './ela.agent.js';
import { LlmProviderFactory } from './providers/provider.factory.js';
import { ROUTE_REGISTRY } from './tools/navigation.tools.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { verifyJwtToken, getCurrentUser } from '../modules/auth/auth.service.js';
import { prisma } from '../config/prisma.js';
import type { AuthUser } from '../modules/auth/auth.types.js';
import type { ElaChatRequest } from './ela.types.js';

export const elaRoutes = Router();

/**
 * Helper to optionally extract authenticated user from Authorization header.
 * Allows both authenticated users and guests to interact with ELA.
 */
async function resolveOptionalUser(req: Request): Promise<AuthUser | null> {
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

/**
 * POST /api/ela/chat
 * Primary conversation endpoint for ELA.
 */
elaRoutes.post('/chat', async (req: Request, res: Response): Promise<void> => {
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
});

/**
 * GET /api/ela/health
 * Returns status of ELA assistant engine and provider.
 */
elaRoutes.get('/health', (_req: Request, res: Response): void => {
  const provider = LlmProviderFactory.getProvider();
  sendSuccess(res, 'ELA AI Assistant is operational.', {
    providerName: provider.name,
    isAvailable: provider.isAvailable(),
    supportedLanguages: ['en', 'hi', 'mr', 'ta', 'te', 'bn', 'kn'],
    registeredDestinationsCount: Object.keys(ROUTE_REGISTRY).length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/ela/intents
 * Lists available navigation routes and role permissions.
 */
elaRoutes.get('/intents', (_req: Request, res: Response): void => {
  sendSuccess(res, 'ELA navigation catalog retrieved.', {
    destinations: ROUTE_REGISTRY,
  });
});
