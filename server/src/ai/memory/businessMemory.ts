// PostgreSQL / Prisma Business Entity Memory
// Safe business entity queries for live inventory, orders, and fleet status

import { prisma } from '../../config/prisma.js';

export class BusinessMemory {
  public static async getFarmerSummary(userId: string) {
    const profile = await prisma.farmerProfile.findUnique({
      where: { userId },
      include: {
        products: { where: { status: 'Available' }, take: 5 },
        logisticsRequests: { where: { status: { in: ['Searching', 'Assigned', 'In Transit'] } } },
      },
    });

    return {
      farmName: profile?.farmName || 'Local Farm',
      activeProductCount: profile?.products.length || 0,
      activeShipmentCount: profile?.logisticsRequests.length || 0,
    };
  }

  public static async getBuyerSummary(userId: string) {
    const profile = await prisma.buyerProfile.findUnique({
      where: { userId },
      include: {
        procurements: { where: { status: 'Open' } },
      },
    });

    return {
      businessName: profile?.businessName || 'Commercial Buyer',
      openProcurementCount: profile?.procurements.length || 0,
    };
  }

  public static async getTransporterSummary(userId: string) {
    const profile = await prisma.transporterProfile.findUnique({
      where: { userId },
      include: {
        vehicles: true,
        assignedTrips: { where: { status: { in: ['Assigned', 'Picked Up', 'In Transit'] } } },
      },
    });

    return {
      fleetSize: profile?.vehicles.length || 0,
      activeTripsCount: profile?.assignedTrips.length || 0,
    };
  }
}
