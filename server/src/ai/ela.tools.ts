// ELA Tool Registry and Execution Pipeline (Phase 2 Real Action Engine)
// AgriRoute / RuralFlow AI Engine

import type {
  ElaToolDefinition,
  ElaExecutionContext,
  ElaToolResult,
  UserRole,
} from './ela.types.js';
import { navigateToPageTool } from './tools/navigation.tools.js';
import { getPortalInfoTool } from './tools/common.tools.js';
import {
  getFarmerProductsTool,
  getFarmerDeliveriesTool,
  getMarketDemandTool,
  createProductTool,
  createLogisticsRequestTool,
} from './tools/farmer.tools.js';
import {
  getBuyerProduceTool,
  getBuyerOrdersTool,
  createProcurementTool,
} from './tools/buyer.tools.js';
import {
  getAvailableTripsTool,
  getActiveTripsTool,
  getVehiclesTool,
  getEarningsTool,
  acceptTripTool,
  createVehicleTool,
} from './tools/transporter.tools.js';

export class ElaToolRegistry {
  private static tools: Map<string, ElaToolDefinition> = new Map();

  static {
    // Navigation & Common Tools
    this.registerTool(navigateToPageTool);
    this.registerTool(getPortalInfoTool);

    // Farmer Domain Tools
    this.registerTool(getFarmerProductsTool);
    this.registerTool(getFarmerDeliveriesTool);
    this.registerTool(getMarketDemandTool);
    this.registerTool(createProductTool);
    this.registerTool(createLogisticsRequestTool);

    // Buyer Domain Tools
    this.registerTool(getBuyerProduceTool);
    this.registerTool(getBuyerOrdersTool);
    this.registerTool(createProcurementTool);

    // Transporter Domain Tools
    this.registerTool(getAvailableTripsTool);
    this.registerTool(getActiveTripsTool);
    this.registerTool(getVehiclesTool);
    this.registerTool(getEarningsTool);
    this.registerTool(acceptTripTool);
    this.registerTool(createVehicleTool);
  }

  public static registerTool(tool: ElaToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  public static getTool(name: string): ElaToolDefinition | undefined {
    return this.tools.get(name);
  }

  public static getToolsForRole(role: UserRole): ElaToolDefinition[] {
    return Array.from(this.tools.values()).filter(
      (tool) => tool.allowedRoles.includes(role) || tool.allowedRoles.includes('GUEST')
    );
  }

  public static async executeTool(
    name: string,
    args: Record<string, unknown>,
    context: ElaExecutionContext
  ): Promise<ElaToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        toolName: name,
        success: false,
        error: `Tool '${name}' is not registered in the ELA agent system.`,
      };
    }

    const currentRole = context.authenticatedUser?.role || context.role || 'GUEST';
    if (!tool.allowedRoles.includes(currentRole) && !tool.allowedRoles.includes('GUEST')) {
      return {
        toolName: name,
        success: false,
        error: `Authorization Error: Role '${currentRole}' is not permitted to execute tool '${name}'.`,
      };
    }

    try {
      return await tool.execute(args, context);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown tool execution error';
      return {
        toolName: name,
        success: false,
        error: `Tool execution failed: ${message}`,
      };
    }
  }
}
