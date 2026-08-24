-- CreateTable
CREATE TABLE "farmer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT,
    "village" TEXT,
    "district" TEXT,
    "state" TEXT DEFAULT 'Maharashtra',
    "producerType" TEXT DEFAULT 'Farmer',
    "category" TEXT DEFAULT 'Fresh Vegetables & Fruits',
    "farmName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farmer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buyer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "businessName" TEXT,
    "contactPerson" TEXT,
    "businessType" TEXT DEFAULT 'APMC Licensed Commission Agent & Trader',
    "location" TEXT DEFAULT 'Navi Mumbai APMC Mandi',
    "gstin" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transporter_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT,
    "vehicleType" TEXT DEFAULT 'Pickup (1.5 - 2.5 MT)',
    "vehicleRegNo" TEXT,
    "capacity" TEXT DEFAULT '2.0 MT',
    "operatingRegion" TEXT DEFAULT 'Western Maharashtra (Pune - Satara - Kolhapur)',
    "ownership" TEXT DEFAULT 'Driver & Owner',
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transporter_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "harvestDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logistics_requests" (
    "id" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" TEXT,
    "pickupLocation" TEXT,
    "estimatedEarnings" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Searching',
    "driver" TEXT,
    "vehicle" TEXT,
    "destination" TEXT NOT NULL,
    "eta" TEXT,
    "procurementRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logistics_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurement_requests" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "targetPrice" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "requiredBy" TEXT NOT NULL,
    "buyerName" TEXT NOT NULL,
    "farmerName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Open',
    "logisticsRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "procurement_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transporter_vehicles" (
    "id" TEXT NOT NULL,
    "transporterId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "capacity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "utilization" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transporter_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "market_opportunities" (
    "id" TEXT NOT NULL,
    "demandItem" TEXT NOT NULL,
    "buyer" TEXT NOT NULL,
    "price" TEXT NOT NULL,
    "quantityRequired" TEXT NOT NULL,
    "distance" TEXT NOT NULL,
    "logisticsAvailable" BOOLEAN NOT NULL DEFAULT true,
    "matchScore" INTEGER NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_opportunities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "farmer_profiles_userId_key" ON "farmer_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "buyer_profiles_userId_key" ON "buyer_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "transporter_profiles_userId_key" ON "transporter_profiles"("userId");

-- AddForeignKey
ALTER TABLE "farmer_profiles" ADD CONSTRAINT "farmer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buyer_profiles" ADD CONSTRAINT "buyer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transporter_profiles" ADD CONSTRAINT "transporter_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logistics_requests" ADD CONSTRAINT "logistics_requests_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurement_requests" ADD CONSTRAINT "procurement_requests_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "buyer_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transporter_vehicles" ADD CONSTRAINT "transporter_vehicles_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "transporter_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
