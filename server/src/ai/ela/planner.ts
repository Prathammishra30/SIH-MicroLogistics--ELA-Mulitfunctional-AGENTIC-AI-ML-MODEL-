import type { CanonicalIntent } from './intent.js';
import type { ElaExecutionContext } from '../ela.types.js';
import { SecurityGuard } from './security.js';
import { ElaToolRegistry } from '../ela.tools.js';

export interface PlannedStep {
  toolName: string;
  arguments: Record<string, unknown>;
  isConsequential: boolean;
  requiresConfirmation: boolean;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AgentExecutionPlan {
  steps: PlannedStep[];
  goalTitle: string;
  isExecutable: boolean;
  missingEntities?: string[];
  denialReason?: string;
}

export class AgentPlanner {
  public static plan(
    canonical: CanonicalIntent,
    context: ElaExecutionContext
  ): AgentExecutionPlan {
    const steps: PlannedStep[] = [];

    // Map intent to primary tool name
    const intentToolMap: Record<string, string> = {
      CREATE_PRODUCT_WORKFLOW: 'create_product',
      CREATE_LOGISTICS_WORKFLOW: 'create_logistics_request',
      CREATE_PROCUREMENT_WORKFLOW: 'create_procurement',
      CREATE_VEHICLE_WORKFLOW: 'create_vehicle',
      GET_FARMER_PRODUCTS: 'get_farmer_products',
      GET_FARMER_DELIVERIES: 'get_farmer_deliveries',
      GET_MARKET_DEMAND: 'get_market_demand',
      GET_BUYER_PRODUCE: 'get_buyer_produce',
      GET_BUYER_ORDERS: 'get_buyer_orders',
      GET_AVAILABLE_TRIPS: 'get_available_trips',
      GET_ACTIVE_TRIPS: 'get_active_trips',
      GET_VEHICLES: 'get_vehicles',
      GET_EARNINGS: 'get_earnings',
      LOGIN_GUIDANCE: 'navigate_to_page',
      NAVIGATE_HOME: 'navigate_to_page',
    };

    const toolName = intentToolMap[canonical.intent];
    if (!toolName) {
      return {
        steps: [],
        goalTitle: 'General Conversational Query',
        isExecutable: false,
      };
    }

    const toolDef = ElaToolRegistry.getTool(toolName);
    if (!toolDef) {
      return {
        steps: [],
        goalTitle: 'Unregistered Tool',
        isExecutable: false,
      };
    }

    // RBAC Security Validation
    const authCheck = SecurityGuard.validateRolePermission(context.role, toolDef.allowedRoles);
    if (!authCheck.permitted) {
      SecurityGuard.logAudit({
        timestamp: new Date().toISOString(),
        userId: context.authenticatedUser?.id,
        role: context.role,
        toolName,
        actionStatus: 'DENIED',
        sanitizedSummary: authCheck.reason || 'RBAC check failed',
      });

      return {
        steps: [],
        goalTitle: 'Unauthorized Action',
        isExecutable: false,
        denialReason: authCheck.reason,
      };
    }

    // Argument preparation from entities
    let toolArgs: Record<string, unknown> = { ...canonical.entities };
    if (canonical.intent === 'LOGIN_GUIDANCE') {
      const destMap: Record<string, string> = {
        FARMER: 'login_farmer',
        BUYER: 'login_buyer',
        TRANSPORTER: 'login_transporter',
      };
      toolArgs = { destination: destMap[canonical.targetRole] || 'home' };
    } else if (canonical.intent === 'NAVIGATE_HOME') {
      toolArgs = { destination: 'home' };
    } else if (canonical.intent === 'CREATE_PRODUCT_WORKFLOW') {
      toolArgs = {
        name: canonical.entities.product || 'Fresh Produce',
        quantity: canonical.entities.formattedQuantity || '500 kg',
        grade: canonical.entities.grade || 'Grade A',
        category: 'Fresh Vegetables & Crops',
      };
    } else if (canonical.intent === 'CREATE_LOGISTICS_WORKFLOW') {
      toolArgs = {
        productName: canonical.entities.product || 'Fresh Produce',
        quantity: canonical.entities.formattedQuantity || '500 kg',
        destination: canonical.entities.destination || 'Pune APMC Mandi',
        pickupLocation: canonical.entities.pickupLocation || 'Farm Cluster',
        estimatedEarnings: '₹2,800',
      };
    } else if (canonical.intent === 'CREATE_PROCUREMENT_WORKFLOW') {
      toolArgs = {
        product: canonical.entities.product || 'Organic Produce',
        quantity: canonical.entities.formattedQuantity || '500 kg',
        targetPrice: canonical.entities.targetPrice || '₹40/kg',
        destination: canonical.entities.destination || 'Navi Mumbai APMC Mandi',
        requiredBy: canonical.entities.requiredBy || 'Tomorrow, 5:00 PM',
      };
    } else if (canonical.intent === 'CREATE_VEHICLE_WORKFLOW') {
      toolArgs = {
        type: canonical.entities.vehicleType || 'Pickup (1.5 MT)',
        registration: canonical.entities.vehicleRegistration || `MH 12 RF ${Math.floor(1000 + Math.random() * 9000)}`,
        capacity: '1.5 MT',
      };
    }

    const isConsequential = Boolean(toolDef.isConsequential);
    steps.push({
      toolName,
      arguments: toolArgs,
      isConsequential,
      requiresConfirmation: isConsequential,
      riskLevel: isConsequential ? 'MEDIUM' : 'LOW',
    });

    return {
      steps,
      goalTitle: `Execute ${toolName}`,
      isExecutable: true,
    };
  }
}
