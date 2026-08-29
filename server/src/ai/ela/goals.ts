// Goal Management & Goal Decomposition Engine
// Decomposes high-level natural language user goals into structured subtasks with progress tracking

import type { UserRole, ElaIntent } from '../ela.types.js';
import type { CanonicalEntities } from './entities.js';

export interface SubTask {
  id: string;
  name: string;
  description: string;
  toolName: string;
  status: 'PENDING' | 'EXECUTING' | 'WAITING_CONFIRMATION' | 'COMPLETED' | 'FAILED';
  isConsequential: boolean;
  requiredEntities: Array<keyof CanonicalEntities>;
  payload?: Record<string, unknown>;
  result?: unknown;
}

export interface GoalPlan {
  goalId: string;
  title: string;
  originalPrompt: string;
  role: UserRole;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  subtasks: SubTask[];
  currentSubtaskIndex: number;
  createdAt: string;
  updatedAt: string;
}

export class GoalManager {
  public static decomposeGoal(
    intent: ElaIntent,
    entities: CanonicalEntities,
    role: UserRole,
    rawPrompt: string
  ): GoalPlan {
    const goalId = `goal-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const subtasks: SubTask[] = [];

    // Goal Decomposition: Farmer Harvest & Transport End-to-End Workflow
    if (intent === 'CREATE_LOGISTICS_WORKFLOW' || /deliver.*to|bhejna.*mandi/i.test(rawPrompt)) {
      subtasks.push({
        id: `st-1-${goalId}`,
        name: 'Validate & Stage Produce Batch',
        description: `Verify inventory for ${entities.formattedQuantity || 'produce'} ${entities.product || ''}`,
        toolName: 'create_product',
        status: 'PENDING',
        isConsequential: true,
        requiredEntities: ['product', 'formattedQuantity'],
        payload: {
          name: entities.product || 'Fresh Produce',
          quantity: entities.formattedQuantity || '500 kg',
          grade: entities.grade || 'A',
        },
      });

      subtasks.push({
        id: `st-2-${goalId}`,
        name: 'Broadcast Rural Transport Request',
        description: `Request pickup to ${entities.destination || 'Pune APMC'}`,
        toolName: 'create_logistics_request',
        status: 'PENDING',
        isConsequential: true,
        requiredEntities: ['destination'],
        payload: {
          productName: entities.product || 'Fresh Produce',
          quantity: entities.formattedQuantity || '500 kg',
          destination: entities.destination || 'Pune APMC Mandi',
          pickupLocation: 'Farm Cluster',
        },
      });
    }

    // Goal Decomposition: Buyer Bulk Procurement Workflow
    else if (intent === 'CREATE_PROCUREMENT_WORKFLOW') {
      subtasks.push({
        id: `st-1-${goalId}`,
        name: 'Check Live Market Produce Catalog',
        description: `Find regional farmers selling ${entities.product || 'produce'}`,
        toolName: 'get_buyer_produce',
        status: 'PENDING',
        isConsequential: false,
        requiredEntities: ['product'],
      });

      subtasks.push({
        id: `st-2-${goalId}`,
        name: 'Stage Bulk Purchase Procurement',
        description: `Broadcast buy order for ${entities.formattedQuantity || '500 kg'} at ${entities.targetPrice || '₹40/kg'}`,
        toolName: 'create_procurement',
        status: 'PENDING',
        isConsequential: true,
        requiredEntities: ['product', 'targetPrice'],
        payload: {
          product: entities.product || 'Organic Produce',
          quantity: entities.formattedQuantity || '500 kg',
          targetPrice: entities.targetPrice || '₹40/kg',
          destination: entities.destination || 'Navi Mumbai APMC Mandi',
        },
      });
    }

    // Default Single-Action Plan
    else {
      const toolMap: Partial<Record<ElaIntent, { name: string; tool: string; isConsequential: boolean }>> = {
        CREATE_PRODUCT_WORKFLOW: { name: 'Add Produce Batch', tool: 'create_product', isConsequential: true },
        CREATE_VEHICLE_WORKFLOW: { name: 'Register Fleet Vehicle', tool: 'create_vehicle', isConsequential: true },
        GET_FARMER_PRODUCTS: { name: 'Retrieve Farmer Products', tool: 'get_farmer_products', isConsequential: false },
        GET_FARMER_DELIVERIES: { name: 'Retrieve Deliveries', tool: 'get_farmer_deliveries', isConsequential: false },
        GET_MARKET_DEMAND: { name: 'Fetch Market Demands', tool: 'get_market_demand', isConsequential: false },
        GET_BUYER_PRODUCE: { name: 'Browse Produce', tool: 'get_buyer_produce', isConsequential: false },
        GET_BUYER_ORDERS: { name: 'Retrieve Buyer Orders', tool: 'get_buyer_orders', isConsequential: false },
        GET_AVAILABLE_TRIPS: { name: 'Fetch Available Trips', tool: 'get_available_trips', isConsequential: false },
        GET_ACTIVE_TRIPS: { name: 'Fetch Active Trips', tool: 'get_active_trips', isConsequential: false },
        GET_VEHICLES: { name: 'Fetch Fleet Vehicles', tool: 'get_vehicles', isConsequential: false },
        GET_EARNINGS: { name: 'Calculate Earnings', tool: 'get_earnings', isConsequential: false },
      };

      const mapped = toolMap[intent] || { name: 'General Information', tool: 'get_portal_info', isConsequential: false };
      subtasks.push({
        id: `st-1-${goalId}`,
        name: mapped.name,
        description: mapped.name,
        toolName: mapped.tool,
        status: 'PENDING',
        isConsequential: mapped.isConsequential,
        requiredEntities: [],
        payload: { ...entities },
      });
    }

    return {
      goalId,
      title: subtasks.map((s) => s.name).join(' → '),
      originalPrompt: rawPrompt,
      role,
      status: 'PLANNING',
      subtasks,
      currentSubtaskIndex: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
