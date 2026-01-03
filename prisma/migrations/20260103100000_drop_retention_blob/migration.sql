-- DropForeignKey
ALTER TABLE "RetentionBlob" DROP CONSTRAINT "RetentionBlob_channelId_fkey";

-- DropForeignKey
ALTER TABLE "RetentionBlob" DROP CONSTRAINT "RetentionBlob_videoId_fkey";

-- DropIndex
DROP INDEX "idx_retention_cached";

-- DropIndex
DROP INDEX "idx_retention_channel";

-- DropIndex
DROP INDEX "uq_retention_video";

-- DropTable
DROP TABLE "RetentionBlob";
