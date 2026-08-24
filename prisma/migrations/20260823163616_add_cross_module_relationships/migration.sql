-- AlterTable
ALTER TABLE "logistics_requests" ADD COLUMN IF NOT EXISTS "productId" TEXT,
ADD COLUMN IF NOT EXISTS "transporterId" TEXT,
ADD COLUMN IF NOT EXISTS "vehicleId" TEXT;

-- Clean up any invalid procurementRequestId references that don't exist in procurement_requests
UPDATE "logistics_requests"
SET "procurementRequestId" = NULL
WHERE "procurementRequestId" IS NOT NULL
  AND "procurementRequestId" NOT IN (SELECT "id" FROM "procurement_requests");

-- AddForeignKey
ALTER TABLE "logistics_requests" DROP CONSTRAINT IF EXISTS "logistics_requests_productId_fkey";
ALTER TABLE "logistics_requests" ADD CONSTRAINT "logistics_requests_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logistics_requests" DROP CONSTRAINT IF EXISTS "logistics_requests_transporterId_fkey";
ALTER TABLE "logistics_requests" ADD CONSTRAINT "logistics_requests_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "transporter_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logistics_requests" DROP CONSTRAINT IF EXISTS "logistics_requests_vehicleId_fkey";
ALTER TABLE "logistics_requests" ADD CONSTRAINT "logistics_requests_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "transporter_vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "logistics_requests" DROP CONSTRAINT IF EXISTS "logistics_requests_procurementRequestId_fkey";
ALTER TABLE "logistics_requests" ADD CONSTRAINT "logistics_requests_procurementRequestId_fkey" FOREIGN KEY ("procurementRequestId") REFERENCES "procurement_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
