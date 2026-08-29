// Common & System Tools for ELA
// RuralFlow AI Platform Utilities

import type { ElaToolDefinition, ElaExecutionContext, ElaToolResult } from '../ela.types.js';

export const getPortalInfoTool: ElaToolDefinition = {
  name: 'get_portal_info',
  description: 'Returns information about RuralFlow capabilities, role features, and guidelines.',
  parameters: {
    type: 'object',
    properties: {
      topic: {
        type: 'string',
        description: 'Specific topic: "farmer", "buyer", "transporter", "security", "languages"',
      },
    },
  },
  allowedRoles: ['FARMER', 'BUYER', 'TRANSPORTER', 'ADMIN', 'GUEST'],
  execute: async (args: Record<string, unknown>, context: ElaExecutionContext): Promise<ElaToolResult> => {
    const topic = String(args.topic || 'general').toLowerCase();

    const info: Record<string, string> = {
      farmer:
        'RuralFlow empowers Farmers to list harvested crops, discover market demands from verified buyers, and request reliable transportation.',
      buyer:
        'Commercial Buyers can post bulk procurement requests, search local farm produce, and track end-to-end logistics with real-time ETA.',
      transporter:
        'Transporters and fleet owners can register vehicles, accept available shipment loads, and manage trips with instant milestone tracking.',
      security:
        'RuralFlow enforces strict role-based access control (RBAC) and database isolation. All sessions are validated server-side.',
      languages:
        'RuralFlow and ELA support English, Hindi, Marathi, Tamil, Telugu, Bengali, and Kannada across all portals.',
      general:
        'RuralFlow is an intelligent agri-logistics micro-platform connecting farmers, buyers, and transporters across India.',
    };

    return {
      toolName: 'get_portal_info',
      success: true,
      data: {
        topic,
        content: info[topic] || info.general,
        language: context.language,
      },
    };
  },
};
