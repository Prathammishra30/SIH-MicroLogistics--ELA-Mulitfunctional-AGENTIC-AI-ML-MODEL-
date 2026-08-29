// Transporter Domain Tools (Phase 1 Stub & Phase 2 Structured Architecture)
// RuralFlow ELA Transporter Tools

import type { ElaToolDefinition, ElaExecutionContext, ElaToolResult } from '../ela.types.js';
import { prisma } from '../../config/prisma.js';

export const getTransporterSummaryTool: ElaToolDefinition = {
  name: 'get_transporter_summary',
  description: 'Fetches safe high-level vehicle fleet and assigned trips summary for the authenticated transporter.',
  parameters: {
    type: 'object',
    properties: {},
  },
  allowedRoles: ['TRANSPORTER', 'ADMIN'],
  execute: async (_args: Record<string, unknown>, context: ElaExecutionContext): Promise<ElaToolResult> => {
    if (!context.authenticatedUser) {
      return {
        toolName: 'get_transporter_summary',
        success: false,
        error: 'Authentication required to access transporter summary.',
      };
    }

    try {
      const transporterProfile = await prisma.transporterProfile.findUnique({
        where: { userId: context.authenticatedUser.id },
        include: {
          _count: {
            select: {
              vehicles: true,
              assignedTrips: true,
            },
          },
        },
      });

      if (!transporterProfile) {
        return {
          toolName: 'get_transporter_summary',
          success: true,
          data: {
            vehicleCount: 0,
            assignedTripCount: 0,
            operatingRegion: 'Not specified',
          },
        };
      }

      return {
        toolName: 'get_transporter_summary',
        success: true,
        data: {
          vehicleCount: transporterProfile._count.vehicles,
          assignedTripCount: transporterProfile._count.assignedTrips,
          operatingRegion: transporterProfile.operatingRegion || 'Western Maharashtra',
        },
      };
    } catch {
      return {
        toolName: 'get_transporter_summary',
        success: false,
        error: 'Could not retrieve transporter database statistics.',
      };
    }
  },
};
