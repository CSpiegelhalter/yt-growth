/*
  Thumbnail Workflow V2

  - Preserve legacy concept-based thumbnail generator tables by renaming:
    ThumbnailJob -> LegacyThumbnailJob
    ThumbnailVariant -> LegacyThumbnailVariant
    ThumbnailAsset -> LegacyThumbnailAsset

  - Add new identity + workflow tables:
    UserModel, UserTrainingAsset, ThumbnailJobV2, ThumbnailProject, ReplicateWebhookEvent
    
  Note: The new ThumbnailJob table is named ThumbnailJobV2 in the DB to avoid conflicts,
  but Prisma maps it to "ThumbnailJob" in the schema.
*/

-- ============================================
-- Rename legacy thumbnail generator tables (if they exist)
-- ============================================

DO $$
BEGIN
  -- Check if old ThumbnailJob exists and hasn't been renamed yet
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ThumbnailJob') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'LegacyThumbnailJob') THEN
    
    -- Check if ThumbnailVariant exists (full legacy schema)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ThumbnailVariant') THEN
      ALTER TABLE "ThumbnailVariant" DROP CONSTRAINT IF EXISTS "ThumbnailVariant_jobId_fkey";
      ALTER TABLE "ThumbnailVariant" RENAME TO "LegacyThumbnailVariant";
    END IF;
    
    -- Rename ThumbnailJob to Legacy
    ALTER TABLE "ThumbnailJob" RENAME TO "LegacyThumbnailJob";
    
    -- Check if ThumbnailAsset exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ThumbnailAsset') THEN
      ALTER TABLE "ThumbnailAsset" RENAME TO "LegacyThumbnailAsset";
    END IF;
    
    -- Rename indexes (best effort)
    ALTER INDEX IF EXISTS "idx_thumbnail_job_user" RENAME TO "idx_legacy_thumbnail_job_user";
    ALTER INDEX IF EXISTS "idx_thumbnail_job_channel" RENAME TO "idx_legacy_thumbnail_job_channel";
    ALTER INDEX IF EXISTS "idx_thumbnail_job_status" RENAME TO "idx_legacy_thumbnail_job_status";
    ALTER INDEX IF EXISTS "idx_thumbnail_job_created" RENAME TO "idx_legacy_thumbnail_job_created";
    ALTER INDEX IF EXISTS "idx_thumbnail_asset_user" RENAME TO "idx_legacy_thumbnail_asset_user";
    ALTER INDEX IF EXISTS "idx_thumbnail_asset_created" RENAME TO "idx_legacy_thumbnail_asset_created";
    ALTER INDEX IF EXISTS "idx_thumbnail_variant_job" RENAME TO "idx_legacy_thumbnail_variant_job";
    ALTER INDEX IF EXISTS "idx_thumbnail_variant_created" RENAME TO "idx_legacy_thumbnail_variant_created";
    
    -- Re-add FK if both legacy tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'LegacyThumbnailVariant') THEN
      ALTER TABLE "LegacyThumbnailVariant"
        ADD CONSTRAINT "LegacyThumbnailVariant_jobId_fkey"
        FOREIGN KEY ("jobId") REFERENCES "LegacyThumbnailJob"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;

-- ============================================
-- Enums for v2 workflow
-- ============================================

DO $$ BEGIN
  CREATE TYPE "UserModelStatus" AS ENUM ('pending', 'training', 'ready', 'failed', 'canceled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ThumbnailStyleV2" AS ENUM ('compare', 'subject', 'object', 'hold');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ThumbnailJobStatusV2" AS ENUM ('queued', 'running', 'succeeded', 'failed', 'canceled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- New tables (all wrapped in conditional blocks)
-- ============================================

-- UserModel
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'UserModel') THEN
    CREATE TABLE "UserModel" (
      "id" UUID NOT NULL,
      "userId" INTEGER NOT NULL,
      "replicateModelOwner" VARCHAR(128) NOT NULL,
      "replicateModelName" VARCHAR(255) NOT NULL,
      "replicateModelVersion" VARCHAR(128),
      "triggerWord" VARCHAR(16) NOT NULL,
      "status" "UserModelStatus" NOT NULL DEFAULT 'pending',
      "trainingId" VARCHAR(128),
      "trainingStartedAt" TIMESTAMPTZ(6),
      "trainingCompletedAt" TIMESTAMPTZ(6),
      "errorMessage" TEXT,
      "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UserModel_pkey" PRIMARY KEY ("id")
    );
    CREATE UNIQUE INDEX "UserModel_userId_key" ON "UserModel"("userId");
    CREATE INDEX "idx_user_model_user_status" ON "UserModel"("userId", "status");
    ALTER TABLE "UserModel"
      ADD CONSTRAINT "UserModel_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- UserTrainingAsset
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'UserTrainingAsset') THEN
    CREATE TABLE "UserTrainingAsset" (
      "id" UUID NOT NULL,
      "userId" INTEGER NOT NULL,
      "identityModelId" UUID,
      "s3KeyOriginal" VARCHAR(512) NOT NULL,
      "s3KeyNormalized" VARCHAR(512),
      "width" INTEGER NOT NULL,
      "height" INTEGER NOT NULL,
      "sha256" VARCHAR(64) NOT NULL,
      "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UserTrainingAsset_pkey" PRIMARY KEY ("id")
    );
    CREATE INDEX "idx_user_training_asset_user" ON "UserTrainingAsset"("userId");
    CREATE INDEX "idx_user_training_asset_model" ON "UserTrainingAsset"("identityModelId");
    CREATE UNIQUE INDEX "uq_user_training_asset_user_sha" ON "UserTrainingAsset"("userId", "sha256");
    ALTER TABLE "UserTrainingAsset"
      ADD CONSTRAINT "UserTrainingAsset_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    ALTER TABLE "UserTrainingAsset"
      ADD CONSTRAINT "UserTrainingAsset_identityModelId_fkey"
      FOREIGN KEY ("identityModelId") REFERENCES "UserModel"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- ThumbnailJobV2 (mapped to ThumbnailJob in Prisma via @@map)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ThumbnailJobV2') THEN
    CREATE TABLE "ThumbnailJobV2" (
      "id" UUID NOT NULL,
      "userId" INTEGER NOT NULL,
      "style" "ThumbnailStyleV2" NOT NULL,
      "styleModelVersionId" VARCHAR(128) NOT NULL,
      "identityModelVersionId" VARCHAR(128),
      "userPrompt" TEXT NOT NULL,
      "llmPrompt" TEXT NOT NULL,
      "negativePrompt" TEXT,
      "replicatePredictionId" VARCHAR(128),
      "status" "ThumbnailJobStatusV2" NOT NULL DEFAULT 'queued',
      "outputImages" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ThumbnailJobV2_pkey" PRIMARY KEY ("id")
    );
    CREATE INDEX "idx_thumbnail_job_v2_user_created" ON "ThumbnailJobV2"("userId", "createdAt" DESC);
    CREATE INDEX "idx_thumbnail_job_v2_user_status" ON "ThumbnailJobV2"("userId", "status");
    ALTER TABLE "ThumbnailJobV2"
      ADD CONSTRAINT "ThumbnailJobV2_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ThumbnailProject
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ThumbnailProject') THEN
    CREATE TABLE "ThumbnailProject" (
      "id" UUID NOT NULL,
      "userId" INTEGER NOT NULL,
      "thumbnailJobId" UUID NOT NULL,
      "baseImageUrl" TEXT NOT NULL,
      "editorState" JSONB NOT NULL,
      "exports" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ThumbnailProject_pkey" PRIMARY KEY ("id")
    );
    CREATE INDEX "idx_thumbnail_project_user_created" ON "ThumbnailProject"("userId", "createdAt" DESC);
    CREATE INDEX "idx_thumbnail_project_job" ON "ThumbnailProject"("thumbnailJobId");
    ALTER TABLE "ThumbnailProject"
      ADD CONSTRAINT "ThumbnailProject_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    ALTER TABLE "ThumbnailProject"
      ADD CONSTRAINT "ThumbnailProject_thumbnailJobId_fkey"
      FOREIGN KEY ("thumbnailJobId") REFERENCES "ThumbnailJobV2"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- ReplicateWebhookEvent
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ReplicateWebhookEvent') THEN
    CREATE TABLE "ReplicateWebhookEvent" (
      "id" VARCHAR(255) NOT NULL,
      "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ReplicateWebhookEvent_pkey" PRIMARY KEY ("id")
    );
  END IF;
END $$;
