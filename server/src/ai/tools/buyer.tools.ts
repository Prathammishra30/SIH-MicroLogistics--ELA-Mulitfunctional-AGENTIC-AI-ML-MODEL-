// Buyer Domain Tools (Phase 1 Stub & Phase 2 Structured Architecture)
// RuralFlow ELA Buyer Tools

import type { ElaToolDefinition, ElaExecutionContext, ElaToolResult } from '../ela.types.js';
import { prisma } from '../../config/prisma.js';

export const getBuyerSummaryTool: ElaToolDefinition = {
  name: 'get_buyer_summary',
  description: 'Fetches safe high-level procurement summary for the authenticated commercial buyer.',
  parameters: {
    type: 'object',
    properties: {},
  },
  allowedRoles: ['BUYER', 'ADMIN'],
  execute: async (_args: Record<string, unknown>, context: ElaExecutionContext): Promise<ElaToolResult> => {
    if (!context.authenticatedUser) {
      return {
        toolName: 'get_buyer_summary',
        success: false,
        error: 'Authentication required to access buyer summary.',
      };
    }

    try {
      const buyerProfile = await prisma.buyerProfile.findUnique({
        where: { userId: context.authenticatedUser.id },
        include: {
          _count: {
            select: {
              procurements: true,
            },
          },
        },
      });

      if (!buyerProfile) {
        return {
          toolName: 'get_buyer_summary',
          success: true,
          data: {
            procurementCount: 0,
            businessName: 'Unregistered Business',
          },
        };
      }

      return {
        toolName: 'get_buyer_summary',
        success: true,
        data: {
          procurementCount: buyerProfile._count.procurements,
          businessName: buyerProfile.businessName || 'APMC Trader',
          location: buyerProfile.location || 'Mandi',
        },
      };
    } catch {
      return {
        toolName: 'get_buyer_summary',
        success: false,
        error: 'Could not retrieve buyer database statistics.',
      };
    }
  },
};
