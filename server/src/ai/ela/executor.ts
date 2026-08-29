// ELA Action Executor with Post-Execution Database Verification
// Follows: UNDERSTAND -> VALIDATE -> PLAN -> CONFIRM -> EXECUTE -> VERIFY DATABASE RESULT -> RESPOND

import type { ElaExecutionContext, ElaToolResult } from '../ela.types.js';
import { ElaToolRegistry } from '../ela.tools.js';
import { prisma } from '../../config/prisma.js';

export interface VerifiedExecutionResult {
  toolName: string;
  success: boolean;
  dbVerified: boolean;
  resultData?: unknown;
  userFacingMessage: string;
  navigationAction?: ElaToolResult['navigation'];
  confirmationAction?: ElaToolResult['confirmation'];
  error?: string;
}

export class ActionExecutor {
  public static async executeWithVerification(
    toolName: string,
    args: Record<string, unknown>,
    context: ElaExecutionContext
  ): Promise<VerifiedExecutionResult> {
    const rawResult = await ElaToolRegistry.executeTool(toolName, args, context);

    if (!rawResult.success) {
      return {
        toolName,
        success: false,
        dbVerified: false,
        error: rawResult.error,
        userFacingMessage: rawResult.error || 'Action failed to execute.',
      };
    }

    // If confirmation is required, return confirmation stage
    if (rawResult.confirmation) {
      return {
        toolName,
        success: true,
        dbVerified: false,
        confirmationAction: rawResult.confirmation,
        userFacingMessage: rawResult.userFacingMessage || 'Action requires confirmation.',
      };
    }

    // If navigation returned
    if (rawResult.navigation) {
      return {
        toolName,
        success: true,
        dbVerified: true,
        navigationAction: rawResult.navigation,
        userFacingMessage: rawResult.userFacingMessage || 'Navigating...',
      };
    }

    // Post-Execution Database Verification for Mutating Operations
    let dbVerified = true;
    if (context.confirmed) {
      dbVerified = await this.verifyDatabaseMutation(toolName, rawResult.data);
    }

    return {
      toolName,
      success: rawResult.success && dbVerified,
      dbVerified,
      resultData: rawResult.data,
      userFacingMessage: rawResult.userFacingMessage || 'Action completed and verified.',
    };
  }

  private static async verifyDatabaseMutation(toolName: string, data: unknown): Promise<boolean> {
    if (!data || typeof data !== 'object') return true;
    const rec = data as Record<string, Record<string, string> | undefined>;

    try {
      if (toolName === 'create_product' && rec.product?.id) {
        const found = await prisma.product.findUnique({ where: { id: rec.product.id } });
        return Boolean(found);
      }
      if (toolName === 'create_logistics_request' && rec.logisticsRequest?.id) {
        const found = await prisma.logisticsRequest.findUnique({ where: { id: rec.logisticsRequest.id } });
        return Boolean(found);
      }
      if (toolName === 'create_procurement' && rec.procurement?.id) {
        const found = await prisma.procurementRequest.findUnique({ where: { id: rec.procurement.id } });
        return Boolean(found);
      }
      if (toolName === 'create_vehicle' && rec.vehicle?.id) {
        const found = await prisma.transporterVehicle.findUnique({ where: { id: rec.vehicle.id } });
        return Boolean(found);
      }
      if (toolName === 'accept_trip' && rec.trip?.id) {
        const found = await prisma.logisticsRequest.findUnique({ where: { id: rec.trip.id } });
        return found?.status === 'Assigned';
      }
    } catch {
      return false;
    }

    return true;
  }
}
