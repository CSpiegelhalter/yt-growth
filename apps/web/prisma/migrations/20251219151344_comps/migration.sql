-- CreateTable
CREATE TABLE "CompetitorVideo" (
    "id" UUID NOT NULL,
    "videoId" VARCHAR(32) NOT NULL,
    "channelId" VARCHAR(64) NOT NULL,
    "channelTitle" VARCHAR(255) NOT NULL,
    "title" VARCHAR(512) NOT NULL,
    "description" TEXT,
    "publishedAt" TIMESTAMPTZ(6) NOT NULL,
    "durationSec" INTEGER,
    "thumbnailUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "categoryId" VARCHAR(32),
    "topicDetails" JSONB,
    "lastFetchedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitorVideo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorVideoSnapshot" (
    "id" UUID NOT NULL,
    "videoId" VARCHAR(32) NOT NULL,
    "capturedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewCount" INTEGER NOT NULL,
    "likeCount" INTEGER,
    "commentCount" INTEGER,

    CONSTRAINT "CompetitorVideoSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitorVideoComments" (
    "id" UUID NOT NULL,
    "videoId" VARCHAR(32) NOT NULL,
    "capturedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "topCommentsJson" JSONB,
    "analysisJson" JSONB,
    "sentimentPos" DOUBLE PRECISION,
    "sentimentNeu" DOUBLE PRECISION,
    "sentimentNeg" DOUBLE PRECISION,
    "themesJson" JSONB,

    CONSTRAINT "CompetitorVideoComments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompetitorVideo_videoId_key" ON "CompetitorVideo"("videoId");

-- CreateIndex
CREATE INDEX "idx_competitor_video_channel" ON "CompetitorVideo"("channelId");

-- CreateIndex
CREATE INDEX "idx_competitor_video_published" ON "CompetitorVideo"("publishedAt");

-- CreateIndex
CREATE INDEX "idx_competitor_video_last_fetched" ON "CompetitorVideo"("lastFetchedAt");

-- CreateIndex
CREATE INDEX "idx_competitor_snapshot_video_time" ON "CompetitorVideoSnapshot"("videoId", "capturedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_competitor_snapshot_captured" ON "CompetitorVideoSnapshot"("capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitorVideoComments_videoId_key" ON "CompetitorVideoComments"("videoId");

-- CreateIndex
CREATE INDEX "idx_competitor_comments_captured" ON "CompetitorVideoComments"("capturedAt");

-- AddForeignKey
ALTER TABLE "CompetitorVideoSnapshot" ADD CONSTRAINT "CompetitorVideoSnapshot_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "CompetitorVideo"("videoId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitorVideoComments" ADD CONSTRAINT "CompetitorVideoComments_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "CompetitorVideo"("videoId") ON DELETE CASCADE ON UPDATE CASCADE;
