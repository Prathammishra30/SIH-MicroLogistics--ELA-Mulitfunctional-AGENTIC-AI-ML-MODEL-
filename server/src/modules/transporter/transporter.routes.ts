import { Router } from 'express';
import {
  getMyVehicles,
  createVehicle,
  updateVehicle,
  deactivateVehicle,
  getAvailableTrips,
  getMyAssignedTrips,
  acceptTrip,
  updateTripStatus,
} from './transporter.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

const router = Router();

// Vehicles
router.get('/vehicles', authenticate, authorize('TRANSPORTER', 'ADMIN'), getMyVehicles);
router.post('/vehicles', authenticate, authorize('TRANSPORTER', 'ADMIN'), createVehicle);
router.put('/vehicles/:id', authenticate, authorize('TRANSPORTER', 'ADMIN'), updateVehicle);
router.delete('/vehicles/:id', authenticate, authorize('TRANSPORTER', 'ADMIN'), deactivateVehicle);

// Logistics Trips
router.get('/logistics/available', authenticate, authorize('TRANSPORTER', 'ADMIN'), getAvailableTrips);
router.get('/trips/active', authenticate, authorize('TRANSPORTER', 'ADMIN'), getMyAssignedTrips);
router.post('/trips/:id/accept', authenticate, authorize('TRANSPORTER', 'ADMIN'), acceptTrip);
router.post('/trips/:id/status', authenticate, authorize('TRANSPORTER', 'ADMIN'), updateTripStatus);

export const transporterRoutes = router;
