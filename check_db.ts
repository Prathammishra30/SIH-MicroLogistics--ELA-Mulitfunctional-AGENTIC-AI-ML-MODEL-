import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDb() {
    const requests = await prisma.logisticsRequest.findMany({
        where: { farmerId: '82c0290b-8559-4285-8708-02c854a748cd' },
        orderBy: { createdAt: 'desc' },
        take: 5
    });
    
    console.log('Logistics Requests:');
    for (const r of requests) {
        console.log(`  ID: ${r.id}`);
        console.log(`  Product: ${r.productName}`);
        console.log(`  Quantity: ${r.quantity}`);
        console.log(`  Pickup: ${r.pickupLocation}`);
        console.log(`  Destination: ${r.destination}`);
        console.log(`  Status: ${r.status}`);
        console.log(`  CreatedAt: ${r.createdAt}`);
        console.log('');
    }
    
    await prisma.$disconnect();
}

checkDb().catch(console.error);