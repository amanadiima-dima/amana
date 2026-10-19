-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "inviteToken" TEXT,
ADD COLUMN     "payerPhone" TEXT;

-- CreateTable
CREATE TABLE "OutboundMessage" (
    "id" TEXT NOT NULL,
    "toPhone" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboundMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutboundMessage_bookingId_idx" ON "OutboundMessage"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_inviteToken_key" ON "Booking"("inviteToken");

