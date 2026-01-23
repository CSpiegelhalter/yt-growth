-- AlterTable
ALTER TABLE "CompetitorVideo" ADD COLUMN     "analysisContentHash" VARCHAR(32);

-- AlterTable
ALTER TABLE "CompetitorVideoComments" ADD COLUMN     "contentHash" VARCHAR(32);

-- AlterTable
ALTER TABLE "OwnedVideoInsightsCache" ADD COLUMN     "contentHash" VARCHAR(32);

-- CreateTable
CREATE TABLE "SubscriberAuditCache" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER NOT NULL,
    "range" VARCHAR(8) NOT NULL,
    "contentHash" VARCHAR(32) NOT NULL,
    "analysisJson" JSONB,
    "cachedUntil" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriberAuditCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_subscriber_audit_cached" ON "SubscriberAuditCache"("cachedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "uq_subscriber_audit_cache" ON "SubscriberAuditCache"("userId", "channelId", "range");
