-- CreateTable
CREATE TABLE "SimilarChannelsCache" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "range" VARCHAR(8) NOT NULL,
    "channels" INTEGER NOT NULL,
    "responseJson" JSONB NOT NULL,
    "cachedUntil" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SimilarChannelsCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorFeedCache" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "range" VARCHAR(8) NOT NULL,
    "videosJson" JSONB NOT NULL,
    "cachedUntil" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompetitorFeedCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_similar_channels_cache_cached" ON "SimilarChannelsCache"("cachedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "uq_similar_channels_cache" ON "SimilarChannelsCache"("userId", "channelId", "range", "channels");

-- CreateIndex
CREATE INDEX "idx_competitor_feed_cache_cached" ON "CompetitorFeedCache"("cachedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "uq_competitor_feed_cache" ON "CompetitorFeedCache"("userId", "channelId", "range");


