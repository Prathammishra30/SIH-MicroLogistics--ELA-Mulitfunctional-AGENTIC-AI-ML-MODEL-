import type { Response } from 'express';
import { Role } from '@prisma/client';
import type { AuthenticatedRequest } from '../../middleware/authenticate.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { prisma } from '../../config/prisma.js';

/**
 * Parses a capacity string like "700 kg", "2.5 MT", "1500" into kilograms.
 * Returns 0 if unparseable.
 */
function parseCapacityToKg(capacity: string): number {
  if (!capacity) return 0;
  const normalized = capacity.trim().toLowerCase();
  const numMatch = normalized.match(/([\d.,]+)/);
  if (!numMatch) return 0;
  const num = parseFloat(numMatch[1].replace(',', ''));
  if (isNaN(num)) return 0;
  if (normalized.includes('mt') || normalized.includes('ton')) {
    return Math.round(num * 1000);
  }
  // If large number without unit, assume kg
  return Math.round(num);
}

/**
 * Retrieves vehicles owned by the authenticated transporter
 */
export async function getMyVehicles(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || (req.user.role !== Role.TRANSPORTER && req.user.role !== Role.ADMIN)) {
      sendError(res, 'Unauthorized access to transporter vehicles', 403);
      return;
    }

    const transporterProfile = await prisma.transporterProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!transporterProfile) {
      sendSuccess(res, 'No transporter profile found. Returning empty list.', { vehicles: [] });
      return;
    }

    const vehicles = await prisma.transporterVehicle.findMany({
      where: { transporterId: transporterProfile.id },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, 'Transporter vehicles retrieved successfully', { vehicles });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve vehicles';
    sendError(res, message, 500);
  }
}

/**
 * Creates a new vehicle owned by the authenticated transporter
 * Enforces registration number uniqueness
 */
export async function createVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || (req.user.role !== Role.TRANSPORTER && req.user.role !== Role.ADMIN)) {
      sendError(res, 'Unauthorized access to add vehicle', 403);
      return;
    }

    let transporterProfile = await prisma.transporterProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!transporterProfile) {
      transporterProfile = await prisma.transporterProfile.create({
        data: {
          userId: req.user.id,
          fullName: req.user.name,
        },
      });
    }

    const { type, registration, capacity } = req.body;

    if (!type || !registration || !capacity) {
      sendError(res, 'Vehicle type, registration number, and capacity are required', 400);
      return;
    }

    const regNormalized = String(registration).trim().toUpperCase();

    // Validate registration uniqueness
    const existingVehicle = await prisma.transporterVehicle.findUnique({
      where: { registration: regNormalized },
    });
    if (existingVehicle) {
      sendError(res, `A vehicle with registration number ${regNormalized} already exists.`, 409);
      return;
    }

    const capacityKg = parseCapacityToKg(String(capacity));

    const newVehicle = await prisma.transporterVehicle.create({
      data: {
        transporterId: transporterProfile.id,
        type: String(type).trim(),
        registration: regNormalized,
        capacity: String(capacity).trim(),
        capacityKg,
        status: 'Available',
        utilization: 0,
      },
    });

    sendSuccess(res, 'Vehicle added successfully', { vehicle: newVehicle }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to add vehicle';
    sendError(res, message, 500);
  }
}

/**
 * Updates a vehicle owned by the authenticated transporter
 */
export async function updateVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || (req.user.role !== Role.TRANSPORTER && req.user.role !== Role.ADMIN)) {
      sendError(res, 'Unauthorized access to update vehicle', 403);
      return;
    }

    const transporterProfile = await prisma.transporterProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!transporterProfile) {
      sendError(res, 'Transporter profile not found', 404);
      return;
    }

    const vehicleId = String(req.params.id);

    const existing = await prisma.transporterVehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!existing || existing.transporterId !== transporterProfile.id) {
      sendError(res, 'Vehicle not found or not owned by you', 404);
      return;
    }

    const { type, registration, capacity, status } = req.body;

    // If registration is changing, check uniqueness
    if (registration) {
      const regNormalized = String(registration).trim().toUpperCase();
      if (regNormalized !== existing.registration) {
        const duplicate = await prisma.transporterVehicle.findUnique({
          where: { registration: regNormalized },
        });
        if (duplicate) {
          sendError(res, `A vehicle with registration number ${regNormalized} already exists.`, 409);
          return;
        }
      }
    }

    const capacityKg = capacity ? parseCapacityToKg(String(capacity)) : undefined;

    const updated = await prisma.transporterVehicle.update({
      where: { id: vehicleId },
      data: {
        ...(type && { type: String(type).trim() }),
        ...(registration && { registration: String(registration).trim().toUpperCase() }),
        ...(capacity && { capacity: String(capacity).trim() }),
        ...(capacityKg !== undefined && { capacityKg }),
        ...(status && { status: String(status).trim() }),
      },
    });

    sendSuccess(res, 'Vehicle updated successfully', { vehicle: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update vehicle';
    sendError(res, message, 500);
  }
}

/**
 * Deactivates (soft-deletes) a vehicle owned by the authenticated transporter
 */
export async function deactivateVehicle(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || (req.user.role !== Role.TRANSPORTER && req.user.role !== Role.ADMIN)) {
      sendError(res, 'Unauthorized access to deactivate vehicle', 403);
      return;
    }

    const transporterProfile = await prisma.transporterProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!transporterProfile) {
      sendError(res, 'Transporter profile not found', 404);
      return;
    }

    const vehicleId = String(req.params.id);

    const existing = await prisma.transporterVehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!existing || existing.transporterId !== transporterProfile.id) {
      sendError(res, 'Vehicle not found or not owned by you', 404);
      return;
    }

    const updated = await prisma.transporterVehicle.update({
      where: { id: vehicleId },
      data: { status: 'Offline' },
    });

    sendSuccess(res, 'Vehicle deactivated successfully', { vehicle: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to deactivate vehicle';
    sendError(res, message, 500);
  }
}

/**
 * Retrieves all available logistics requests across the network waiting for transport pickup.
 * Includes sanitized farmer info (village/district/name, not email/password).
 */
export async function getAvailableTrips(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || (req.user.role !== Role.TRANSPORTER && req.user.role !== Role.ADMIN)) {
      sendError(res, 'Unauthorized access to available trips', 403);
      return;
    }

    const availableRequests = await prisma.logisticsRequest.findMany({
      where: { status: 'Searching' },
      include: {
        farmer: {
          select: {
            id: true,
            farmName: true,
            village: true,
            district: true,
            state: true,
            producerType: true,
          },
        },
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    sendSuccess(res, 'Available logistics trips retrieved successfully', {
      trips: availableRequests,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve available trips';
    sendError(res, message, 500);
  }
}

/**
 * Retrieves all trips accepted by or assigned to the authenticated transporter
 */
export async function getMyAssignedTrips(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || (req.user.role !== Role.TRANSPORTER && req.user.role !== Role.ADMIN)) {
      sendError(res, 'Unauthorized access to assigned trips', 403);
      return;
    }

    const transporterProfile = await prisma.transporterProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!transporterProfile) {
      sendSuccess(res, 'No transporter profile found. Returning empty trips.', { trips: [] });
      return;
    }

    const myTrips = await prisma.logisticsRequest.findMany({
      where: { transporterId: transporterProfile.id },
      include: {
        farmer: {
          select: {
            id: true,
            farmName: true,
            village: true,
            district: true,
          },
        },
        product: true,
        procurementRequest: true,
        vehicleRef: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    sendSuccess(res, 'Assigned trips retrieved successfully', { trips: myTrips });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve assigned trips';
    sendError(res, message, 500);
  }
}

/**
 * Accepts an available logistics request and assigns it to the authenticated transporter.
 * Validates vehicle capacity against requested quantity.
 */
export async function acceptTrip(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || (req.user.role !== Role.TRANSPORTER && req.user.role !== Role.ADMIN)) {
      sendError(res, 'Unauthorized access to accept trip', 403);
      return;
    }

    let transporterProfile = await prisma.transporterProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!transporterProfile) {
      transporterProfile = await prisma.transporterProfile.create({
        data: {
          userId: req.user.id,
          fullName: req.user.name,
        },
      });
    }

    const id = String(req.params.id);
    const { driver, vehicle, vehicleId } = req.body;

    const existingTrip = await prisma.logisticsRequest.findUnique({
      where: { id },
    });

    if (!existingTrip) {
      sendError(res, 'Logistics trip not found', 404);
      return;
    }

    if (existingTrip.status !== 'Searching' && existingTrip.transporterId && existingTrip.transporterId !== transporterProfile.id) {
      sendError(res, 'Trip has already been assigned to another transporter', 409);
      return;
    }

    // Vehicle capacity validation
    let selectedVehicle = null;
    if (vehicleId) {
      selectedVehicle = await prisma.transporterVehicle.findUnique({
        where: { id: vehicleId },
      });

      if (!selectedVehicle || selectedVehicle.transporterId !== transporterProfile.id) {
        sendError(res, 'Selected vehicle not found or not owned by you', 400);
        return;
      }

      if (selectedVehicle.status !== 'Available') {
        sendError(res, 'Selected vehicle is not available', 400);
        return;
      }

      // Capacity validation
      if (existingTrip.quantity && selectedVehicle.capacityKg > 0) {
        const requestedKg = parseCapacityToKg(existingTrip.quantity);
        if (requestedKg > 0 && requestedKg > selectedVehicle.capacityKg) {
          sendError(
            res,
            `Vehicle capacity insufficient. Requested: ${existingTrip.quantity} (~${requestedKg} kg), Vehicle capacity: ${selectedVehicle.capacity} (~${selectedVehicle.capacityKg} kg).`,
            400
          );
          return;
        }
      }
    }

    const vehicleStr = selectedVehicle
      ? `${selectedVehicle.type} (${selectedVehicle.registration})`
      : vehicle ? String(vehicle).trim() : (transporterProfile.vehicleType || 'Pickup Vehicle');
    const driverName = driver ? String(driver).trim() : (transporterProfile.fullName || req.user.name);

    const updatedTrip = await prisma.$transaction(async (tx) => {
      const trip = await tx.logisticsRequest.update({
        where: { id },
        data: {
          transporterId: transporterProfile!.id,
          vehicleId: vehicleId || null,
          driver: driverName,
          vehicle: vehicleStr,
          status: 'Assigned',
          eta: 'Estimated arrival pending',
        },
        include: {
          farmer: {
            select: {
              id: true,
              farmName: true,
              village: true,
              district: true,
            },
          },
          product: true,
          procurementRequest: true,
          vehicleRef: true,
        },
      });

      // Mark vehicle as Busy if assigned
      if (vehicleId) {
        await tx.transporterVehicle.update({
          where: { id: vehicleId },
          data: { status: 'Busy' },
        });
      }

      return trip;
    });

    sendSuccess(res, 'Trip accepted successfully', { trip: updatedTrip }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to accept trip';
    sendError(res, message, 500);
  }
}

/**
 * Updates the trip status (e.g. 'At Pickup', 'Picked Up', 'In Transit', 'Delivered')
 */
export async function updateTripStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.user || (req.user.role !== Role.TRANSPORTER && req.user.role !== Role.ADMIN)) {
      sendError(res, 'Unauthorized access to update trip status', 403);
      return;
    }

    const transporterProfile = await prisma.transporterProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!transporterProfile && req.user.role !== Role.ADMIN) {
      sendError(res, 'Transporter profile not found', 404);
      return;
    }

    const id = String(req.params.id);
    const { status, eta } = req.body;

    const validStatuses = ['Searching', 'Assigned', 'At Pickup', 'Picked Up', 'In Transit', 'Delivered'];
    if (!status || !validStatuses.includes(status)) {
      sendError(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
      return;
    }

    const existingTrip = await prisma.logisticsRequest.findUnique({
      where: { id },
    });

    if (!existingTrip) {
      sendError(res, 'Logistics trip not found', 404);
      return;
    }

    // Atomically update trip and cascade completed state if Delivered
    const updated = await prisma.$transaction(async (tx) => {
      const trip = await tx.logisticsRequest.update({
        where: { id },
        data: {
          status,
          ...(eta && { eta: String(eta).trim() }),
        },
      });

      if (status === 'Delivered') {
        if (trip.procurementRequestId) {
          await tx.procurementRequest.update({
            where: { id: trip.procurementRequestId },
            data: { status: 'Completed' },
          });
        }
        if (trip.productId) {
          await tx.product.update({
            where: { id: trip.productId },
            data: { status: 'Sold' },
          });
        }
        // Release vehicle back to Available
        if (trip.vehicleId) {
          await tx.transporterVehicle.update({
            where: { id: trip.vehicleId },
            data: { status: 'Available' },
          });
        }
      }

      return trip;
    });

    sendSuccess(res, `Trip status updated to ${status}`, { trip: updated }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update trip status';
    sendError(res, message, 500);
  }
}
