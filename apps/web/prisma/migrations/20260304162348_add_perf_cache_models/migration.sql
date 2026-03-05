/*
  Warnings:

  - You are about to drop the `LegacyThumbnailJob` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LegacyThumbnailVariant` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `channel_profiles_lite` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `discovered_videos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ingestion_state` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `niche_cluster_videos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `niche_clusters` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `video_embeddings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `video_scores` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `video_stat_snapshots` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LegacyThumbnailVariant" DROP CONSTRAINT "LegacyThumbnailVariant_jobId_fkey";

-- DropForeignKey
ALTER TABLE "niche_cluster_videos" DROP CONSTRAINT "fk_cluster_videos_cluster";

-- DropForeignKey
ALTER TABLE "niche_cluster_videos" DROP CONSTRAINT "fk_cluster_videos_video";

-- DropForeignKey
ALTER TABLE "video_embeddings" DROP CONSTRAINT "fk_embeddings_video";

-- DropForeignKey
ALTER TABLE "video_scores" DROP CONSTRAINT "fk_scores_video";

-- DropForeignKey
ALTER TABLE "video_stat_snapshots" DROP CONSTRAINT "fk_snapshots_video";

-- AlterTable
ALTER TABLE "KeywordCache" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "provider" SET DEFAULT 'dataforseo';

-- DropTable
DROP TABLE "LegacyThumbnailJob";

-- DropTable
DROP TABLE "LegacyThumbnailVariant";

-- DropTable
DROP TABLE "channel_profiles_lite";

-- DropTable
DROP TABLE "discovered_videos";

-- DropTable
DROP TABLE "ingestion_state";

-- DropTable
DROP TABLE "niche_cluster_videos";

-- DropTable
DROP TABLE "niche_clusters";

-- DropTable
DROP TABLE "video_embeddings";

-- DropTable
DROP TABLE "video_scores";

-- DropTable
DROP TABLE "video_stat_snapshots";

-- CreateTable
CREATE TABLE "TranscriptCache" (
    "id" UUID NOT NULL,
    "videoId" VARCHAR(32) NOT NULL,
    "rawSegments" JSONB NOT NULL,
    "fullText" TEXT NOT NULL,
    "transcriptHash" VARCHAR(64) NOT NULL,
    "analysisJson" JSONB,
    "analysisHash" VARCHAR(64),
    "fetchedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranscriptCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FullReportSectionCache" (
    "id" UUID NOT NULL,
    "videoId" VARCHAR(32) NOT NULL,
    "sectionKey" VARCHAR(32) NOT NULL,
    "contentHash" VARCHAR(64) NOT NULL,
    "sectionData" JSONB NOT NULL,
    "cachedUntil" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FullReportSectionCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportGenerationLock" (
    "id" UUID NOT NULL,
    "videoId" VARCHAR(32) NOT NULL,
    "startedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ReportGenerationLock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TranscriptCache_videoId_key" ON "TranscriptCache"("videoId");

-- CreateIndex
CREATE INDEX "idx_transcript_cache_expires" ON "TranscriptCache"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_report_section_cache_cached" ON "FullReportSectionCache"("cachedUntil");

-- CreateIndex
CREATE INDEX "idx_report_section_cache_video" ON "FullReportSectionCache"("videoId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_report_section_cache" ON "FullReportSectionCache"("videoId", "sectionKey");

-- CreateIndex
CREATE UNIQUE INDEX "ReportGenerationLock_videoId_key" ON "ReportGenerationLock"("videoId");
