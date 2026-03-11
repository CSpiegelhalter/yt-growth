-- CreateTable
CREATE TABLE "VideoSuggestion" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "description" TEXT NOT NULL,
    "sourceContext" JSONB NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'active',
    "generatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_video_suggestion_user_channel_status" ON "VideoSuggestion"("userId", "channelId", "status");

-- CreateIndex
CREATE INDEX "idx_video_suggestion_user_generated" ON "VideoSuggestion"("userId", "generatedAt" DESC);

-- AddForeignKey
ALTER TABLE "VideoSuggestion" ADD CONSTRAINT "VideoSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoSuggestion" ADD CONSTRAINT "VideoSuggestion_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
