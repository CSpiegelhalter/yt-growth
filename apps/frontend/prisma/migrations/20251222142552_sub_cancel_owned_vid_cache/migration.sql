-- CreateTable
CREATE TABLE "OwnedVideoRemixCache" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "videoId" VARCHAR(32) NOT NULL,
    "range" VARCHAR(8) NOT NULL,
    "seedHash" VARCHAR(128) NOT NULL,
    "remixJson" JSONB,
    "cachedUntil" TIMESTAMPTZ(6) NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnedVideoRemixCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_owned_remix_cache_cached" ON "OwnedVideoRemixCache"("cachedUntil");

-- CreateIndex
CREATE INDEX "idx_owned_remix_cache_video" ON "OwnedVideoRemixCache"("userId", "channelId", "videoId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_owned_remix_cache" ON "OwnedVideoRemixCache"("userId", "channelId", "videoId", "range", "seedHash");
