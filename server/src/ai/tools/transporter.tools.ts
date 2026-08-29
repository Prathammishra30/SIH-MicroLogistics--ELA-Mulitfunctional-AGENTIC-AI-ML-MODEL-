// Transporter Domain Tools (Phase 2 Real Action & Data Execution)
// AgriRoute / RuralFlow ELA Transporter Fleet Engine

import type { ElaToolDefinition, ElaExecutionContext, ElaToolResult } from '../ela.types.js';
import { prisma } from '../../config/prisma.js';

export const getAvailableTripsTool: ElaToolDefinition = {
  name: 'get_available_trips',
  description: 'Fetches real unassigned farm produce loads waiting for transporter pickup.',
  parameters: {
    type: 'object',
    properties: {
      destination: {
        type: 'string',
        description: 'Optional destination mandi/city filter',
      },
    },
  },
  allowedRoles: ['TRANSPORTER', 'ADMIN', 'GUEST'],
  execute: async (args: Record<string, unknown>, _context: ElaExecutionContext): Promise<ElaToolResult> => {
    try {
      const dest = args.destination ? String(args.destination).trim() : '';
      const availableRequests = await prisma.logisticsRequest.findMany({
        where: {
          status: 'Searching',
          ...(dest ? { destination: { contains: dest, mode: 'insensitive' } } : {}),
        },
        include: {
          farmer: {
            select: {
              farmName: true,
              village: true,
              district: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      const summaryList = availableRequests
        .map(
          (t) =>
            `• Trip ID: ${t.id.slice(0, 8)} | ${t.productName} (${t.quantity || 'N/A'}) | Pickup: ${
              t.pickupLocation || t.farmer.village || 'Farm'
            } → ${t.destination} | Est. Payout: ${t.estimatedEarnings || 'Standard'}`
        )
        .join('\n');

      return {
        toolName: 'get_available_trips',
        success: true,
        data: { trips: availableRequests, count: availableRequests.length },
        userFacingMessage:
          availableRequests.length > 0
            ? `Available Produce Pickup Loads (${availableRequests.length}):\n${summaryList}`
            : 'No open pickup loads available at this moment in your region.',
      };
    } catch {
      return {
        toolName: 'get_available_trips',
        success: false,
        error: 'Failed to retrieve available logistics trips.',
      };
    }
  },
};

export const getActiveTripsTool: ElaToolDefinition = {
  name: 'get_active_trips',
  description: 'Fetches active assigned trips currently being transported by the authenticated transporter.',
  parameters: {
    type: 'object',
    properties: {},
  },
  allowedRoles: ['TRANSPORTER', 'ADMIN'],
  execute: async (_args: Record<string, unknown>, context: ElaExecutionContext): Promise<ElaToolResult> => {
    if (!context.authenticatedUser) {
      return {
        toolName: 'get_active_trips',
        success: false,
        error: 'Authentication required to view active trips.',
      };
    }

    try {
      const transporterProfile = await prisma.transporterProfile.findUnique({
        where: { userId: context.authenticatedUser.id },
      });

      if (!transporterProfile) {
        return {
          toolName: 'get_active_trips',
          success: true,
          data: { trips: [], count: 0 },
          userFacingMessage: 'You do not have any active trips assigned currently.',
        };
      }

      const activeTrips = await prisma.logisticsRequest.findMany({
        where: {
          transporterId: transporterProfile.id,
          status: { in: ['Assigned', 'At Pickup', 'Picked Up', 'In Transit'] },
        },
        orderBy: { updatedAt: 'desc' },
      });

      const summaryList = activeTrips
        .map(
          (t) =>
            `• ${t.productName} (${t.quantity || 'N/A'}): ${t.pickupLocation || 'Pickup'} → ${
              t.destination
            } (Status: ${t.status}${t.eta ? `, ETA: ${t.eta}` : ''})`
        )
        .join('\n');

      return {
        toolName: 'get_active_trips',
        success: true,
        data: { trips: activeTrips, count: activeTrips.length },
        userFacingMessage:
          activeTrips.length > 0
            ? `Your Active Trips (${activeTrips.length}):\n${summaryList}`
            : 'You currently have no ongoing trips in transit.',
      };
    } catch {
      return {
        toolName: 'get_active_trips',
        success: false,
        error: 'Failed to retrieve active trips.',
      };
    }
  },
};

export const getVehiclesTool: ElaToolDefinition = {
  name: 'get_vehicles',
  description: 'Fetches the registered vehicle fleet for the authenticated transporter.',
  parameters: {
    type: 'object',
    properties: {},
  },
  allowedRoles: ['TRANSPORTER', 'ADMIN'],
  execute: async (_args: Record<string, unknown>, context: ElaExecutionContext): Promise<ElaToolResult> => {
    if (!context.authenticatedUser) {
      return {
        toolName: 'get_vehicles',
        success: false,
        error: 'Authentication required to access vehicles.',
      };
    }

    try {
      const transporterProfile = await prisma.transporterProfile.findUnique({
        where: { userId: context.authenticatedUser.id },
      });

      if (!transporterProfile) {
        return {
          toolName: 'get_vehicles',
          success: true,
          data: { vehicles: [], count: 0 },
          userFacingMessage: 'No vehicles registered under your account yet.',
        };
      }

      const vehicles = await prisma.transporterVehicle.findMany({
        where: { transporterId: transporterProfile.id },
        orderBy: { createdAt: 'desc' },
      });

      const summaryList = vehicles
        .map((v) => `• ${v.type} (${v.registration}): Capacity ${v.capacity}, Status: ${v.status}`)
        .join('\n');

      return {
        toolName: 'get_vehicles',
        success: true,
        data: { vehicles, count: vehicles.length },
        userFacingMessage:
          vehicles.length > 0
            ? `Your Registered Vehicles (${vehicles.length}):\n${summaryList}`
            : 'You have no vehicles registered yet. You can add one anytime.',
      };
    } catch {
      return {
        toolName: 'get_vehicles',
        success: false,
        error: 'Failed to load vehicle fleet.',
      };
    }
  },
};

export const getEarningsTool: ElaToolDefinition = {
  name: 'get_earnings',
  description: 'Calculates completed trip earnings and settlement summary for the authenticated transporter.',
  parameters: {
    type: 'object',
    properties: {},
  },
  allowedRoles: ['TRANSPORTER', 'ADMIN'],
  execute: async (_args: Record<string, unknown>, context: ElaExecutionContext): Promise<ElaToolResult> => {
    if (!context.authenticatedUser) {
      return {
        toolName: 'get_earnings',
        success: false,
        error: 'Authentication required to view earnings.',
      };
    }

    try {
      const transporterProfile = await prisma.transporterProfile.findUnique({
        where: { userId: context.authenticatedUser.id },
      });

      if (!transporterProfile) {
        return {
          toolName: 'get_earnings',
          success: true,
          data: { totalEarnings: 0, completedTripsCount: 0 },
          userFacingMessage: 'No earnings recorded yet.',
        };
      }

      const completedTrips = await prisma.logisticsRequest.findMany({
        where: {
          transporterId: transporterProfile.id,
          status: 'Delivered',
        },
      });

      let totalAmount = 0;
      for (const trip of completedTrips) {
        if (trip.estimatedEarnings) {
          const num = parseFloat(trip.estimatedEarnings.replace(/[^\d.]/g, ''));
          if (!isNaN(num)) totalAmount += num;
        }
      }

      return {
        toolName: 'get_earnings',
        success: true,
        data: {
          totalEarnings: totalAmount,
          completedTripsCount: completedTrips.length,
          formatted: `₹${totalAmount.toLocaleString('en-IN')}`,
        },
        userFacingMessage: `Total completed deliveries: **${completedTrips.length}**\nTotal settled payout: **₹${totalAmount.toLocaleString('en-IN')}**`,
      };
    } catch {
      return {
        toolName: 'get_earnings',
        success: false,
        error: 'Failed to compute earnings.',
      };
    }
  },
};

export const acceptTripTool: ElaToolDefinition = {
  name: 'accept_trip',
  description: 'Accepts an available logistics load and assigns it to the transporter (Requires confirmation).',
  parameters: {
    type: 'object',
    properties: {
      tripId: { type: 'string', description: 'Logistics request ID to accept' },
      pickupLocation: { type: 'string', description: 'Pickup location' },
      destination: { type: 'string', description: 'Delivery destination' },
      productName: { type: 'string', description: 'Produce name' },
      quantity: { type: 'string', description: 'Quantity to transport' },
      estimatedEarnings: { type: 'string', description: 'Freight payout' },
    },
    required: ['tripId'],
  },
  allowedRoles: ['TRANSPORTER', 'ADMIN'],
  isConsequential: true,
  execute: async (args: Record<string, unknown>, context: ElaExecutionContext): Promise<ElaToolResult> => {
    if (!context.authenticatedUser) {
      return {
        toolName: 'accept_trip',
        success: false,
        error: 'Authentication required to accept trips.',
      };
    }

    const tripId = String(args.tripId || '').trim();
    if (!tripId) {
      return {
        toolName: 'accept_trip',
        success: false,
        error: 'Trip ID is required to accept a load.',
      };
    }

    // Confirmation Policy Check
    if (!context.confirmed) {
      const productName = String(args.productName || 'Farm Produce').trim();
      const destination = String(args.destination || 'Delivery Mandi').trim();
      const pickupLocation = String(args.pickupLocation || 'Farm Pickup').trim();
      const estimatedEarnings = String(args.estimatedEarnings || '₹4,500').trim();

      return {
        toolName: 'accept_trip',
        success: true,
        confirmation: {
          actionId: `trip-${Date.now()}`,
          toolName: 'accept_trip',
          title: 'Accept Logistics Trip',
          summary: `Accept shipment of ${productName} from ${pickupLocation} to ${destination} (${estimatedEarnings}).`,
          params: { tripId, productName, destination, pickupLocation, estimatedEarnings },
          confirmLabel: 'Accept & Assign Load',
          cancelLabel: 'Cancel',
        },
        userFacingMessage: `Please confirm that you want to accept this trip for **${productName}** to **${destination}** (${estimatedEarnings}).`,
      };
    }

    // Execute Mutation
    try {
      let transporterProfile = await prisma.transporterProfile.findUnique({
        where: { userId: context.authenticatedUser.id },
      });

      if (!transporterProfile) {
        transporterProfile = await prisma.transporterProfile.create({
          data: {
            userId: context.authenticatedUser.id,
            fullName: context.authenticatedUser.name,
          },
        });
      }

      // Check if trip exists and is available
      const existingTrip = await prisma.logisticsRequest.findUnique({
        where: { id: tripId },
      });

      if (!existingTrip) {
        return {
          toolName: 'accept_trip',
          success: false,
          error: 'The requested trip was not found.',
        };
      }

      if (existingTrip.status !== 'Searching') {
        return {
          toolName: 'accept_trip',
          success: false,
          error: `Trip is already in '${existingTrip.status}' status and cannot be accepted.`,
        };
      }

      const updatedTrip = await prisma.logisticsRequest.update({
        where: { id: tripId },
        data: {
          transporterId: transporterProfile.id,
          driver: transporterProfile.fullName || context.authenticatedUser.name,
          status: 'Assigned',
          eta: 'Today, 6:00 PM',
        },
      });

      return {
        toolName: 'accept_trip',
        success: true,
        data: { trip: updatedTrip },
        userFacingMessage: `Trip accepted successfully! You are assigned to transport **${updatedTrip.productName}** to **${updatedTrip.destination}**.`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Database update failed';
      return {
        toolName: 'accept_trip',
        success: false,
        error: `Could not accept trip: ${msg}`,
      };
    }
  },
};

export const createVehicleTool: ElaToolDefinition = {
  name: 'create_vehicle',
  description: 'Registers a new delivery vehicle or truck to the transporter fleet (Requires confirmation).',
  parameters: {
    type: 'object',
    properties: {
      type: { type: 'string', description: 'Vehicle type (e.g. Pickup 1.5 MT, Mini Truck, 3-Wheeler)' },
      registration: { type: 'string', description: 'Vehicle registration number (e.g. MH 12 AB 1234)' },
      capacity: { type: 'string', description: 'Capacity (e.g. 1.5 MT, 750 kg)' },
    },
    required: ['type', 'registration', 'capacity'],
  },
  allowedRoles: ['TRANSPORTER', 'ADMIN'],
  isConsequential: true,
  execute: async (args: Record<string, unknown>, context: ElaExecutionContext): Promise<ElaToolResult> => {
    if (!context.authenticatedUser) {
      return {
        toolName: 'create_vehicle',
        success: false,
        error: 'Authentication required to add vehicles.',
      };
    }

    const type = String(args.type || 'Pickup (1.5 MT)').trim();
    const registration = String(args.registration || '').trim().toUpperCase();
    const capacity = String(args.capacity || '1.5 MT').trim();

    if (!registration) {
      return {
        toolName: 'create_vehicle',
        success: false,
        error: 'Vehicle registration number is required.',
      };
    }

    // Confirmation Policy Check
    if (!context.confirmed) {
      return {
        toolName: 'create_vehicle',
        success: true,
        confirmation: {
          actionId: `veh-${Date.now()}`,
          toolName: 'create_vehicle',
          title: 'Register Vehicle',
          summary: `Add ${type} (${registration}, Capacity: ${capacity}) to your active fleet.`,
          params: { type, registration, capacity },
          confirmLabel: 'Confirm & Register Vehicle',
          cancelLabel: 'Cancel',
        },
        userFacingMessage: `Please confirm adding **${type}** (${registration}) to your fleet.`,
      };
    }

    // Execute Mutation
    try {
      let transporterProfile = await prisma.transporterProfile.findUnique({
        where: { userId: context.authenticatedUser.id },
      });

      if (!transporterProfile) {
        transporterProfile = await prisma.transporterProfile.create({
          data: {
            userId: context.authenticatedUser.id,
            fullName: context.authenticatedUser.name,
          },
        });
      }

      // Check unique registration
      const existing = await prisma.transporterVehicle.findUnique({
        where: { registration },
      });

      if (existing) {
        return {
          toolName: 'create_vehicle',
          success: false,
          error: `Vehicle registration ${registration} already exists in the system.`,
        };
      }

      const newVehicle = await prisma.transporterVehicle.create({
        data: {
          transporterId: transporterProfile.id,
          type,
          registration,
          capacity,
          status: 'Available',
          utilization: 0,
        },
      });

      return {
        toolName: 'create_vehicle',
        success: true,
        data: { vehicle: newVehicle },
        userFacingMessage: `Vehicle **${newVehicle.registration}** (${newVehicle.type}) successfully registered and ready for dispatch!`,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Database insertion failed';
      return {
        toolName: 'create_vehicle',
        success: false,
        error: `Could not register vehicle: ${msg}`,
      };
    }
  },
};
