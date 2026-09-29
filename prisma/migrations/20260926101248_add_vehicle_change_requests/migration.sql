-- CreateTable
CREATE TABLE "auth"."vehicle_change_requests" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "vehicle_number" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "color" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "vehicle_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_change_requests_driver_id_status_idx" ON "auth"."vehicle_change_requests"("driver_id", "status");

-- CreateIndex
CREATE INDEX "vehicle_change_requests_vehicle_id_status_idx" ON "auth"."vehicle_change_requests"("vehicle_id", "status");

-- CreateIndex
CREATE INDEX "vehicle_change_requests_status_idx" ON "auth"."vehicle_change_requests"("status");

-- AddForeignKey
ALTER TABLE "auth"."vehicle_change_requests" ADD CONSTRAINT "vehicle_change_requests_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "auth"."driver_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."vehicle_change_requests" ADD CONSTRAINT "vehicle_change_requests_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "auth"."vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
