import { Router } from 'express';
import { healthRoutes } from '../modules/health/health.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { farmerRoutes } from '../modules/farmer/farmer.routes.js';
import { marketRoutes } from '../modules/market/market.routes.js';
import { buyerRoutes } from '../modules/buyer/buyer.routes.js';
import { transporterRoutes } from '../modules/transporter/transporter.routes.js';
import { elaRoutes } from '../ai/ela.router.js';

const router = Router();

// Mount system and authentication modules
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Mount ELA AI Assistant module
router.use('/ela', elaRoutes);

// Mount role-specific and platform-wide business modules
router.use('/farmer', farmerRoutes);
router.use('/market', marketRoutes);
router.use('/buyer', buyerRoutes);
router.use('/transporter', transporterRoutes);

export const apiRouter = router;

