/*
  Warnings:

  - A unique constraint covering the columns `[userId,deviceId,providerMeasurementId]` on the table `BodyScan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "BodyScan" ADD COLUMN     "bmi" DOUBLE PRECISION,
ADD COLUMN     "bodyWaterPercent" DOUBLE PRECISION,
ADD COLUMN     "deviceId" TEXT,
ADD COLUMN     "fatMassKg" DOUBLE PRECISION,
ADD COLUMN     "muscleMassKg" DOUBLE PRECISION,
ADD COLUMN     "providerMeasurementId" TEXT;

-- CreateTable
CREATE TABLE "ScaleDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "colourway" TEXT NOT NULL DEFAULT 'black',
    "firmware" TEXT,
    "batteryPercent" INTEGER,
    "capabilities" TEXT NOT NULL DEFAULT '[]',
    "pairedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncAt" TIMESTAMP(3),
    "disconnectedAt" TIMESTAMP(3),

    CONSTRAINT "ScaleDevice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScaleDevice_userId_disconnectedAt_idx" ON "ScaleDevice"("userId", "disconnectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScaleDevice_provider_externalId_key" ON "ScaleDevice"("provider", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "BodyScan_userId_deviceId_providerMeasurementId_key" ON "BodyScan"("userId", "deviceId", "providerMeasurementId");

-- AddForeignKey
ALTER TABLE "ScaleDevice" ADD CONSTRAINT "ScaleDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
