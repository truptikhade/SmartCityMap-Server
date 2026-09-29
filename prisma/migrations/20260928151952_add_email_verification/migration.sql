-- AlterTable
ALTER TABLE "auth"."users" ADD COLUMN     "email_verification_expires" TIMESTAMP(3),
ADD COLUMN     "email_verification_token" TEXT;
