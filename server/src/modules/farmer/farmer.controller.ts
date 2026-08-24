import type { Response } from 'express';
import { Role } from '@prisma/client';
import type { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';

/**
 * Retrieves only products owned by the authenticated farmer
 */
export async function getMyProducts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || (req.user.role !== Role.FARMER && req.user.role !== Role.ADMIN)) {
      sendError(res, 'Unauthorized access to farmer products', 403);
      return;
    }

    const farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!farmerProfile) {
      sendSuccess(res, 'No farmer profile found. Returning empty products list.', { products: [] });
      return;
    }

    const products = await prisma.product.findMany({
      where: { farmerId: farmerProfile.id },
      include: {
        logisticsRequests: {
          select: {
            id: true,
            status: true,
            destination: true,
            driver: true,
            eta: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, 'Farmer products retrieved successfully', { products });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve products';
    sendError(res, message, 500);
  }
}

/**
 * Creates a new product owned by the authenticated farmer
 */
export async function createProduct(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || (req.user.role !== Role.FARMER && req.user.role !== Role.ADMIN)) {
      sendError(res, 'Unauthorized access to add farmer product', 403);
      return;
    }

    let farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!farmerProfile) {
      farmerProfile = await prisma.farmerProfile.create({
        data: { userId: req.user.id },
      });
    }

    const { name, category, quantity, grade, harvestDate } = req.body;

    if (!name || !category || !quantity) {
      sendError(res, 'Name, category, and quantity are required', 400);
      return;
    }

    const newProduct = await prisma.product.create({
      data: {
        farmerId: farmerProfile.id,
        name: String(name).trim(),
        category: String(category).trim(),
        quantity: String(quantity).trim(),
        grade: String(grade || 'Standard').trim(),
        harvestDate: String(harvestDate || new Date().toISOString().split('T')[0]).trim(),
        status: 'Available',
      },
    });

    sendSuccess(res, 'Product created successfully', { product: newProduct }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create product';
    sendError(res, message, 500);
  }
}

/**
 * Retrieves only logistics requests owned by the authenticated farmer
 */
export async function getMyLogistics(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || (req.user.role !== Role.FARMER && req.user.role !== Role.ADMIN)) {
      sendError(res, 'Unauthorized access to farmer logistics', 403);
      return;
    }

    const farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!farmerProfile) {
      sendSuccess(res, 'No farmer profile found. Returning empty logistics list.', { logisticsRequests: [] });
      return;
    }

    const logisticsRequests = await prisma.logisticsRequest.findMany({
      where: { farmerId: farmerProfile.id },
      include: {
        product: true,
        procurementRequest: true,
        transporter: true,
        vehicleRef: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, 'Farmer logistics requests retrieved successfully', { logisticsRequests });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve logistics requests';
    sendError(res, message, 500);
  }
}

/**
 * Creates a new logistics request for the authenticated farmer with full relational linking & duplicate protection
 */
export async function createLogistics(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || (req.user.role !== Role.FARMER && req.user.role !== Role.ADMIN)) {
      sendError(res, 'Unauthorized access to create logistics request', 403);
      return;
    }

    let farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!farmerProfile) {
      farmerProfile = await prisma.farmerProfile.create({
        data: { userId: req.user.id },
      });
    }

    const {
      productName,
      productId,
      quantity,
      pickupLocation,
      destination,
      estimatedEarnings,
      procurementRequestId,
    } = req.body;

    if (!productName || !destination) {
      sendError(res, 'Product name and destination are required', 400);
      return;
    }

    // Resolve Product if productId provided or find matching product by name
    let validProductId: string | null = null;
    if (productId) {
      const existingProduct = await prisma.product.findFirst({
        where: { id: productId, farmerId: farmerProfile.id },
      });
      if (existingProduct) {
        validProductId = existingProduct.id;
      }
    } else {
      const matchByName = await prisma.product.findFirst({
        where: { name: String(productName).trim(), farmerId: farmerProfile.id },
      });
      if (matchByName) {
        validProductId = matchByName.id;
      }
    }

    // Duplicate prevention: check if an active request already exists for this product
    if (validProductId) {
      const activeExisting = await prisma.logisticsRequest.findFirst({
        where: {
          productId: validProductId,
          status: { in: ['Searching', 'Assigned', 'At Pickup', 'Picked Up', 'In Transit'] },
        },
      });

      if (activeExisting) {
        // Return existing active logistics request
        sendSuccess(res, 'Active logistics request already exists for this produce batch.', {
          logisticsRequest: activeExisting,
        }, 200);
        return;
      }
    }

    // Resolve ProcurementRequest if procurementRequestId provided
    let validProcurementId: string | null = null;
    if (procurementRequestId) {
      const existingProc = await prisma.procurementRequest.findUnique({
        where: { id: procurementRequestId },
      });
      if (existingProc) {
        validProcurementId = existingProc.id;
      }
    }

    // Execute in transaction to link Product, ProcurementRequest, and LogisticsRequest atomically
    const newRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.logisticsRequest.create({
        data: {
          farmerId: farmerProfile!.id,
          productId: validProductId,
          productName: String(productName).trim(),
          quantity: quantity ? String(quantity).trim() : null,
          pickupLocation: pickupLocation ? String(pickupLocation).trim() : (farmerProfile?.village || 'Farm Gate'),
          destination: String(destination).trim(),
          estimatedEarnings: estimatedEarnings ? String(estimatedEarnings).trim() : '₹1,850',
          status: 'Searching',
          procurementRequestId: validProcurementId,
        },
        include: {
          product: true,
          procurementRequest: true,
        },
      });

      // Update Product status to 'In Transit'
      if (validProductId) {
        await tx.product.update({
          where: { id: validProductId },
          data: { status: 'In Transit' },
        });
      }

      // Update ProcurementRequest status to 'Logistics Requested' if linked
      if (validProcurementId) {
        await tx.procurementRequest.update({
          where: { id: validProcurementId },
          data: {
            status: 'Logistics Requested',
            logisticsRequestId: created.id,
            farmerName: farmerProfile?.farmName || req.user?.name,
          },
        });
      }

      return created;
    });

    sendSuccess(res, 'Logistics request created successfully', { logisticsRequest: newRequest }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create logistics request';
    sendError(res, message, 500);
  }
}
