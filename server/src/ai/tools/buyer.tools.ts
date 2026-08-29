// Buyer Domain Tools (Phase 2 Real Action & Data Execution)
// AgriRoute / RuralFlow ELA Commercial Buyer Engine

import type { ElaToolDefinition, ElaExecutionContext, ElaToolResult } from '../ela.types.js';
import { prisma } from '../../config/prisma.js';

export const getBuyerProduceTool: ElaToolDefinition = {
  name: 'get_buyer_produce',
  description: 'Fetches available fresh farm produce and crops across regional farmers for wholesale purchase.',
  parameters: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Optional category filter (e.g. Vegetables, Fruits, Grains)',
      },
    },
  },
  allowedRoles: ['BUYER', 'ADMIN', 'GUEST'],
  execute: async (args: Record<string, unknown>, _context: ElaExecutionContext): Promise<ElaToolResult> => {
    try {
      const category = args.category ? String(args.category).trim() : '';
      const products = await prisma.product.findMany({
        where: {
          status: 'Available',
          ...(category ? { category: { contains: category, mode: 'insensitive' } } : {}),
        },
        include: {
          farmer: {
            select: {
              farmName: true,
              village: true,
              district: true,
              state: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      });

      const summaryList = products
        .map(
          (p) =>
            `• ${p.name}: ${p.quantity} (${p.grade}) from ${p.farmer.farmName || 'Local Farm'}, ${
              p.farmer.village || p.farmer.district || 'Maharashtra'
            }`
        )
        .join('\n');

      return {
        toolName: 'get_buyer_produce',
        success: true,
        data: { products, count: products.length },
        userFacingMessage:
          products.length > 0
            ? `Available Produce Catalog (${products.length} batches):\n${summaryList}`
            : 'No produce batches found matching your criteria.',
      };
    } catch {
      return {
        toolName: 'get_buyer_produce',
        success: false,
        error: 'Failed to retrieve available produce catalog.',
      };
    }
  },
};

export const getBuyerOrdersTool: ElaToolDefinition = {
  name: 'get_buyer_orders',
  description: 'Fetches procurement orders and tracked shipments for the authenticated commercial buyer.',
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        description: 'Optional filter by order status (Open, Assigned, Completed)',
      },
    },
  },
  allowedRoles: ['BUYER', 'ADMIN'],
  execute: async (args: Record<string, unknown>, context: ElaExecutionContext): Promise<ElaToolResult> => {
    if (!context.authenticatedUser) {
      return {
        toolName: 'get_buyer_orders',
        success: false,
        error: 'Authentication required to view buyer orders.',
      };
    }

    try {
      const buyerProfile = await prisma.buyerProfile.findUnique({
        where: { userId: context.authenticatedUser.id },
      });

      if (!buyerProfile) {
        return {
          toolName: 'get_buyer_orders',
          success: true,
          data: { procurements: [], count: 0 },
          userFacingMessage: 'You do not have any procurement orders listed yet.',
        };
      }

      const statusFilter = args.status ? String(args.status) : undefined;
      const procurements = await prisma.procurementRequest.findMany({
        where: {
          buyerId: buyerProfile.id,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
        include: {
          logisticsRequests: {
            include: {
              transporter: true,
            },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const summaryList = procurements
        .map(
          (pr) =>
            `• ${pr.product} (${pr.quantity}): Target ₹${pr.targetPrice}, Destination: ${pr.destination}, Status: ${pr.status}`
        )
        .join('\n');

      return {
        toolName: 'get_buyer_orders',
        success: true,
        data: { procurements, count: procurements.length },
        userFacingMessage:
          procurements.length > 0
            ? `Your Procurement Orders (${procurements.length}):\n${summaryList}`
            : 'You have no procurement orders right now. Would you like to post one?',
      };
    } catch {
      return {
        toolName: 'get_buyer_orders',
        success: false,
        error: 'Failed to retrieve buyer orders.',
      };
    }
  },
};

export const createProcurementTool: ElaToolDefinition = {
  name: 'create_procurement',
  description: 'Creates and broadcasts a bulk procurement request to farmers (Requires confirmation).',
  parameters: {
    type: 'object',
    properties: {
      product: { type: 'string', description: 'Product/crop required (e.g. Tomatoes, Onions, Wheat)' },
      quantity: { type: 'string', description: 'Quantity required (e.g. 500 kg, 2 MT)' },
      targetPrice: { type: 'string', description: 'Target buying price (e.g. ₹35/kg)' },
      destination: { type: 'string', description: 'Delivery mandi / warehouse (e.g. Navi Mumbai APMC)' },
      requiredBy: { type: 'string', description: 'Fulfillment deadline (e.g. Tomorrow 5 PM)' },
    },
    required: ['product', 'quantity', 'targetPrice', 'destination'],
  },
  allowedRoles: ['BUYER', 'ADMIN'],
  isConsequential: true,
  execute: async (args: Record<string, unknown>, context: ElaExecutionContext): Promise<ElaToolResult> => {
    if (!context.authenticatedUser) {
      return {
        toolName: 'create_procurement',
        success: false,
        error: 'Authentication required to create procurement requests.',
      };
    }

    const product = String(args.product || '').trim();
    const quantity = String(args.quantity || '').trim();
    const targetPrice = String(args.targetPrice || '₹35/kg').trim();
    const destination = String(args.destination || 'Navi Mumbai APMC Mandi').trim();
    const requiredBy = String(args.requiredBy || 'Tomorrow, 5:00 PM').trim();

    if (!product || !quantity) {
      return {
        toolName: 'create_procurement',
        success: false,
        error: 'Please specify the crop and quantity required.',
      };
    }

    // Confirmation Policy Check
    if (!context.confirmed) {
      return {
        toolName: 'create_procurement',
        success: true,
        confirmation: {
          actionId: `proc-${Date.now()}`,
          toolName: 'create_procurement',
          title: 'Post Procurement Request',
          summary: `Broadcast purchase request for ${quantity} of ${product} at ${targetPrice} to ${destination}.`,
          params: { product, quantity, targetPrice, destination, requiredBy },
          confirmLabel: 'Confirm & Broadcast Request',
          cancelLabel: 'Cancel',
        },
        userFacingMessage: `I have prepared your procurement request for **${product}** (${quantity} @ ${targetPrice}, delivery to ${destination}). Please confirm to publish it to farmers.`,
      };
    }

    // Execute Mutation
    try {
      let buyerProfile = await prisma.buyerProfile.findUnique({
        where: { userId: context.authenticatedUser.id },
      });

      if (!buyerProfile) {
        buyerProfile = await prisma.buyerProfile.create({
          data: {
            userId: context.authenticatedUser.id,
            businessName: context.authenticatedUser.name,
            contactPerson: context.authenticatedUser.name,
          },
        });
      }

      const newProcurement = await prisma.procurementRequest.create({
        data: {
          buyerId: buyerProfile.id,
          product,
          quantity,
          targetPrice,
          destination,
          requiredBy,
          buyerName: buyerProfile.businessName || context.authenticatedUser.name,
          status: 'Open',
        },
      });

      return {
        toolName: 'create_procurement',
        success: true,
        data: { procurement: newProcurement },
        userFacingMessage: `Procurement request for **${newProcurement.product}** (${newProcurement.quantity}) broadcasted successfully! Regional farmers can now fulfill this demand.`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Database insertion failed';
      return {
        toolName: 'create_procurement',
        success: false,
        error: `Could not post procurement request: ${msg}`,
      };
    }
  },
};
