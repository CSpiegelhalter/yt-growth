-- CreateTable
CREATE TABLE "ChannelNiche" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "channelId" INTEGER NOT NULL,
    "niche" VARCHAR(255) NOT NULL,
    "queriesJson" JSONB NOT NULL,
    "videoTitlesHash" VARCHAR(64) NOT NULL,
    "generatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cachedUntil" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelNiche_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChannelNiche_channelId_key" ON "ChannelNiche"("channelId");

-- CreateIndex
CREATE INDEX "idx_channel_niche_cached" ON "ChannelNiche"("cachedUntil");

-- AddForeignKey
ALTER TABLE "ChannelNiche" ADD CONSTRAINT "ChannelNiche_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
