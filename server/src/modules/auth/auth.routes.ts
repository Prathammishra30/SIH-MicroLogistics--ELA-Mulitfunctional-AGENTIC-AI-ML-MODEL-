import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  testRoleAccess,
} from './auth.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// Public Authentication Endpoints
router.post('/register', register);
router.post('/login', login);

// Authenticated User Session Endpoints
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);

// Role-Protected Test Endpoints for RBAC Verification
router.get('/test/farmer', authenticate, authorize('FARMER', 'ADMIN'), testRoleAccess);
router.get('/test/buyer', authenticate, authorize('BUYER', 'ADMIN'), testRoleAccess);
router.get('/test/transporter', authenticate, authorize('TRANSPORTER', 'ADMIN'), testRoleAccess);
router.get('/test/admin', authenticate, authorize('ADMIN'), testRoleAccess);

export const authRoutes = router;
