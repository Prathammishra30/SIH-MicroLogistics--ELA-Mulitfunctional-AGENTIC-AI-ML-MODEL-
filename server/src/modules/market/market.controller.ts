import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';

/**
 * Retrieves all platform-wide market opportunities
 * Accessible to all authenticated users & farmers (new or existing)
 */
export async function getMarketOpportunities(_req: Request, res: Response): Promise<void> {
  try {
    const opportunities = await prisma.marketOpportunity.findMany({
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, 'Platform market opportunities retrieved successfully', { opportunities });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve market opportunities';
    sendError(res, message, 500);
  }
}

/**
 * Retrieves all open buyer procurement demands for platform-wide market discovery
 */
export async function getOpenBuyerDemands(_req: Request, res: Response): Promise<void> {
  try {
    const openDemands = await prisma.procurementRequest.findMany({
      where: { status: { in: ['Open', 'Fulfilling'] } },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, 'Open buyer demands retrieved successfully', { procurements: openDemands });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve buyer demands';
    sendError(res, message, 500);
  }
}
