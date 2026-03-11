-- CreateTable
CREATE TABLE "VideoIdea" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "summary" VARCHAR(150) NOT NULL,
    "title" VARCHAR(500),
    "script" TEXT,
    "description" TEXT,
    "tags" TEXT,
    "postDate" DATE,
    "status" VARCHAR(16) NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoIdea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_video_idea_user_channel_status" ON "VideoIdea"("userId", "channelId", "status");

-- CreateIndex
CREATE INDEX "idx_video_idea_user_created" ON "VideoIdea"("userId", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "VideoIdea" ADD CONSTRAINT "VideoIdea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoIdea" ADD CONSTRAINT "VideoIdea_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
