/*
  Warnings:

  - You are about to drop the column `created_at` on the `places` table. All the data in the column will be lost.
  - You are about to drop the column `open_hours` on the `places` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "geo"."places" DROP COLUMN "created_at",
DROP COLUMN "open_hours",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "openHours" TEXT;
