import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding RuralFlow database with data ownership architecture...');

  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('Admin@1234', saltRounds);
  const demoPasswordHash = await bcrypt.hash('password123', saltRounds);

  // 1. Seed System Administrator
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ruralflow.in' },
    update: {
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      name: 'System Administrator',
    },
    create: {
      email: 'admin@ruralflow.in',
      name: 'System Administrator',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      phone: '9000000000',
    },
  });
  console.log(`✅ Admin Account Seeded: ${admin.email} (UUID: ${admin.id})`);

  // 2. Seed Demo Farmer with FarmerProfile and Demo Products
  const farmer = await prisma.user.upsert({
    where: { email: 'farmer@ruralflow.in' },
    update: {
      passwordHash: demoPasswordHash,
      role: Role.FARMER,
      name: 'Ramesh Patel',
      phone: '9876543210',
    },
    create: {
      email: 'farmer@ruralflow.in',
      name: 'Ramesh Patel',
      phone: '9876543210',
      passwordHash: demoPasswordHash,
      role: Role.FARMER,
    },
  });

  const farmerProfile = await prisma.farmerProfile.upsert({
    where: { userId: farmer.id },
    update: {
      village: 'Shirwal',
      district: 'Satara',
      state: 'Maharashtra',
      farmName: 'Krishi Green Farms',
      producerType: 'Farmer',
      category: 'Fresh Vegetables & Fruits',
      phone: '9876543210',
    },
    create: {
      userId: farmer.id,
      village: 'Shirwal',
      district: 'Satara',
      state: 'Maharashtra',
      farmName: 'Krishi Green Farms',
      producerType: 'Farmer',
      category: 'Fresh Vegetables & Fruits',
      phone: '9876543210',
    },
  });
  console.log(`✅ Demo Farmer Profile Seeded: ${farmer.email} (FarmerProfile ID: ${farmerProfile.id})`);

  // Seed demo products owned specifically by Demo Farmer
  const demoProducts = [
    {
      name: 'Organic Tomatoes',
      category: 'Vegetables',
      quantity: '1.2 MT',
      grade: 'Grade A',
      harvestDate: '2026-08-20',
      status: 'Available',
    },
    {
      name: 'Red Onions',
      category: 'Vegetables',
      quantity: '3.5 MT',
      grade: 'Standard',
      harvestDate: '2026-08-19',
      status: 'Available',
    },
    {
      name: 'Sharbati Wheat',
      category: 'Grains',
      quantity: '2.5 MT',
      grade: 'Grade A',
      harvestDate: '2026-08-18',
      status: 'Available',
    },
  ];

  for (const p of demoProducts) {
    const existing = await prisma.product.findFirst({
      where: { farmerId: farmerProfile.id, name: p.name },
    });
    if (!existing) {
      await prisma.product.create({
        data: {
          farmerId: farmerProfile.id,
          ...p,
        },
      });
    }
  }

  // Seed Demo Logistics Request for Demo Farmer
  const existingLogistics = await prisma.logisticsRequest.findFirst({
    where: { farmerId: farmerProfile.id },
  });
  if (!existingLogistics) {
    await prisma.logisticsRequest.create({
      data: {
        farmerId: farmerProfile.id,
        productName: 'Organic Tomatoes (Grade A)',
        quantity: '500 kg',
        pickupLocation: 'Village Shirwal, Satara',
        estimatedEarnings: '₹1,850',
        status: 'In Transit',
        driver: 'Sunil Deshmukh',
        vehicle: 'Medium Goods Carrier (MH 14 CD 5678)',
        destination: 'Pune Vashi Market',
        eta: 'Today, 2:30 PM',
        procurementRequestId: 'PR-1001',
      },
    });
  }

  // 3. Seed Demo Buyer with BuyerProfile & Procurement
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@ruralflow.in' },
    update: {
      passwordHash: demoPasswordHash,
      role: Role.BUYER,
      name: 'Rajesh Singhania',
      phone: '9876543211',
    },
    create: {
      email: 'buyer@ruralflow.in',
      name: 'Rajesh Singhania',
      phone: '9876543211',
      passwordHash: demoPasswordHash,
      role: Role.BUYER,
    },
  });

  const buyerProfile = await prisma.buyerProfile.upsert({
    where: { userId: buyer.id },
    update: {
      businessName: 'Sahyadri Agri Traders Pvt Ltd',
      contactPerson: 'Rajesh Singhania',
      businessType: 'APMC Licensed Commission Agent & Trader',
      location: 'Navi Mumbai APMC Mandi',
      gstin: '27AAAAA0000A1Z5',
      phone: '9876543211',
    },
    create: {
      userId: buyer.id,
      businessName: 'Sahyadri Agri Traders Pvt Ltd',
      contactPerson: 'Rajesh Singhania',
      businessType: 'APMC Licensed Commission Agent & Trader',
      location: 'Navi Mumbai APMC Mandi',
      gstin: '27AAAAA0000A1Z5',
      phone: '9876543211',
    },
  });
  console.log(`✅ Demo Buyer Profile Seeded: ${buyer.email} (BuyerProfile ID: ${buyerProfile.id})`);

  const existingProcurement = await prisma.procurementRequest.findFirst({
    where: { buyerId: buyerProfile.id },
  });
  if (!existingProcurement) {
    await prisma.procurementRequest.create({
      data: {
        buyerId: buyerProfile.id,
        product: 'Organic Tomatoes (Grade A)',
        quantity: '500 kg',
        targetPrice: '₹38/kg',
        destination: 'Pune Vashi Market',
        requiredBy: '2026-08-24',
        buyerName: 'Rajesh Singhania',
        status: 'Logistics Requested',
        logisticsRequestId: 'RF-1029',
      },
    });
  }

  // 4. Seed Demo Transporter with TransporterProfile & Vehicles
  const transporter = await prisma.user.upsert({
    where: { email: 'transporter@ruralflow.in' },
    update: {
      passwordHash: demoPasswordHash,
      role: Role.TRANSPORTER,
      name: 'Sunil Deshmukh',
      phone: '9876543212',
    },
    create: {
      email: 'transporter@ruralflow.in',
      name: 'Sunil Deshmukh',
      phone: '9876543212',
      passwordHash: demoPasswordHash,
      role: Role.TRANSPORTER,
    },
  });

  const transporterProfile = await prisma.transporterProfile.upsert({
    where: { userId: transporter.id },
    update: {
      fullName: 'Sunil Deshmukh',
      vehicleType: 'Pickup (1.5 - 2.5 MT)',
      vehicleRegNo: 'MH 14 CD 5678',
      capacity: '2.0 MT',
      operatingRegion: 'Western Maharashtra (Pune - Satara - Kolhapur)',
      ownership: 'Driver & Owner',
      phone: '9876543212',
    },
    create: {
      userId: transporter.id,
      fullName: 'Sunil Deshmukh',
      vehicleType: 'Pickup (1.5 - 2.5 MT)',
      vehicleRegNo: 'MH 14 CD 5678',
      capacity: '2.0 MT',
      operatingRegion: 'Western Maharashtra (Pune - Satara - Kolhapur)',
      ownership: 'Driver & Owner',
      phone: '9876543212',
    },
  });
  console.log(`✅ Demo Transporter Profile Seeded: ${transporter.email} (TransporterProfile ID: ${transporterProfile.id})`);

  const existingVehicle = await prisma.transporterVehicle.findFirst({
    where: { transporterId: transporterProfile.id },
  });
  if (!existingVehicle) {
    await prisma.transporterVehicle.create({
      data: {
        transporterId: transporterProfile.id,
        type: 'Medium Goods Carrier',
        registration: 'MH 14 CD 5678',
        capacity: '700 kg',
        status: 'Busy',
        utilization: 71,
      },
    });
    await prisma.transporterVehicle.create({
      data: {
        transporterId: transporterProfile.id,
        type: 'Large Goods Carrier',
        registration: 'MH 12 AB 1234',
        capacity: '2.5 MT',
        status: 'Available',
        utilization: 0,
      },
    });
  }

  // 5. Seed Global Platform-Wide Market Opportunities (NO farmerId! Accessible to ALL farmers)
  const globalMarkets = [
    {
      demandItem: 'Organic Tomatoes (Grade A)',
      buyer: 'Pune Vashi Demand',
      price: '₹38/kg',
      quantityRequired: '1,200 kg',
      distance: '45 km',
      logisticsAvailable: true,
      matchScore: 98,
    },
    {
      demandItem: 'Fresh Red Onions',
      buyer: 'Navi Mumbai APMC',
      price: '₹29/kg',
      quantityRequired: '3.5 MT',
      distance: '110 km',
      logisticsAvailable: true,
      matchScore: 85,
    },
    {
      demandItem: 'Sharbati Wheat (Grade A)',
      buyer: 'Kolhapur Grain Trading Corp',
      price: '₹42/kg',
      quantityRequired: '5.0 MT',
      distance: '80 km',
      logisticsAvailable: true,
      matchScore: 92,
    },
  ];

  for (const m of globalMarkets) {
    const existing = await prisma.marketOpportunity.findFirst({
      where: { demandItem: m.demandItem, buyer: m.buyer },
    });
    if (!existing) {
      await prisma.marketOpportunity.create({ data: m });
    }
  }
  console.log('✅ Global Platform-Wide Market Opportunities Seeded.');

  console.log('✨ Database seeding complete with isolated ownership architecture.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
