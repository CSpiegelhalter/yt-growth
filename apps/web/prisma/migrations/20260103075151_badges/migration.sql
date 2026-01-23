/*
  Warnings:

  - You are about to drop the `UserAchievement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserDefaultGoalCompletion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserGoal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserGoalCompletion` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserRewards` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ChannelProfile" DROP CONSTRAINT "fk_channel_profile_channel";

-- DropForeignKey
ALTER TABLE "UserGoalCompletion" DROP CONSTRAINT "UserGoalCompletion_goalId_fkey";

-- AlterTable
ALTER TABLE "ChannelProfile" ALTER COLUMN "id" DROP DEFAULT;

-- DropTable
DROP TABLE "UserAchievement";

-- DropTable
DROP TABLE "UserDefaultGoalCompletion";

-- DropTable
DROP TABLE "UserGoal";

-- DropTable
DROP TABLE "UserGoalCompletion";

-- DropTable
DROP TABLE "UserRewards";

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER,
    "badgeId" VARCHAR(64) NOT NULL,
    "unlockedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seen" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserBadge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThumbnailJob" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER,
    "inputJson" TEXT NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'queued',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "phase" VARCHAR(64),
    "error" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThumbnailJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThumbnailAsset" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "mime" VARCHAR(64) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sizeBytes" INTEGER,
    "storageKey" VARCHAR(512) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThumbnailAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThumbnailVariant" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "planJson" TEXT NOT NULL,
    "specJson" TEXT NOT NULL,
    "baseImageKey" VARCHAR(512),
    "finalImageKey" VARCHAR(512),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThumbnailVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_user_badge_user" ON "UserBadge"("userId");

-- CreateIndex
CREATE INDEX "idx_user_badge_channel" ON "UserBadge"("channelId");

-- CreateIndex
CREATE INDEX "idx_user_badge_unlocked" ON "UserBadge"("unlockedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_badge" ON "UserBadge"("userId", "channelId", "badgeId");

-- CreateIndex
CREATE INDEX "idx_thumbnail_job_user" ON "ThumbnailJob"("userId");

-- CreateIndex
CREATE INDEX "idx_thumbnail_job_channel" ON "ThumbnailJob"("channelId");

-- CreateIndex
CREATE INDEX "idx_thumbnail_job_status" ON "ThumbnailJob"("status");

-- CreateIndex
CREATE INDEX "idx_thumbnail_job_created" ON "ThumbnailJob"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_thumbnail_asset_user" ON "ThumbnailAsset"("userId");

-- CreateIndex
CREATE INDEX "idx_thumbnail_asset_created" ON "ThumbnailAsset"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "idx_thumbnail_variant_job" ON "ThumbnailVariant"("jobId");

-- CreateIndex
CREATE INDEX "idx_thumbnail_variant_created" ON "ThumbnailVariant"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "ChannelProfile" ADD CONSTRAINT "fk_channel_profile_channel" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThumbnailVariant" ADD CONSTRAINT "ThumbnailVariant_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ThumbnailJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "uq_channel_profile" RENAME TO "ChannelProfile_channelId_key";
