-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "booking";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "geo";

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "transit";

-- CreateTable
CREATE TABLE "auth"."users" (
    "id" TEXT NOT NULL,
    "fname" TEXT NOT NULL,
    "lname" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "profile_pic" TEXT,
    "home_address" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."saved_routes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "from_lat" DOUBLE PRECISION NOT NULL,
    "from_lng" DOUBLE PRECISION NOT NULL,
    "to_lat" DOUBLE PRECISION NOT NULL,
    "to_lng" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth"."reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo"."places" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "address" TEXT,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "open_hours" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "geo"."nearby_specialties" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "specialty_type" TEXT NOT NULL,
    "ai_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nearby_specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transit"."transit_routes" (
    "id" TEXT NOT NULL,
    "route_name" TEXT NOT NULL,
    "route_number" TEXT NOT NULL,
    "transit_type" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "origin_lat" DOUBLE PRECISION NOT NULL,
    "origin_lng" DOUBLE PRECISION NOT NULL,
    "destination_lat" DOUBLE PRECISION NOT NULL,
    "destination_lng" DOUBLE PRECISION NOT NULL,
    "base_fare" DOUBLE PRECISION NOT NULL,
    "first_departure" TEXT,
    "last_departure" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transit_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transit"."transit_stops" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "stop_name" TEXT NOT NULL,
    "stop_code" TEXT,
    "stop_order" INTEGER NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "arrival_time" TEXT,
    "departure_time" TEXT,
    "distance_from_prev_km" DOUBLE PRECISION,

    CONSTRAINT "transit_stops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transit"."trips" (
    "id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "vehicle_number" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "driver_name" TEXT,
    "driver_phone" TEXT,
    "departure_time" TEXT NOT NULL,
    "arrival_time" TEXT,
    "travel_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "total_seats" INTEGER NOT NULL,
    "available_seats" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transit"."live_tracking" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "current_stop_id" TEXT,
    "next_stop_id" TEXT,
    "current_lat" DOUBLE PRECISION NOT NULL,
    "current_lng" DOUBLE PRECISION NOT NULL,
    "delay_minutes" INTEGER NOT NULL DEFAULT 0,
    "speed_kmph" DOUBLE PRECISION,
    "bearing" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking"."bookings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "route_id" TEXT NOT NULL,
    "trip_id" TEXT,
    "boarding_stop_id" TEXT,
    "drop_stop_id" TEXT,
    "transit_type" TEXT NOT NULL,
    "seat_number" TEXT,
    "fare_paid" DOUBLE PRECISION NOT NULL,
    "travel_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "booked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "booking"."payments" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "transaction_id" TEXT,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "auth"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "auth"."users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_place_id_key" ON "auth"."reviews"("user_id", "place_id");

-- CreateIndex
CREATE UNIQUE INDEX "transit_routes_route_number_key" ON "transit"."transit_routes"("route_number");

-- CreateIndex
CREATE UNIQUE INDEX "transit_stops_route_id_stop_order_key" ON "transit"."transit_stops"("route_id", "stop_order");

-- CreateIndex
CREATE UNIQUE INDEX "live_tracking_trip_id_key" ON "transit"."live_tracking"("trip_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_booking_id_key" ON "booking"."payments"("booking_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_transaction_id_key" ON "booking"."payments"("transaction_id");

-- AddForeignKey
ALTER TABLE "auth"."saved_routes" ADD CONSTRAINT "saved_routes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth"."reviews" ADD CONSTRAINT "reviews_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "geo"."places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "geo"."nearby_specialties" ADD CONSTRAINT "nearby_specialties_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "geo"."places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transit"."transit_stops" ADD CONSTRAINT "transit_stops_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "transit"."transit_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transit"."trips" ADD CONSTRAINT "trips_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "transit"."transit_routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transit"."live_tracking" ADD CONSTRAINT "live_tracking_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "transit"."trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transit"."live_tracking" ADD CONSTRAINT "live_tracking_current_stop_id_fkey" FOREIGN KEY ("current_stop_id") REFERENCES "transit"."transit_stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transit"."live_tracking" ADD CONSTRAINT "live_tracking_next_stop_id_fkey" FOREIGN KEY ("next_stop_id") REFERENCES "transit"."transit_stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking"."bookings" ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking"."bookings" ADD CONSTRAINT "bookings_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "transit"."transit_routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking"."bookings" ADD CONSTRAINT "bookings_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "transit"."trips"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking"."bookings" ADD CONSTRAINT "bookings_boarding_stop_id_fkey" FOREIGN KEY ("boarding_stop_id") REFERENCES "transit"."transit_stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking"."bookings" ADD CONSTRAINT "bookings_drop_stop_id_fkey" FOREIGN KEY ("drop_stop_id") REFERENCES "transit"."transit_stops"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "booking"."payments" ADD CONSTRAINT "payments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "booking"."bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
