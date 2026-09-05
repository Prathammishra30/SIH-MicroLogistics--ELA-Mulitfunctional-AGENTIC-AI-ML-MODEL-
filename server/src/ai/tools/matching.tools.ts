// Cross-Role Matching Engine Tools (Unified Action Registry)
// AgriRoute / RuralFlow ELA Matching Pipeline

import type { ElaToolDefinition, ElaExecutionContext, ElaToolResult } from '../ela.types.js';
import { prisma } from '../../config/prisma.js';

export const generateMatchesTool: ElaToolDefinition = {
  name: 'generate_matches',
  description: 'Generate and refresh 3-party match proposals linking farmers, buyers, and transporters.',
  parameters: {
    type: 'object',
    properties: {
      crop: {
        type: 'string',
        description: 'Optional crop filter (e.g. Tomato, Onion, Wheat)',
      },
    },
  },
  allowedRoles: ['FARMER', 'BUYER', 'TRANSPORTER', 'ADMIN', 'GUEST'],
  execute: async (args: Record<string, unknown>, _context: ElaExecutionContext): Promise<ElaToolResult> => {
    try {
      const cropFilter = args.crop ? String(args.crop) : undefined;
      const proposals = await prisma.matchProposal.findMany({
        where: {
          status: 'PROPOSED',
          ...(cropFilter ? { crop: { contains: cropFilter, mode: 'insensitive' } } : {}),
        },
        include: {
          farmer: { include: { user: true } },
          buyer: { include: { user: true } },
          transporter: { include: { user: true } },
        },
        take: 5,
        orderBy: { matchScore: 'desc' },
      });

      return {
        toolName: 'generate_matches',
        success: true,
        data: {
          proposals,
          count: proposals.length,
        },
        userFacingMessage: proposals.length > 0
          ? `Found ${proposals.length} active match proposals.`
          : 'No match proposals found for the criteria.',
      };
    } catch (err: unknown) {
      return {
        toolName: 'generate_matches',
        success: false,
        error: err instanceof Error ? err.message : 'Failed to generate matches',
      };
    }
  },
};

export const createProposalTool: ElaToolDefinition = {
  name: 'create_proposal',
  description: 'Stage a consequential 3-party match proposal requiring mutual consent.',
  parameters: {
    type: 'object',
    properties: {
      farmerId: { type: 'string', description: 'Farmer Profile ID' },
      buyerId: { type: 'string', description: 'Buyer Profile ID' },
      transporterId: { type: 'string', description: 'Transporter Profile ID' },
      crop: { type: 'string', description: 'Crop or commodity name' },
      quantityKg: { type: 'number', description: 'Total matched quantity in kg' },
      askingPricePerKg: { type: 'number', description: 'Farmer asking price per kg' },
      targetPricePerKg: { type: 'number', description: 'Buyer target price per kg' },
      transportCostPerKg: { type: 'number', description: 'Transporter fee per kg' },
    },
    required: ['farmerId', 'buyerId', 'transporterId'],
  },
  allowedRoles: ['FARMER', 'BUYER', 'TRANSPORTER', 'ADMIN'],
  execute: async (args: Record<string, unknown>, context: ElaExecutionContext): Promise<ElaToolResult> => {
    if (!context.confirmed) {
      return {
        toolName: 'create_proposal',
        success: false,
        error: 'Confirmation required before creating a binding match proposal.',
      };
    }

    try {
      const farmerId = String(args.farmerId);
      const buyerId = String(args.buyerId);
      const transporterId = String(args.transporterId);
      const crop = String(args.crop || 'Produce');
      const quantityKg = Number(args.quantityKg) || 1000;
      const askingPrice = Number(args.askingPricePerKg) || 25;
      const targetPrice = Number(args.targetPricePerKg) || 28;
      const transportCost = Number(args.transportCostPerKg) || 3;

      const created = await prisma.matchProposal.create({
        data: {
          farmerId,
          buyerId,
          transporterId,
          crop,
          quantityKg,
          askingPricePerKg: askingPrice,
          targetPricePerKg: targetPrice,
          transportCostPerKg: transportCost,
          totalCostPerKg: askingPrice + transportCost,
          matchScore: 0.88,
          subScores: { price: 0.9, route: 0.85, capacity: 0.9 },
          explanation: `3-party match proposal for ${crop}`,
          status: 'PROPOSED',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      return {
        toolName: 'create_proposal',
        success: true,
        data: created,
        userFacingMessage: `Match proposal ${created.id} successfully created.`,
      };
    } catch (err: unknown) {
      return {
        toolName: 'create_proposal',
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create proposal',
      };
    }
  },
};

export const submitDecisionTool: ElaToolDefinition = {
  name: 'submit_decision',
  description: 'Submit a binding decision (APPROVED or DECLINED) for an active match proposal.',
  parameters: {
    type: 'object',
    properties: {
      proposalId: { type: 'string', description: 'Match proposal UUID' },
      decision: { type: 'string', enum: ['APPROVED', 'DECLINED'], description: 'Decision choice' },
      reason: { type: 'string', description: 'Optional explanation' },
    },
    required: ['proposalId', 'decision'],
  },
  allowedRoles: ['FARMER', 'BUYER', 'TRANSPORTER', 'ADMIN'],
  execute: async (args: Record<string, unknown>, context: ElaExecutionContext): Promise<ElaToolResult> => {
    if (!context.confirmed) {
      return {
        toolName: 'submit_decision',
        success: false,
        error: 'Confirmation required before submitting a binding match decision.',
      };
    }

    try {
      const proposalId = String(args.proposalId);
      const decision = String(args.decision).toUpperCase();
      const role = context.role;

      const existing = await prisma.matchProposal.findUnique({
        where: { id: proposalId },
      });

      if (!existing) {
        return {
          toolName: 'submit_decision',
          success: false,
          error: `Proposal ${proposalId} not found.`,
        };
      }

      const updateData: Record<string, unknown> = {};
      if (role === 'FARMER') updateData.farmerStatus = decision;
      if (role === 'BUYER') updateData.buyerStatus = decision;
      if (role === 'TRANSPORTER') updateData.transporterStatus = decision;

      if (decision === 'DECLINED') {
        updateData.status = 'DECLINED';
      }

      const updated = await prisma.matchProposal.update({
        where: { id: proposalId },
        data: updateData,
      });

      return {
        toolName: 'submit_decision',
        success: true,
        data: updated,
        userFacingMessage: `Decision ${decision} recorded for proposal ${proposalId}.`,
      };
    } catch (err: unknown) {
      return {
        toolName: 'submit_decision',
        success: false,
        error: err instanceof Error ? err.message : 'Failed to submit decision',
      };
    }
  },
};
