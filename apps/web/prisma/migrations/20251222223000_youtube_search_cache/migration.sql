-- CreateTable
CREATE TABLE "YouTubeSearchCache" (
    "id" UUID NOT NULL,
    "kind" VARCHAR(16) NOT NULL,
    "query" TEXT NOT NULL,
    "responseJson" JSONB NOT NULL,
    "cachedUntil" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "YouTubeSearchCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_youtube_search_cache" ON "YouTubeSearchCache"("kind", "query");

-- CreateIndex
CREATE INDEX "idx_youtube_search_cache_cached" ON "YouTubeSearchCache"("cachedUntil");


