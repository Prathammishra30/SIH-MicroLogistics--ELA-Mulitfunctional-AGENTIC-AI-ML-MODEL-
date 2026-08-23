import { Router } from 'express';
import { healthRoutes } from '../modules/health/health.routes.js';

const router = Router();

// Mount modules
router.use('/health', healthRoutes);

// Future Phase 4B modules will be mounted here:
// router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/products', productRoutes);
// router.use('/procurements', procurementRoutes);
// router.use('/logistics', logisticsRoutes);

export const apiRouter = router;
