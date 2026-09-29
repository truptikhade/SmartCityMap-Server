-- CreateTable
CREATE TABLE "auth"."driver_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "is_available" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "driver_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."vehicles" (
    "id" TEXT NOT NULL,
    "driver_id" TEXT NOT NULL,
    "vehicle_number" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "color" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking"."ride_requests" (
    "id" TEXT NOT NULL,
    "passenger_id" TEXT NOT NULL,
    "driver_id" TEXT,
    "vehicle_id" TEXT,
    "pickup_latitude" DOUBLE PRECISION NOT NULL,
    "pickup_longitude" DOUBLE PRECISION NOT NULL,
    "pickup_address" TEXT,
    "destination_latitude" DOUBLE PRECISION NOT NULL,
    "destination_longitude" DOUBLE PRECISION NOT NULL,
    "destination_address" TEXT,
    "distance_km" DOUBLE PRECISION,
    "duration_minutes" INTEGER,
    "estimated_fare" DOUBLE PRECISION NOT NULL,
    "final_fare" DOUBLE PRECISION,
    "otp_hash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accepted_at" TIMESTAMP(3),
    "arrived_at" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "ride_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "driver_profiles_user_id_key" ON "auth"."driver_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "driver_profiles_license_number_key" ON "auth"."driver_profiles"("license_number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vehicle_number_key" ON "auth"."vehicles"("vehicle_number");

-- CreateIndex
CREATE INDEX "vehicles_driver_id_idx" ON "auth"."vehicles"("driver_id");

-- CreateIndex
CREATE INDEX "vehicles_vehicle_type_idx" ON "auth"."vehicles"("vehicle_type");

-- CreateIndex
CREATE INDEX "ride_requests_passenger_id_idx" ON "booking"."ride_requests"("passenger_id");

-- CreateIndex
CREATE INDEX "ride_requests_driver_id_idx" ON "booking"."ride_requests"("driver_id");

-- CreateIndex
CREATE INDEX "ride_requests_vehicle_id_idx" ON "booking"."ride_requests"("vehicle_id");

-- CreateIndex
CREATE INDEX "ride_requests_status_idx" ON "booking"."ride_requests"("status");

-- AddForeignKey
ALTER TABLE "auth"."driver_profiles" ADD CONSTRAINT "driver_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."vehicles" ADD CONSTRAINT "vehicles_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "auth"."driver_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking"."ride_requests" ADD CONSTRAINT "ride_requests_passenger_id_fkey" FOREIGN KEY ("passenger_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking"."ride_requests" ADD CONSTRAINT "ride_requests_driver_id_fkey" FOREIGN KEY ("driver_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking"."ride_requests" ADD CONSTRAINT "ride_requests_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "auth"."vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
