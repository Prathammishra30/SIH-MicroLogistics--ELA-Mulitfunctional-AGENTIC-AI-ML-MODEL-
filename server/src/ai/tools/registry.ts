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
import {
  generateMatchesTool,
  createProposalTool,
  submitDecisionTool,
} from './matching.tools.js';

export type ActionType = 'REVERSIBLE' | 'CONSEQUENTIAL';

export interface EnterpriseToolMetadata extends ElaToolDefinition {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  confirmationRequired: boolean;
  actionType: ActionType;
  requiredParameters: string[];
  optionalParameters: string[];
  permission: string;
}

export class ToolRegistry {
  private static tools: Map<string, EnterpriseToolMetadata> = new Map();

  static {
    // Navigation Tools (REVERSIBLE)
    this.registerTool({
      ...navigateToPageTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      actionType: 'REVERSIBLE',
      requiredParameters: ['destination'],
      optionalParameters: ['params'],
      permission: 'NAVIGATE_PAGE',
    });

    this.registerTool({
      ...getPortalInfoTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      actionType: 'REVERSIBLE',
      requiredParameters: [],
      optionalParameters: ['topic'],
      permission: 'VIEW_PORTAL_INFO',
    });

    // Farmer Read Tools (REVERSIBLE)
    this.registerTool({
      ...getFarmerProductsTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      actionType: 'REVERSIBLE',
      requiredParameters: [],
      optionalParameters: [],
      permission: 'FARMER_PRODUCTS_READ',
    });
    this.registerTool({
      ...getFarmerDeliveriesTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      actionType: 'REVERSIBLE',
      requiredParameters: [],
      optionalParameters: [],
      permission: 'FARMER_DELIVERIES_READ',
    });
    this.registerTool({
      ...getMarketDemandTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      actionType: 'REVERSIBLE',
      requiredParameters: [],
      optionalParameters: ['crop'],
      permission: 'MARKET_DEMAND_READ',
    });

    // Farmer Mutation Tools (CONSEQUENTIAL)
    this.registerTool({
      ...createProductTool,
      riskLevel: 'MEDIUM',
      confirmationRequired: true,
      actionType: 'CONSEQUENTIAL',
      requiredParameters: ['name', 'quantity', 'price'],
      optionalParameters: ['category', 'harvestDate'],
      permission: 'PRODUCT_CREATE',
    });
    this.registerTool({
      ...createLogisticsRequestTool,
      riskLevel: 'MEDIUM',
      confirmationRequired: true,
      actionType: 'CONSEQUENTIAL',
      requiredParameters: ['productName', 'quantity', 'pickupLocation', 'destination'],
      optionalParameters: ['pickupDate', 'refrigerated', 'notes'],
      permission: 'LOGISTICS_CREATE',
    });

    // Buyer Read Tools (REVERSIBLE)
    this.registerTool({
      ...getBuyerProduceTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      actionType: 'REVERSIBLE',
      requiredParameters: [],
      optionalParameters: ['crop', 'maxPrice'],
      permission: 'PRODUCE_CATALOG_READ',
    });
    this.registerTool({
      ...getBuyerOrdersTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      actionType: 'REVERSIBLE',
      requiredParameters: [],
      optionalParameters: [],
      permission: 'BUYER_ORDERS_READ',
    });

    // Buyer Mutation Tools (CONSEQUENTIAL)
    this.registerTool({
      ...createProcurementTool,
      riskLevel: 'MEDIUM',
      confirmationRequired: true,
      actionType: 'CONSEQUENTIAL',
      requiredParameters: ['product', 'quantity', 'targetPrice'],
      optionalParameters: ['location', 'requiredByDate'],
      permission: 'PROCUREMENT_CREATE',
    });

    // Transporter Read Tools (REVERSIBLE)
    this.registerTool({
      ...getAvailableTripsTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      actionType: 'REVERSIBLE',
      requiredParameters: [],
      optionalParameters: ['origin', 'destination'],
      permission: 'TRIPS_AVAILABLE_READ',
    });
    this.registerTool({
      ...getActiveTripsTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      actionType: 'REVERSIBLE',
      requiredParameters: [],
      optionalParameters: [],
      permission: 'TRIPS_ACTIVE_READ',
    });
    this.registerTool({
      ...getVehiclesTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      actionType: 'REVERSIBLE',
      requiredParameters: [],
      optionalParameters: [],
      permission: 'VEHICLES_READ',
    });
    this.registerTool({
      ...getEarningsTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      actionType: 'REVERSIBLE',
      requiredParameters: [],
      optionalParameters: [],
      permission: 'EARNINGS_READ',
    });

    // Transporter Mutation Tools (CONSEQUENTIAL)
    this.registerTool({
      ...acceptTripTool,
      riskLevel: 'MEDIUM',
      confirmationRequired: true,
      actionType: 'CONSEQUENTIAL',
      requiredParameters: ['tripId'],
      optionalParameters: ['vehicleId'],
      permission: 'TRIP_ACCEPT',
    });
    this.registerTool({
      ...createVehicleTool,
      riskLevel: 'MEDIUM',
      confirmationRequired: true,
      actionType: 'CONSEQUENTIAL',
      requiredParameters: ['type', 'registration', 'capacity'],
      optionalParameters: ['hasRefrigeration'],
      permission: 'VEHICLE_CREATE',
    });

    // Cross-Role Match Orchestration Tools
    this.registerTool({
      ...generateMatchesTool,
      riskLevel: 'LOW',
      confirmationRequired: false,
      actionType: 'REVERSIBLE',
      requiredParameters: [],
      optionalParameters: ['crop'],
      permission: 'MATCHES_GENERATE',
    });
    this.registerTool({
      ...createProposalTool,
      riskLevel: 'MEDIUM',
      confirmationRequired: true,
      actionType: 'CONSEQUENTIAL',
      requiredParameters: ['farmerId', 'buyerId', 'transporterId'],
      optionalParameters: ['crop', 'quantityKg', 'askingPricePerKg', 'targetPricePerKg', 'transportCostPerKg'],
      permission: 'PROPOSAL_CREATE',
    });
    this.registerTool({
      ...submitDecisionTool,
      riskLevel: 'HIGH',
      confirmationRequired: true,
      actionType: 'CONSEQUENTIAL',
      requiredParameters: ['proposalId', 'decision'],
      optionalParameters: ['reason'],
      permission: 'PROPOSAL_DECISION',
    });
  }

  public static registerTool(tool: EnterpriseToolMetadata): void {
    this.tools.set(tool.name, tool);
  }

  public static getTool(name: string): EnterpriseToolMetadata | undefined {
    return this.tools.get(name);
  }

  public static getAllTools(): EnterpriseToolMetadata[] {
    return Array.from(this.tools.values());
  }

  public static isReversible(name: string): boolean {
    const tool = this.tools.get(name);
    return tool ? tool.actionType === 'REVERSIBLE' : true;
  }

  public static isConsequential(name: string): boolean {
    const tool = this.tools.get(name);
    return tool ? tool.actionType === 'CONSEQUENTIAL' : false;
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
