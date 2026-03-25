-- AlterTable
ALTER TABLE "UserPuzzleHint" ADD COLUMN     "adRewardVerificationId" UUID;

-- CreateTable
CREATE TABLE "AdvertisementRewardType" (
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvertisementRewardType_pkey" PRIMARY KEY ("type")
);

-- CreateTable
CREATE TABLE "AdvertisementRewardVerification" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "uniqueKey" TEXT NOT NULL,
    "admobTransactionId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "puzzleId" UUID,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "AdvertisementRewardVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdvertisementRewardType_type_key" ON "AdvertisementRewardType"("type");

-- CreateIndex
CREATE UNIQUE INDEX "AdvertisementRewardVerification_uniqueKey_key" ON "AdvertisementRewardVerification"("uniqueKey");

-- CreateIndex
CREATE UNIQUE INDEX "AdvertisementRewardVerification_admobTransactionId_key" ON "AdvertisementRewardVerification"("admobTransactionId");

-- CreateIndex
CREATE INDEX "AdvertisementRewardVerification_type_idx" ON "AdvertisementRewardVerification"("type");

-- CreateIndex
CREATE INDEX "AdvertisementRewardVerification_userId_type_expiresAt_idx" ON "AdvertisementRewardVerification"("userId", "type", "expiresAt");

-- CreateIndex
CREATE INDEX "UserPuzzleHint_adRewardVerificationId_idx" ON "UserPuzzleHint"("adRewardVerificationId");

-- Seed AdvertisementRewardType
INSERT INTO "AdvertisementRewardType" ("type", "createdAt", "updatedAt")
VALUES ('PUZZLE_HINT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
