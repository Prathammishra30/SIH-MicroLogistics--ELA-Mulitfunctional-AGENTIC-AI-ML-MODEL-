// Safe Navigation Tool for ELA
// Whitelisted Route Mapper strictly aligned with RuralFlow React Routes

import type { ElaToolDefinition, ElaExecutionContext, ElaToolResult, UserRole } from '../ela.types.js';

interface RouteDestinationConfig {
  route: string;
  label: string;
  allowedRoles: UserRole[];
  description: string;
}

export const ROUTE_REGISTRY: Record<string, RouteDestinationConfig> = {
  // Public & Common Routes
  home: {
    route: '/',
    label: 'Home / Gateway',
    allowedRoles: ['FARMER', 'BUYER', 'TRANSPORTER', 'ADMIN', 'GUEST'],
    description: 'RuralFlow public landing and gateway portal.',
  },
  login_farmer: {
    route: '/auth/farmer',
    label: 'Farmer Portal Login',
    allowedRoles: ['FARMER', 'BUYER', 'TRANSPORTER', 'ADMIN', 'GUEST'],
    description: 'Authentication and sign-in page for Farmers.',
  },
  login_buyer: {
    route: '/auth/buyer',
    label: 'Commercial Buyer Portal Login',
    allowedRoles: ['FARMER', 'BUYER', 'TRANSPORTER', 'ADMIN', 'GUEST'],
    description: 'Authentication and sign-in page for Commercial Buyers & Mandi Traders.',
  },
  login_transporter: {
    route: '/auth/transporter',
    label: 'Transporter Portal Login',
    allowedRoles: ['FARMER', 'BUYER', 'TRANSPORTER', 'ADMIN', 'GUEST'],
    description: 'Authentication and sign-in page for Transporters and Fleet Drivers.',
  },

  // Farmer Routes
  farmer_dashboard: {
    route: '/farmer/dashboard',
    label: 'Farmer Dashboard',
    allowedRoles: ['FARMER', 'ADMIN'],
    description: 'Main farmer overview with quick actions, active requests, and statistics.',
  },
  farmer_products: {
    route: '/farmer/products',
    label: 'My Products',
    allowedRoles: ['FARMER', 'ADMIN'],
    description: 'Catalog of farmer registered crops and harvest batches.',
  },
  farmer_add_product: {
    route: '/farmer/products/new',
    label: 'Add New Product',
    allowedRoles: ['FARMER', 'ADMIN'],
    description: 'Form to register and list a new crop or agricultural product.',
  },
  farmer_markets: {
    route: '/farmer/markets',
    label: 'Market Demand & Opportunities',
    allowedRoles: ['FARMER', 'ADMIN'],
    description: 'Live APMC market opportunities and commercial buyer demands.',
  },
  farmer_logistics: {
    route: '/farmer/logistics',
    label: 'Logistics Request',
    allowedRoles: ['FARMER', 'ADMIN'],
    description: 'Create a transport request for crops to reach mandi or buyers.',
  },
  farmer_deliveries: {
    route: '/farmer/deliveries',
    label: 'Deliveries & Shipments',
    allowedRoles: ['FARMER', 'ADMIN'],
    description: 'Live delivery timeline and shipment tracking for dispatched produce.',
  },

  // Buyer Routes
  buyer_dashboard: {
    route: '/buyer/dashboard',
    label: 'Buyer Dashboard',
    allowedRoles: ['BUYER', 'ADMIN'],
    description: 'Commercial buyer overview of procurement, orders, and active demands.',
  },
  buyer_procurement: {
    route: '/buyer/procurement',
    label: 'Post Procurement Request',
    allowedRoles: ['BUYER', 'ADMIN'],
    description: 'Create and broadcast a bulk purchase demand to farmers.',
  },
  buyer_orders: {
    route: '/buyer/orders',
    label: 'Buyer Orders & Tracking',
    allowedRoles: ['BUYER', 'ADMIN'],
    description: 'Track ongoing procurement orders, transporter status, and deliveries.',
  },
  buyer_produce: {
    route: '/buyer/produce',
    label: 'Produce Catalog',
    allowedRoles: ['BUYER', 'ADMIN'],
    description: 'Browse available crops and verified farmers in the region.',
  },

  // Transporter Routes
  transporter_dashboard: {
    route: '/transporter/dashboard',
    label: 'Transporter Dashboard',
    allowedRoles: ['TRANSPORTER', 'ADMIN'],
    description: 'Transporter overview of available loads, fleet status, and earnings.',
  },
  transporter_trips: {
    route: '/transporter/trips',
    label: 'Available Trips & Loads',
    allowedRoles: ['TRANSPORTER', 'ADMIN'],
    description: 'Search and accept available farmer logistics requests.',
  },
  transporter_active_trips: {
    route: '/transporter/active',
    label: 'Active Trips & Shipments',
    allowedRoles: ['TRANSPORTER', 'ADMIN'],
    description: 'Manage current assigned trips, update milestones, and confirm deliveries.',
  },
  transporter_vehicles: {
    route: '/transporter/vehicles',
    label: 'My Vehicles',
    allowedRoles: ['TRANSPORTER', 'ADMIN'],
    description: 'Manage fleet registrations, truck capacities, and driver details.',
  },
  transporter_earnings: {
    route: '/transporter/earnings',
    label: 'Earnings & Settlements',
    allowedRoles: ['TRANSPORTER', 'ADMIN'],
    description: 'Financial overview of completed trips and payouts.',
  },
  transporter_performance: {
    route: '/transporter/performance',
    label: 'Transporter Performance',
    allowedRoles: ['TRANSPORTER', 'ADMIN'],
    description: 'On-time delivery rates, driver ratings, and reliability metrics.',
  },
};

export const navigateToPageTool: ElaToolDefinition = {
  name: 'navigate_to_page',
  description:
    'Safely navigates the user to a verified, whitelisted page within RuralFlow based on role permissions.',
  parameters: {
    type: 'object',
    properties: {
      destination: {
        type: 'string',
        description: `Whitelisted target destination. Allowed keys: ${Object.keys(ROUTE_REGISTRY).join(', ')}`,
      },
      params: {
        type: 'object',
        description: 'Optional URL parameters (e.g. id for specific detail page).',
      },
    },
    required: ['destination'],
  },
  allowedRoles: ['FARMER', 'BUYER', 'TRANSPORTER', 'ADMIN', 'GUEST'],
  execute: async (args: Record<string, unknown>, context: ElaExecutionContext): Promise<ElaToolResult> => {
    const destination = String(args.destination || '').trim().toLowerCase();
    const config = ROUTE_REGISTRY[destination];

    if (!config) {
      return {
        toolName: 'navigate_to_page',
        success: false,
        error: `Invalid destination '${destination}'. Allowed destinations: ${Object.keys(ROUTE_REGISTRY).join(', ')}`,
      };
    }

    const currentRole = context.authenticatedUser?.role || context.role || 'GUEST';

    // Verify backend authorization
    if (!config.allowedRoles.includes(currentRole)) {
      return {
        toolName: 'navigate_to_page',
        success: false,
        error: `Permission Denied: Your role '${currentRole}' is not authorized to access '${config.label}'.`,
      };
    }

    let finalRoute = config.route;
    if (args.params && typeof args.params === 'object') {
      const paramMap = args.params as Record<string, string>;
      for (const [k, v] of Object.entries(paramMap)) {
        finalRoute = finalRoute.replace(`:${k}`, encodeURIComponent(v));
      }
    }

    return {
      toolName: 'navigate_to_page',
      success: true,
      data: {
        destination,
        route: finalRoute,
        label: config.label,
        description: config.description,
      },
      navigation: {
        destination,
        route: finalRoute,
        role: currentRole,
        label: config.label,
        description: config.description,
      },
      userFacingMessage: `Navigating to ${config.label}...`,
    };
  },
};
