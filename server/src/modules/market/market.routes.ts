import { Router } from 'express';
import { getMarketOpportunities, getOpenBuyerDemands } from './market.controller.js';

export const marketRoutes = Router();

// Global platform-wide market opportunities endpoint
marketRoutes.get('/opportunities', getMarketOpportunities);
marketRoutes.get('/demands', getOpenBuyerDemands);
