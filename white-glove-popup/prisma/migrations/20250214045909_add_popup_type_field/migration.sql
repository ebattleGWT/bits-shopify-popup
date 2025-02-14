-- AlterTable
ALTER TABLE "Popup" ADD COLUMN     "backgroundColor" TEXT,
ADD COLUMN     "borderRadius" TEXT,
ADD COLUMN     "buttonColor" TEXT,
ADD COLUMN     "buttonText" TEXT,
ADD COLUMN     "buttonTextColor" TEXT,
ADD COLUMN     "cookieExpiration" INTEGER,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "exitIntentEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "fontFamily" TEXT,
ADD COLUMN     "fontSize" TEXT,
ADD COLUMN     "formFields" TEXT,
ADD COLUMN     "height" TEXT,
ADD COLUMN     "image" TEXT,
ADD COLUMN     "overlayColor" TEXT,
ADD COLUMN     "overlayOpacity" DOUBLE PRECISION,
ADD COLUMN     "popupType" TEXT NOT NULL DEFAULT 'STANDARD',
ADD COLUMN     "scrollTriggerEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scrollTriggerPercentage" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "secondaryButtonText" TEXT,
ADD COLUMN     "submitEndpoint" TEXT,
ADD COLUMN     "successMessage" TEXT,
ADD COLUMN     "template" TEXT,
ADD COLUMN     "textColor" TEXT,
ADD COLUMN     "width" TEXT;

-- CreateTable
CREATE TABLE "PopupEvent" (
    "id" TEXT NOT NULL,
    "popupId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceType" TEXT,
    "country" TEXT,
    "page" TEXT,
    "metadata" TEXT,
    "sessionId" TEXT,
    "shop" TEXT NOT NULL,

    CONSTRAINT "PopupEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PopupMetrics" (
    "id" TEXT NOT NULL,
    "popupId" TEXT NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "closeCount" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "shop" TEXT NOT NULL,
    "avgTimeToClick" DOUBLE PRECISION,
    "avgTimeToClose" DOUBLE PRECISION,
    "bounceRate" DOUBLE PRECISION,
    "deviceBreakdown" TEXT,
    "countryBreakdown" TEXT,
    "pageBreakdown" TEXT,

    CONSTRAINT "PopupMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PopupEvent_popupId_eventType_idx" ON "PopupEvent"("popupId", "eventType");

-- CreateIndex
CREATE INDEX "PopupEvent_createdAt_idx" ON "PopupEvent"("createdAt");

-- CreateIndex
CREATE INDEX "PopupEvent_shop_idx" ON "PopupEvent"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "PopupMetrics_popupId_key" ON "PopupMetrics"("popupId");

-- CreateIndex
CREATE INDEX "PopupMetrics_shop_idx" ON "PopupMetrics"("shop");

-- AddForeignKey
ALTER TABLE "PopupEvent" ADD CONSTRAINT "PopupEvent_popupId_fkey" FOREIGN KEY ("popupId") REFERENCES "Popup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PopupMetrics" ADD CONSTRAINT "PopupMetrics_popupId_fkey" FOREIGN KEY ("popupId") REFERENCES "Popup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
