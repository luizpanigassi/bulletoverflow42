-- AlterTable
ALTER TABLE "users" ADD COLUMN     "twoFactorCode" TEXT,
ADD COLUMN     "twoFactorCodeExpiresAt" TIMESTAMP(3);
