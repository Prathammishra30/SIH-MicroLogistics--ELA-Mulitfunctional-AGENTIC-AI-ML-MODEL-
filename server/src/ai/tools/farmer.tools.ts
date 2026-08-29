// Farmer Domain Tools (Phase 1 Stub & Phase 2 Structured Architecture)
// RuralFlow ELA Farmer Tools

import type { ElaToolDefinition, ElaExecutionContext, ElaToolResult } from '../ela.types.js';
import { prisma } from '../../config/prisma.js';

export const getFarmerSummaryTool: ElaToolDefinition = {
  name: 'get_farmer_summary',
  description: 'Fetches safe high-level counts of products and deliveries for the authenticated farmer.',
  parameters: {
    type: 'object',
    properties: {},
  },
  allowedRoles: ['FARMER', 'ADMIN'],
  execute: async (_args: Record<string, unknown>, context: ElaExecutionContext): Promise<ElaToolResult> => {
    if (!context.authenticatedUser) {
      return {
        toolName: 'get_farmer_summary',
        success: false,
        error: 'Authentication required to access farmer summary.',
      };
    }

    try {
      const farmerProfile = await prisma.farmerProfile.findUnique({
        where: { userId: context.authenticatedUser.id },
        include: {
          _count: {
            select: {
              products: true,
              logisticsRequests: true,
            },
          },
        },
      });

      if (!farmerProfile) {
        return {
          toolName: 'get_farmer_summary',
          success: true,
          data: {
            productCount: 0,
            logisticsCount: 0,
            village: 'Not specified',
          },
        };
      }

      return {
        toolName: 'get_farmer_summary',
        success: true,
        data: {
          productCount: farmerProfile._count.products,
          logisticsCount: farmerProfile._count.logisticsRequests,
          village: farmerProfile.village || 'Not specified',
          farmName: farmerProfile.farmName || 'My Farm',
        },
      };
    } catch {
      return {
        toolName: 'get_farmer_summary',
        success: false,
        error: 'Could not retrieve farmer database statistics.',
      };
    }
  },
};
