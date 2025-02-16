-- AlterTable
ALTER TABLE "Popup" ADD COLUMN     "collectEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "discountCode" TEXT,
ADD COLUMN     "discountDuration" INTEGER,
ADD COLUMN     "discountType" TEXT,
ADD COLUMN     "discountValue" DOUBLE PRECISION,
ADD COLUMN     "emailPlaceholder" TEXT;
