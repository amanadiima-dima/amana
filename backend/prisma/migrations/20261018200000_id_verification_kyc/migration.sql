-- AlterTable
ALTER TABLE "IdVerification" ADD COLUMN     "challengeCode" TEXT,
ADD COLUMN     "consentAt" TIMESTAMP(3),
ADD COLUMN     "documentType" TEXT NOT NULL DEFAULT 'ID_CARD',
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "providerRef" TEXT,
ADD COLUMN     "selfieVideo" TEXT,
ALTER COLUMN "backPhoto" DROP NOT NULL;

