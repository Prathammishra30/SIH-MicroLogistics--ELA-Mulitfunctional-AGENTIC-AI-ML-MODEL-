import { Router } from 'express';
import {
  getMyProcurements,
  createProcurement,
  getAvailableProduce,
} from './buyer.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

router.get('/procurements', authenticate, authorize('BUYER', 'ADMIN'), getMyProcurements);
router.post('/procurements', authenticate, authorize('BUYER', 'ADMIN'), createProcurement);
router.get('/produce', authenticate, authorize('BUYER', 'ADMIN'), getAvailableProduce);

export const buyerRoutes = router;
