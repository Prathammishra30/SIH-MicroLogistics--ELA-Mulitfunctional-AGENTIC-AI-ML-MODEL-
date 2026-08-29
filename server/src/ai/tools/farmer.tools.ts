// Farmer Domain Tools (Phase 2 Real Action & Data Execution)
// AgriRoute / RuralFlow ELA Farmer Engine

import type { ElaToolDefinition, ElaExecutionContext, ElaToolResult } from '../ela.types.js';
import { prisma } from '../../config/prisma.js';

export const getFarmerProductsTool: ElaToolDefinition = {
  name: 'get_farmer_products',
  description: 'Fetches real list of crops and products owned by the authenticated farmer.',
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        description: 'Optional filter by status (Available, In Transit, Sold)',
      },
    },
  },
  allowedRoles: ['FARMER', 'ADMIN'],
  execute: async (args: Record<string, unknown>, context: ElaExecutionContext): Promise<ElaToolResult> => {
    if (!context.authenticatedUser) {
      return {
        toolName: 'get_farmer_products',
        success: false,
        error: 'Authentication required to access farmer products.',
      };
    }

    try {
      const farmerProfile = await prisma.farmerProfile.findUnique({
        where: { userId: context.authenticatedUser.id },
      });

      if (!farmerProfile) {
        return {
          toolName: 'get_farmer_products',
          success: true,
          data: { products: [], count: 0 },
          userFacingMessage: 'You do not have any registered produce yet. Would you like to add one?',
        };
      }

      const statusFilter = args.status ? String(args.status) : undefined;
      const products = await prisma.product.findMany({
        where: {
          farmerId: farmerProfile.id,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
        orderBy: { createdAt: 'desc' },
      });

      const summaryList = products
        .map((p) => `• ${p.name}: ${p.quantity} (Grade ${p.grade}, Status: ${p.status})`)
        .join('\n');

      return {
        toolName: 'get_farmer_products',
        success: true,
        data: {
          products,
          count: products.length,
        },
        userFacingMessage:
          products.length > 0
            ? `You have ${products.length} registered products:\n${summaryList}`
            : 'You currently have no products listed. You can add a new harvest batch anytime.',
      };
    } catch {
      return {
        toolName: 'get_farmer_products',
        success: false,
        error: 'Could not retrieve products from the database.',
      };
    }
  },
};

export const getFarmerDeliveriesTool: ElaToolDefinition = {
  name: 'get_farmer_deliveries',
  description: 'Fetches active and historical logistics delivery shipments for the authenticated farmer.',
  parameters: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        description: 'Filter: "active" (Searching, Assigned, In Transit) or "all"',
      },
    },
  },
  allowedRoles: ['FARMER', 'ADMIN'],
  execute: async (args: Record<string, unknown>, context: ElaExecutionContext): Promise<ElaToolResult> => {
    if (!context.authenticatedUser) {
      return {
        toolName: 'get_farmer_deliveries',
        success: false,
        error: 'Authentication required to view deliveries.',
      };
    }

    try {
      const farmerProfile = await prisma.farmerProfile.findUnique({
        where: { userId: context.authenticatedUser.id },
      });

      if (!farmerProfile) {
        return {
          toolName: 'get_farmer_deliveries',
          success: true,
          data: { deliveries: [], count: 0 },
          userFacingMessage: 'You do not have any active deliveries at the moment.',
        };
      }

      const filterType = String(args.status || 'all').toLowerCase();
      const whereClause: Record<string, unknown> = { farmerId: farmerProfile.id };

      if (filterType === 'active') {
        whereClause.status = { in: ['Searching', 'Assigned', 'At Pickup', 'Picked Up', 'In Transit'] };
      }

      const deliveries = await prisma.logisticsRequest.findMany({
        where: whereClause,
        include: {
          transporter: true,
          vehicleRef: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      const summaryList = deliveries
        .map(
          (d) =>
            `• ${d.productName} (${d.quantity || 'N/A'}): Destination ${d.destination}, Status: ${d.status}${
              d.driver ? `, Driver: ${d.driver}` : ''
            }`
        )
        .join('\n');

      return {
        toolName: 'get_farmer_deliveries',
        success: true,
        data: {
          deliveries,
          count: deliveries.length,
        },
        userFacingMessage:
          deliveries.length > 0
            ? `Found ${deliveries.length} shipments:\n${summaryList}`
            : 'No delivery shipments found.',
      };
    } catch {
      return {
        toolName: 'get_farmer_deliveries',
        success: false,
        error: 'Failed to retrieve delivery requests.',
      };
    }
  },
};

export const getMarketDemandTool: ElaToolDefinition = {
  name: 'get_market_demand',
  description: 'Fetches live market demand and commercial opportunities from APMC buyers.',
  parameters: {
    type: 'object',
    properties: {
      item: {
        type: 'string',
        description: 'Specific crop/produce name (e.g. Tomatoes, Onions)',
      },
    },
  },
  allowedRoles: ['FARMER', 'BUYER', 'ADMIN', 'GUEST'],
  execute: async (args: Record<string, unknown>, _context: ElaExecutionContext): Promise<ElaToolResult> => {
    try {
      const itemFilter = args.item ? String(args.item).trim() : '';
      const opportunities = await prisma.marketOpportunity.findMany({
        where: itemFilter
          ? { demandItem: { contains: itemFilter, mode: 'insensitive' } }
          : {},
        orderBy: { matchScore: 'desc' },
        take: 5,
      });

      const summaryList = opportunities
        .map((o) => `• ${o.demandItem}: ${o.quantityRequired} @ ₹${o.price} (${o.buyer}, ${o.distance})`)
        .join('\n');

      return {
        toolName: 'get_market_demand',
        success: true,
        data: { opportunities, count: opportunities.length },
        userFacingMessage:
          opportunities.length > 0
            ? `Live APMC Market Opportunities:\n${summaryList}`
            : 'No active market demands found matching your query.',
      };
    } catch {
      return {
        toolName: 'get_market_demand',
        success: false,
        error: 'Failed to load market demand data.',
      };
    }
  },
};

export const createProductTool: ElaToolDefinition = {
  name: 'create_product',
  description: 'Registers a new agricultural produce batch for the authenticated farmer (Requires confirmation).',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Product / Crop name (e.g. Organic Tomatoes)' },
      category: { type: 'string', description: 'Category (e.g. Vegetables, Fruits, Grains)' },
      quantity: { type: 'string', description: 'Quantity (e.g. 500 kg, 2.5 MT)' },
      grade: { type: 'string', description: 'Quality grade (A, B, Premium, Standard)' },
      harvestDate: { type: 'string', description: 'Harvest date in YYYY-MM-DD' },
    },
    required: ['name', 'quantity'],
  },
  allowedRoles: ['FARMER', 'ADMIN'],
  isConsequential: true,
  execute: async (args: Record<string, unknown>, context: ElaExecutionContext): Promise<ElaToolResult> => {
    if (!context.authenticatedUser) {
      return {
        toolName: 'create_product',
        success: false,
        error: 'Authentication required to register products.',
      };
    }

    const name = String(args.name || '').trim();
    const quantity = String(args.quantity || '').trim();
    const category = String(args.category || 'Fresh Produce').trim();
    const grade = String(args.grade || 'Grade A').trim();
    const harvestDate = String(args.harvestDate || new Date().toISOString().split('T')[0]).trim();

    if (!name || !quantity) {
      return {
        toolName: 'create_product',
        success: false,
        error: 'Please provide both product name and quantity.',
      };
    }

    // Confirmation Policy Check
    if (!context.confirmed) {
      return {
        toolName: 'create_product',
        success: true,
        confirmation: {
          actionId: `prod-${Date.now()}`,
          toolName: 'create_product',
          title: 'Add Produce Batch',
          summary: `Add ${quantity} of ${name} (${grade}) to your product catalog.`,
          params: { name, category, quantity, grade, harvestDate },
          confirmLabel: 'Confirm & Add Product',
          cancelLabel: 'Cancel',
        },
        userFacingMessage: `I have prepared your product listing for **${name}** (${quantity}, ${grade}). Please confirm below to add it to your catalog.`,
      };
    }

    // Execute Mutation
    try {
      let farmerProfile = await prisma.farmerProfile.findUnique({
        where: { userId: context.authenticatedUser.id },
      });

      if (!farmerProfile) {
        farmerProfile = await prisma.farmerProfile.create({
          data: { userId: context.authenticatedUser.id },
        });
      }

      const newProduct = await prisma.product.create({
        data: {
          farmerId: farmerProfile.id,
          name,
          category,
          quantity,
          grade,
          harvestDate,
          status: 'Available',
        },
      });

      return {
        toolName: 'create_product',
        success: true,
        data: { product: newProduct },
        userFacingMessage: `Successfully added **${newProduct.name}** (${newProduct.quantity}) to your inventory!`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Database insertion failed';
      return {
        toolName: 'create_product',
        success: false,
        error: `Could not create product: ${msg}`,
      };
    }
  },
};

export const createLogisticsRequestTool: ElaToolDefinition = {
  name: 'create_logistics_request',
  description: 'Creates a rural transport / logistics request for produce delivery (Requires confirmation).',
  parameters: {
    type: 'object',
    properties: {
      productName: { type: 'string', description: 'Name of crop/produce to transport' },
      quantity: { type: 'string', description: 'Quantity (e.g. 500 kg)' },
      pickupLocation: { type: 'string', description: 'Pickup village or farm location' },
      destination: { type: 'string', description: 'Delivery mandi or buyer location (e.g. Pune APMC)' },
      estimatedEarnings: { type: 'string', description: 'Freight estimate (e.g. ₹2,500)' },
    },
    required: ['productName', 'destination'],
  },
  allowedRoles: ['FARMER', 'ADMIN'],
  isConsequential: true,
  execute: async (args: Record<string, unknown>, context: ElaExecutionContext): Promise<ElaToolResult> => {
    if (!context.authenticatedUser) {
      return {
        toolName: 'create_logistics_request',
        success: false,
        error: 'Authentication required to create transport request.',
      };
    }

    const productName = String(args.productName || '').trim();
    const destination = String(args.destination || 'Pune APMC Mandi').trim();
    const quantity = String(args.quantity || '500 kg').trim();
    const pickupLocation = String(args.pickupLocation || 'Farm Pickup').trim();
    const estimatedEarnings = String(args.estimatedEarnings || '₹2,500').trim();

    if (!productName || !destination) {
      return {
        toolName: 'create_logistics_request',
        success: false,
        error: 'Please specify the produce name and destination.',
      };
    }

    // Confirmation Policy Check
    if (!context.confirmed) {
      return {
        toolName: 'create_logistics_request',
        success: true,
        confirmation: {
          actionId: `log-${Date.now()}`,
          toolName: 'create_logistics_request',
          title: 'Create Logistics Request',
          summary: `Request transport for ${quantity} of ${productName} from ${pickupLocation} to ${destination}.`,
          params: { productName, destination, quantity, pickupLocation, estimatedEarnings },
          confirmLabel: 'Confirm Transport Request',
          cancelLabel: 'Cancel',
        },
        userFacingMessage: `I have prepared a logistics request for **${productName}** (${quantity}) to **${destination}**. Please review and confirm below.`,
      };
    }

    // Execute Mutation
    try {
      let farmerProfile = await prisma.farmerProfile.findUnique({
        where: { userId: context.authenticatedUser.id },
      });

      if (!farmerProfile) {
        farmerProfile = await prisma.farmerProfile.create({
          data: { userId: context.authenticatedUser.id },
        });
      }

      const newLogistics = await prisma.logisticsRequest.create({
        data: {
          farmerId: farmerProfile.id,
          productName,
          quantity,
          pickupLocation,
          destination,
          estimatedEarnings,
          status: 'Searching',
        },
      });

      return {
        toolName: 'create_logistics_request',
        success: true,
        data: { logisticsRequest: newLogistics },
        userFacingMessage: `Transport request broadcasted successfully for **${newLogistics.productName}**! Transporters in your region are now notified.`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Database insertion failed';
      return {
        toolName: 'create_logistics_request',
        success: false,
        error: `Could not create logistics request: ${msg}`,
      };
    }
  },
};
