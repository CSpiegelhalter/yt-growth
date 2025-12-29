-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canceledAt" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "OwnedVideoAnalyticsDay" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "videoId" VARCHAR(32) NOT NULL,
    "date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "engagedViews" INTEGER,
    "comments" INTEGER,
    "likes" INTEGER,
    "shares" INTEGER,
    "estimatedMinutesWatched" INTEGER,
    "averageViewDuration" INTEGER,
    "averageViewPercentage" DOUBLE PRECISION,
    "subscribersGained" INTEGER,
    "subscribersLost" INTEGER,
    "videosAddedToPlaylists" INTEGER,
    "videosRemovedFromPlaylists" INTEGER,
    "estimatedRevenue" DOUBLE PRECISION,
    "estimatedAdRevenue" DOUBLE PRECISION,
    "grossRevenue" DOUBLE PRECISION,
    "monetizedPlaybacks" INTEGER,
    "playbackBasedCpm" DOUBLE PRECISION,
    "adImpressions" INTEGER,
    "cpm" DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnedVideoAnalyticsDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnedVideoInsightsCache" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "videoId" VARCHAR(32) NOT NULL,
    "range" VARCHAR(8) NOT NULL,
    "derivedJson" JSONB,
    "llmJson" JSONB,
    "cachedUntil" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnedVideoInsightsCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_owned_analytics_video_date" ON "OwnedVideoAnalyticsDay"("videoId", "date" DESC);

-- CreateIndex
CREATE INDEX "idx_owned_analytics_channel_date" ON "OwnedVideoAnalyticsDay"("channelId", "date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_owned_analytics_day" ON "OwnedVideoAnalyticsDay"("userId", "channelId", "videoId", "date");

-- CreateIndex
CREATE INDEX "idx_owned_insights_cached" ON "OwnedVideoInsightsCache"("cachedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "uq_owned_insights_cache" ON "OwnedVideoInsightsCache"("userId", "channelId", "videoId", "range");
