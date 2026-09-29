/*
  Warnings:

  - Added the required column `vehicleType` to the `ride_requests` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "booking"."ride_requests" ADD COLUMN     "vehicleType" TEXT NOT NULL;
