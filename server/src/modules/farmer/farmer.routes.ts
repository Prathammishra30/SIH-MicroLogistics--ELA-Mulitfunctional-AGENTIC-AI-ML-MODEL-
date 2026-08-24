import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import {
  getMyProducts,
  createProduct,
  getMyLogistics,
  createLogistics,
} from './farmer.controller.js';

export const farmerRoutes = Router();

// All farmer endpoints require valid authentication and FARMER or ADMIN role
farmerRoutes.use(authenticate);
farmerRoutes.use(authorize(Role.FARMER, Role.ADMIN));

// Products
farmerRoutes.get('/products', getMyProducts);
farmerRoutes.post('/products', createProduct);

// Logistics
farmerRoutes.get('/logistics', getMyLogistics);
farmerRoutes.post('/logistics', createLogistics);
