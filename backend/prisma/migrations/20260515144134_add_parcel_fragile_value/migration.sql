-- AlterTable
ALTER TABLE "ParcelRequest" ADD COLUMN     "estimatedValue" DOUBLE PRECISION,
ADD COLUMN     "fragile" BOOLEAN NOT NULL DEFAULT false;
