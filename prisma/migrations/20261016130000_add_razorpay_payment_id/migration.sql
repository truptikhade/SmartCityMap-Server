ALTER TABLE "booking"."payments"
ADD COLUMN "razorpay_payment_id" TEXT;

CREATE UNIQUE INDEX "payments_razorpay_payment_id_key"
ON "booking"."payments"("razorpay_payment_id");
