-- Thumbnail V2 Enhancements
-- 
-- 1. Add datasetHash and needsRetrain to UserModel for auto-invalidation and coalescing
-- 2. Add source, parentJobId, inputImageUrl to ThumbnailJob for img2img support
-- 3. Add 'none' and 'deleting' states to UserModelStatus
-- 4. Drop legacy thumbnail tables (ThumbnailJob, ThumbnailVariant, LegacyThumbnailAsset)

-- Add new enum values to UserModelStatus
ALTER TYPE "UserModelStatus" ADD VALUE IF NOT EXISTS 'none';
ALTER TYPE "UserModelStatus" ADD VALUE IF NOT EXISTS 'deleting';

-- Create new enum for thumbnail source
CREATE TYPE "ThumbnailSourceV2" AS ENUM ('txt2img', 'img2img');

-- Add new columns to UserModel
ALTER TABLE "UserModel" ADD COLUMN IF NOT EXISTS "datasetHash" VARCHAR(64);
ALTER TABLE "UserModel" ADD COLUMN IF NOT EXISTS "needsRetrain" BOOLEAN NOT NULL DEFAULT false;

-- Add new columns to ThumbnailJobV2
ALTER TABLE "ThumbnailJobV2" ADD COLUMN IF NOT EXISTS "source" "ThumbnailSourceV2" NOT NULL DEFAULT 'txt2img';
ALTER TABLE "ThumbnailJobV2" ADD COLUMN IF NOT EXISTS "parentJobId" UUID;
ALTER TABLE "ThumbnailJobV2" ADD COLUMN IF NOT EXISTS "inputImageUrl" TEXT;

-- Add self-referential foreign key for variant chaining
ALTER TABLE "ThumbnailJobV2" 
  ADD CONSTRAINT "ThumbnailJobV2_parentJobId_fkey" 
  FOREIGN KEY ("parentJobId") 
  REFERENCES "ThumbnailJobV2"("id") 
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for parent job lookups
CREATE INDEX IF NOT EXISTS "idx_thumbnail_job_v2_parent" ON "ThumbnailJobV2"("parentJobId");

-- Drop legacy tables (cascade removes constraints)
DROP TABLE IF EXISTS "ThumbnailVariant" CASCADE;
DROP TABLE IF EXISTS "ThumbnailJob" CASCADE;
DROP TABLE IF EXISTS "LegacyThumbnailAsset" CASCADE;
