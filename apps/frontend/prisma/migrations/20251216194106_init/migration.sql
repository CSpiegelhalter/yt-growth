-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "passwordHash" VARCHAR(255),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "stripeCustomerId" VARCHAR(255),
    "stripeSubscriptionId" VARCHAR(255),
    "status" VARCHAR(32) NOT NULL DEFAULT 'inactive',
    "plan" VARCHAR(32) NOT NULL DEFAULT 'free',
    "currentPeriodEnd" TIMESTAMPTZ(6),
    "channelLimit" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GoogleAccount" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "provider" VARCHAR(50) NOT NULL DEFAULT 'google',
    "providerAccountId" VARCHAR(255) NOT NULL,
    "refreshTokenEnc" TEXT,
    "scopes" TEXT,
    "tokenExpiresAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "youtubeChannelId" VARCHAR(128) NOT NULL,
    "title" VARCHAR(255),
    "thumbnailUrl" TEXT,
    "connectedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMPTZ(6),
    "syncStatus" VARCHAR(32) NOT NULL DEFAULT 'idle',
    "syncError" TEXT,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" SERIAL NOT NULL,
    "channelId" INTEGER NOT NULL,
    "youtubeVideoId" VARCHAR(128) NOT NULL,
    "title" VARCHAR(512),
    "description" TEXT,
    "publishedAt" TIMESTAMPTZ(6),
    "durationSec" INTEGER,
    "tags" TEXT,
    "thumbnailUrl" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoMetrics" (
    "id" SERIAL NOT NULL,
    "videoId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "subscribersGained" INTEGER NOT NULL DEFAULT 0,
    "subscribersLost" INTEGER NOT NULL DEFAULT 0,
    "estimatedMinutesWatched" INTEGER NOT NULL DEFAULT 0,
    "averageViewDuration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "averageViewPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fetchedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cachedUntil" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "VideoMetrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RetentionBlob" (
    "id" SERIAL NOT NULL,
    "videoId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "dataJson" TEXT NOT NULL,
    "cliffTimeSec" INTEGER,
    "cliffReason" VARCHAR(32),
    "cliffSlope" DOUBLE PRECISION,
    "fetchedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cachedUntil" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "RetentionBlob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "inputsJson" TEXT NOT NULL,
    "outputMarkdown" TEXT NOT NULL,
    "modelVersion" VARCHAR(64),
    "tokensUsed" INTEGER,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cachedUntil" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OAuthState" (
    "id" SERIAL NOT NULL,
    "state" VARCHAR(128) NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "OAuthState_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_email" ON "User"("email");

-- CreateIndex
CREATE INDEX "idx_user_email" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "idx_subscription_stripe_customer" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "idx_subscription_stripe_sub" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_google_provider_account" ON "GoogleAccount"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "idx_channel_user" ON "Channel"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_channel_owner_youtube" ON "Channel"("userId", "youtubeChannelId");

-- CreateIndex
CREATE INDEX "idx_video_channel" ON "Video"("channelId");

-- CreateIndex
CREATE INDEX "idx_video_published" ON "Video"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "uq_video_channel_youtube" ON "Video"("channelId", "youtubeVideoId");

-- CreateIndex
CREATE UNIQUE INDEX "VideoMetrics_videoId_key" ON "VideoMetrics"("videoId");

-- CreateIndex
CREATE INDEX "idx_video_metrics_channel" ON "VideoMetrics"("channelId");

-- CreateIndex
CREATE INDEX "idx_video_metrics_cached" ON "VideoMetrics"("cachedUntil");

-- CreateIndex
CREATE INDEX "idx_retention_channel" ON "RetentionBlob"("channelId");

-- CreateIndex
CREATE INDEX "idx_retention_cached" ON "RetentionBlob"("cachedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "uq_retention_video" ON "RetentionBlob"("videoId");

-- CreateIndex
CREATE INDEX "idx_plan_user" ON "Plan"("userId");

-- CreateIndex
CREATE INDEX "idx_plan_channel" ON "Plan"("channelId");

-- CreateIndex
CREATE INDEX "idx_plan_created" ON "Plan"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "uq_oauthstate_state" ON "OAuthState"("state");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoogleAccount" ADD CONSTRAINT "fk_google_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "fk_channel_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "fk_video_channel" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "VideoMetrics" ADD CONSTRAINT "VideoMetrics_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoMetrics" ADD CONSTRAINT "VideoMetrics_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionBlob" ADD CONSTRAINT "RetentionBlob_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RetentionBlob" ADD CONSTRAINT "RetentionBlob_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OAuthState" ADD CONSTRAINT "fk_oauthstate_user" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
