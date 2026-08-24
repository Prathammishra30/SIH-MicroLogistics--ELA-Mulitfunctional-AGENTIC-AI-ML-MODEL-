import type { Response, NextFunction } from 'express';
import type { Role } from '@prisma/client';
import type { AuthenticatedRequest } from './authenticate.js';
import { sendError } from '../utils/response.js';

/**
 * Authorization Middleware (RBAC)
 * Enforces role-based permissions on protected endpoints.
 *
 * Usage:
 *   router.get('/farmer-data', authenticate, authorize('FARMER'), handler);
 *   router.get('/admin-or-transporter', authenticate, authorize('ADMIN', 'TRANSPORTER'), handler);
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required. User context missing.', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Required role(s): ${allowedRoles.join(', ')}`,
        403
      );
      return;
    }

    next();
  };
}
