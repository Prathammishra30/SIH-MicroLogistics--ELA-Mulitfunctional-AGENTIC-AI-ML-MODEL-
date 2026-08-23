import { Router } from 'express';
import { getHealth } from './health.controller.js';

const router = Router();

// GET /api/health
router.get('/', getHealth);

export const healthRoutes = router;
