import type { Request, Response } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  AppAuthError,
} from './auth.service.js';
import {
  validateRegisterInput,
  validateLoginInput,
} from './auth.validation.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import type { AuthenticatedRequest } from '../../middleware/authenticate.js';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    // 1. Validation
    const validation = validateRegisterInput(req.body);
    if (!validation.isValid) {
      sendError(res, validation.errors[0].message, 400, JSON.stringify(validation.errors));
      return;
    }

    // 2. Service execution
    const authData = await registerUser(req.body);

    sendSuccess(res, 'Account registered successfully', authData, 201);
  } catch (error) {
    if (error instanceof AppAuthError) {
      sendError(res, error.message, error.statusCode);
      return;
    }
    const message = error instanceof Error ? error.message : 'Registration failed due to server error';
    sendError(res, message, 500);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    // 1. Validation
    const validation = validateLoginInput(req.body);
    if (!validation.isValid) {
      sendError(res, validation.errors[0].message, 400, JSON.stringify(validation.errors));
      return;
    }

    // 2. Service execution
    const authData = await loginUser(req.body);

    sendSuccess(res, 'Login successful', authData, 200);
  } catch (error) {
    if (error instanceof AppAuthError) {
      sendError(res, error.message, error.statusCode);
      return;
    }
    const message = error instanceof Error ? error.message : 'Login failed due to server error';
    sendError(res, message, 500);
  }
}

export async function logout(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (req.sessionId) {
      await logoutUser(req.sessionId);
    }
    sendSuccess(res, 'Logged out successfully', null, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Logout failed';
    sendError(res, message, 500);
  }
}

export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'User not authenticated', 401);
      return;
    }

    sendSuccess(res, 'Authenticated user profile retrieved', { user: req.user }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve user profile';
    sendError(res, message, 500);
  }
}

export async function testRoleAccess(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    sendSuccess(res, `Access granted for role ${req.user?.role}`, {
      user: req.user,
      authorizedEndpoint: req.originalUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authorization test error';
    sendError(res, message, 500);
  }
}
