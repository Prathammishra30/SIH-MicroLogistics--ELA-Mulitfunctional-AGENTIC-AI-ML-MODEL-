import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { verifyJwtToken, getCurrentUser, AppAuthError } from '../modules/auth/auth.service.js';
import { sendError } from '../utils/response.js';
import type { AuthUser } from '../modules/auth/auth.types.js';
import { prisma } from '../config/prisma.js';

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  sessionId?: string;
}

/**
 * Authentication Middleware with Server-Side Session Verification
 * 1. Reads Authorization: Bearer <token>
 * 2. Verifies JWT signature and expiry
 * 3. Validates that the associated Session exists, is NOT revoked, and is NOT expired
 * 4. Fetches active user from database
 * 5. Attaches user to req.user and sessionId to req.sessionId
 * 6. Returns 401 if token or session is missing, invalid, revoked, or expired
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Authentication required. Please log in.', 401);
    return;
  }

  const token = authHeader.substring(7).trim();

  if (!token) {
    sendError(res, 'Authentication required. Please log in.', 401);
    return;
  }

  try {
    // 1. Verify JWT cryptographically
    const payload = verifyJwtToken(token);

    // 2. Enforce Session verification in PostgreSQL
    if (!payload.sessionId) {
      sendError(res, 'Invalid token: missing session identifier.', 401);
      return;
    }

    const session = await prisma.session.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session) {
      sendError(res, 'Session not found. Please log in again.', 401);
      return;
    }

    // Cross-check: session must belong to the same user claimed in the JWT
    if (session.userId !== payload.userId) {
      sendError(res, 'Invalid authentication token. Please log in again.', 401);
      return;
    }

    if (session.revokedAt !== null) {
      sendError(res, 'Your session is no longer active. Please log in again.', 401);
      return;
    }

    if (session.expiresAt < new Date()) {
      sendError(res, 'Your session has expired. Please log in again.', 401);
      return;
    }

    // 3. Retrieve user identity
    const user = await getCurrentUser(payload.userId);

    if (!user) {
      sendError(res, 'User account not found or deactivated.', 401);
      return;
    }

    // 4. Attach authenticated user and session
    req.user = user;
    req.sessionId = session.id;
    next();
  } catch (error) {
    if (error instanceof AppAuthError) {
      sendError(res, error.message, error.statusCode);
      return;
    }
    // Clean JWT error handling — never expose raw jsonwebtoken errors to client
    const errorName = error instanceof Error ? error.name : '';
    if (errorName === 'TokenExpiredError' || error instanceof jwt.TokenExpiredError) {
      sendError(res, 'Your session has expired. Please log in again.', 401);
      return;
    }
    if (errorName === 'JsonWebTokenError' || error instanceof jwt.JsonWebTokenError) {
      sendError(res, 'Invalid authentication token. Please log in again.', 401);
      return;
    }
    sendError(res, 'Authentication failed. Please log in again.', 401);
  }
}
