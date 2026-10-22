-- AlterTable
ALTER TABLE "IdVerification" ADD COLUMN     "reviewedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "archivedName" TEXT,
ADD COLUMN     "archivedPhone" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "legalHoldAt" TIMESTAMP(3),
ADD COLUMN     "legalHoldNote" TEXT,
ADD COLUMN     "retainUntil" TIMESTAMP(3),
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);


-- Existing reviewed verifications: start their retention clock at the last update.
UPDATE "IdVerification" SET "reviewedAt" = "updatedAt" WHERE "status" <> 'PENDING' AND "reviewedAt" IS NULL;
