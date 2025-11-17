-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "totalCryptoReceived" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "email" TEXT,
ADD COLUMN     "phoneNumber" TEXT;
