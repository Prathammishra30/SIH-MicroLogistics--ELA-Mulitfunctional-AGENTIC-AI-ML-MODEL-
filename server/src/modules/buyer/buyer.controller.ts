import type { Response } from 'express';
import { Role } from '@prisma/client';
import type { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';

/**
 * Retrieves procurements owned by the authenticated buyer
 */
export async function getMyProcurements(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || (req.user.role !== Role.BUYER && req.user.role !== Role.ADMIN)) {
      sendError(res, 'Unauthorized access to buyer procurements', 403);
      return;
    }

    const buyerProfile = await prisma.buyerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!buyerProfile) {
      sendSuccess(res, 'No buyer profile found. Returning empty list.', { procurements: [] });
      return;
    }

    const procurements = await prisma.procurementRequest.findMany({
      where: { buyerId: buyerProfile.id },
      include: {
        logisticsRequests: {
          include: {
            transporter: true,
            vehicleRef: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, 'Buyer procurements retrieved successfully', { procurements });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve procurements';
    sendError(res, message, 500);
  }
}

/**
 * Creates a new procurement request owned by the authenticated buyer
 */
export async function createProcurement(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || (req.user.role !== Role.BUYER && req.user.role !== Role.ADMIN)) {
      sendError(res, 'Unauthorized access to create procurement', 403);
      return;
    }

    let buyerProfile = await prisma.buyerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!buyerProfile) {
      buyerProfile = await prisma.buyerProfile.create({
        data: {
          userId: req.user.id,
          businessName: req.user.name,
          contactPerson: req.user.name,
        },
      });
    }

    const { product, quantity, targetPrice, destination, requiredBy } = req.body;

    if (!product || !quantity || !targetPrice || !destination) {
      sendError(res, 'Product, quantity, target price, and destination are required', 400);
      return;
    }

    const newProcurement = await prisma.procurementRequest.create({
      data: {
        buyerId: buyerProfile.id,
        product: String(product).trim(),
        quantity: String(quantity).trim(),
        targetPrice: String(targetPrice).trim(),
        destination: String(destination).trim(),
        requiredBy: String(requiredBy || 'Tomorrow, 5:00 PM').trim(),
        buyerName: buyerProfile.businessName || req.user.name,
        status: 'Open',
      },
    });

    sendSuccess(res, 'Procurement request created successfully', { procurement: newProcurement }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create procurement';
    sendError(res, message, 500);
  }
}

/**
 * Retrieves all available farm produce across the platform for buyer procurement
 */
export async function getAvailableProduce(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || (req.user.role !== Role.BUYER && req.user.role !== Role.ADMIN)) {
      sendError(res, 'Unauthorized access to produce market', 403);
      return;
    }

    const availableProducts = await prisma.product.findMany({
      where: { status: 'Available' },
      include: {
        farmer: {
          select: {
            village: true,
            district: true,
            state: true,
            farmName: true,
            producerType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, 'Available produce retrieved successfully', {
      products: availableProducts,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve produce market';
    sendError(res, message, 500);
  }
}
