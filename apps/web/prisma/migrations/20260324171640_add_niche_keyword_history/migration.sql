-- CreateTable
CREATE TABLE "NicheKeywordHistory" (
    "id" UUID NOT NULL,
    "channelId" INTEGER NOT NULL,
    "keyword" VARCHAR(255) NOT NULL,
    "searchVolume" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "trendDirection" VARCHAR(16) NOT NULL,
    "capturedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NicheKeywordHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_niche_kw_history_channel_kw" ON "NicheKeywordHistory"("channelId", "keyword", "capturedAt" DESC);

-- CreateIndex
CREATE INDEX "idx_niche_kw_history_captured" ON "NicheKeywordHistory"("capturedAt");

-- AddForeignKey
ALTER TABLE "NicheKeywordHistory" ADD CONSTRAINT "NicheKeywordHistory_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
