// Enterprise Tool Registry with Metadata, Permissions, and Safety Controls
// AgriRoute / RuralFlow ELA Agentic Tool Pipeline

import type { ElaToolDefinition, ElaExecutionContext, ElaToolResult, UserRole } from '../ela.types.js';
import { navigateToPageTool } from './navigation.tools.js';
import { getPortalInfoTool } from './common.tools.js';
import {
  getFarmerProductsTool,
  getFarmerDeliveriesTool,
  getMarketDemandTool,
  createProductTool,
  createLogisticsRequestTool,
} from './farmer.tools.js';
import {
  getBuyerProduceTool,
  getBuyerOrdersTool,
  createProcurementTool,
} from './buyer.tools.js';
import {
  getAvailableTripsTool,
  getActiveTripsTool,
  getVehiclesTool,
  getEarningsTool,
  acceptTripTool,
  createVehicleTool,
} from './transporter.tools.js';

export interface EnterpriseToolMetadata extends ElaToolDefinition {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confirmationRequired: boolean;
  permission: string;
}

export class ToolRegistry {
  private static tools: Map<string, EnterpriseToolMetadata> = new Map();

  static {
    // Navigation Tools
    this.registerTool({
      ...navigateToPageTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      permission: 'NAVIGATE_PAGE',
    });

    this.registerTool({
      ...getPortalInfoTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      permission: 'VIEW_PORTAL_INFO',
    });

    // Farmer Tools
    this.registerTool({
      ...getFarmerProductsTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      permission: 'FARMER_PRODUCTS_READ',
    });
    this.registerTool({
      ...getFarmerDeliveriesTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      permission: 'FARMER_DELIVERIES_READ',
    });
    this.registerTool({
      ...getMarketDemandTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      permission: 'MARKET_DEMAND_READ',
    });
    this.registerTool({
      ...createProductTool,
      riskLevel: 'MEDIUM',
      confirmationRequired: true,
      permission: 'PRODUCT_CREATE',
    });
    this.registerTool({
      ...createLogisticsRequestTool,
      riskLevel: 'MEDIUM',
      confirmationRequired: true,
      permission: 'LOGISTICS_CREATE',
    });

    // Buyer Tools
    this.registerTool({
      ...getBuyerProduceTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      permission: 'PRODUCE_CATALOG_READ',
    });
    this.registerTool({
      ...getBuyerOrdersTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      permission: 'BUYER_ORDERS_READ',
    });
    this.registerTool({
      ...createProcurementTool,
      riskLevel: 'MEDIUM',
      confirmationRequired: true,
      permission: 'PROCUREMENT_CREATE',
    });

    // Transporter Tools
    this.registerTool({
      ...getAvailableTripsTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      permission: 'TRIPS_AVAILABLE_READ',
    });
    this.registerTool({
      ...getActiveTripsTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      permission: 'TRIPS_ACTIVE_READ',
    });
    this.registerTool({
      ...getVehiclesTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      permission: 'VEHICLES_READ',
    });
    this.registerTool({
      ...getEarningsTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      permission: 'EARNINGS_READ',
    });
    this.registerTool({
      ...acceptTripTool,
      riskLevel: 'MEDIUM',
      confirmationRequired: true,
      permission: 'TRIP_ACCEPT',
    });
    this.registerTool({
      ...createVehicleTool,
      riskLevel: 'MEDIUM',
      confirmationRequired: true,
      permission: 'VEHICLE_CREATE',
    });
  }

  public static registerTool(tool: EnterpriseToolMetadata): void {
    this.tools.set(tool.name, tool);
  }

  public static getTool(name: string): EnterpriseToolMetadata | undefined {
    return this.tools.get(name);
  }

  public static getToolsForRole(role: UserRole): EnterpriseToolMetadata[] {
    return Array.from(this.tools.values()).filter(
      (t) => t.allowedRoles.includes(role) || t.allowedRoles.includes('GUEST')
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
        error: `Tool '${name}' not found in registry.`,
      };
    }

    const currentRole = context.authenticatedUser?.role || context.role || 'GUEST';
    if (!tool.allowedRoles.includes(currentRole) && !tool.allowedRoles.includes('GUEST')) {
      return {
        toolName: name,
        success: false,
        error: `Authorization Error: Role '${currentRole}' is not permitted to execute '${name}'.`,
      };
    }

    return await tool.execute(args, context);
  }
}
