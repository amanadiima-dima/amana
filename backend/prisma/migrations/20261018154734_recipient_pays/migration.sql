-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'PAYMENT_PENDING';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "payDeadline" TIMESTAMP(3),
ADD COLUMN     "payerId" TEXT,
ADD COLUMN     "respondDeadline" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
