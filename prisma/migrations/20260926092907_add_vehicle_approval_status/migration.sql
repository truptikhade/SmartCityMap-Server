-- AlterTable
ALTER TABLE "auth"."vehicles" ADD COLUMN     "approval_status" TEXT NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "requested_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "vehicles_approval_status_idx" ON "auth"."vehicles"("approval_status");
