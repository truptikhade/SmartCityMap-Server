ALTER TABLE "booking"."bookings"
ADD COLUMN "idempotency_key" TEXT;

CREATE UNIQUE INDEX "bookings_idempotency_key_key"
ON "booking"."bookings"("idempotency_key");

CREATE UNIQUE INDEX "bookings_active_train_seat_unique_idx"
ON "booking"."bookings"("trip_id", "seat_number")
WHERE "transit_type" = 'train'
  AND "trip_id" IS NOT NULL
  AND "seat_number" IS NOT NULL
  AND "status" <> 'cancelled';
