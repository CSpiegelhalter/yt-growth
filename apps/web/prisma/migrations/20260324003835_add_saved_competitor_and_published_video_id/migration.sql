-- AlterTable
ALTER TABLE "VideoIdea" ADD COLUMN     "publishedVideoId" VARCHAR(32);

-- CreateTable
CREATE TABLE "SavedCompetitor" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "ytChannelId" VARCHAR(64) NOT NULL,
    "channelTitle" VARCHAR(255) NOT NULL,
    "thumbnailUrl" TEXT,
    "subscriberCount" INTEGER,
    "type" VARCHAR(16) NOT NULL DEFAULT 'competitor',
    "source" VARCHAR(16) NOT NULL DEFAULT 'auto',
    "matchReason" VARCHAR(255),
    "nicheOverlap" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastProcessedVideoId" VARCHAR(32),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedCompetitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_saved_competitor_user_channel_active" ON "SavedCompetitor"("userId", "channelId", "isActive");

-- CreateIndex
CREATE INDEX "idx_saved_competitor_yt_channel" ON "SavedCompetitor"("ytChannelId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_saved_competitor_user_channel_yt" ON "SavedCompetitor"("userId", "channelId", "ytChannelId");

-- AddForeignKey
ALTER TABLE "SavedCompetitor" ADD CONSTRAINT "SavedCompetitor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCompetitor" ADD CONSTRAINT "SavedCompetitor_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
