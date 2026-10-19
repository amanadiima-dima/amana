-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'DISPUTED';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "deliveryCode" TEXT,
ADD COLUMN     "disputeOutcome" TEXT,
ADD COLUMN     "disputeReason" TEXT,
ADD COLUMN     "disputedAt" TIMESTAMP(3);
