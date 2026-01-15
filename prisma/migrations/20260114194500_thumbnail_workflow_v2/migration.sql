/*
  Thumbnail Workflow V2

  - Preserve legacy concept-based thumbnail generator tables by renaming:
    ThumbnailJob -> LegacyThumbnailJob
    ThumbnailVariant -> LegacyThumbnailVariant
    ThumbnailAsset -> LegacyThumbnailAsset

  - Add new identity + workflow tables:
    UserModel, UserTrainingAsset, ThumbnailJob, ThumbnailProject, ReplicateWebhookEvent
*/

-- ============================================
-- Rename legacy thumbnail generator tables
-- ============================================

-- Drop FK before renaming to keep names clean
ALTER TABLE "ThumbnailVariant" DROP CONSTRAINT IF EXISTS "ThumbnailVariant_jobId_fkey";

ALTER TABLE "ThumbnailJob" RENAME TO "LegacyThumbnailJob";
ALTER TABLE "ThumbnailVariant" RENAME TO "LegacyThumbnailVariant";
ALTER TABLE "ThumbnailAsset" RENAME TO "LegacyThumbnailAsset";

-- Rename indexes (best-effort; IF EXISTS for safety across environments)
ALTER INDEX IF EXISTS "idx_thumbnail_job_user" RENAME TO "idx_legacy_thumbnail_job_user";
ALTER INDEX IF EXISTS "idx_thumbnail_job_channel" RENAME TO "idx_legacy_thumbnail_job_channel";
ALTER INDEX IF EXISTS "idx_thumbnail_job_status" RENAME TO "idx_legacy_thumbnail_job_status";
ALTER INDEX IF EXISTS "idx_thumbnail_job_created" RENAME TO "idx_legacy_thumbnail_job_created";

ALTER INDEX IF EXISTS "idx_thumbnail_asset_user" RENAME TO "idx_legacy_thumbnail_asset_user";
ALTER INDEX IF EXISTS "idx_thumbnail_asset_created" RENAME TO "idx_legacy_thumbnail_asset_created";

ALTER INDEX IF EXISTS "idx_thumbnail_variant_job" RENAME TO "idx_legacy_thumbnail_variant_job";
ALTER INDEX IF EXISTS "idx_thumbnail_variant_created" RENAME TO "idx_legacy_thumbnail_variant_created";

-- Re-add FK to the renamed legacy tables
ALTER TABLE "LegacyThumbnailVariant"
  ADD CONSTRAINT "LegacyThumbnailVariant_jobId_fkey"
  FOREIGN KEY ("jobId") REFERENCES "LegacyThumbnailJob"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

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
-- New tables
-- ============================================

CREATE TABLE IF NOT EXISTS "UserModel" (
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

CREATE UNIQUE INDEX IF NOT EXISTS "UserModel_userId_key" ON "UserModel"("userId");
CREATE INDEX IF NOT EXISTS "idx_user_model_user_status" ON "UserModel"("userId", "status");

ALTER TABLE "UserModel"
  ADD CONSTRAINT "UserModel_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "UserTrainingAsset" (
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

CREATE INDEX IF NOT EXISTS "idx_user_training_asset_user" ON "UserTrainingAsset"("userId");
CREATE INDEX IF NOT EXISTS "idx_user_training_asset_model" ON "UserTrainingAsset"("identityModelId");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_user_training_asset_user_sha" ON "UserTrainingAsset"("userId", "sha256");

ALTER TABLE "UserTrainingAsset"
  ADD CONSTRAINT "UserTrainingAsset_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserTrainingAsset"
  ADD CONSTRAINT "UserTrainingAsset_identityModelId_fkey"
  FOREIGN KEY ("identityModelId") REFERENCES "UserModel"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ThumbnailJob" (
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

  CONSTRAINT "ThumbnailJob_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "idx_thumbnail_job_v2_user_created" ON "ThumbnailJob"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_thumbnail_job_v2_user_status" ON "ThumbnailJob"("userId", "status");

ALTER TABLE "ThumbnailJob"
  ADD CONSTRAINT "ThumbnailJob_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ThumbnailProject" (
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

CREATE INDEX IF NOT EXISTS "idx_thumbnail_project_user_created" ON "ThumbnailProject"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "idx_thumbnail_project_job" ON "ThumbnailProject"("thumbnailJobId");

ALTER TABLE "ThumbnailProject"
  ADD CONSTRAINT "ThumbnailProject_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ThumbnailProject"
  ADD CONSTRAINT "ThumbnailProject_thumbnailJobId_fkey"
  FOREIGN KEY ("thumbnailJobId") REFERENCES "ThumbnailJob"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "ReplicateWebhookEvent" (
  "id" VARCHAR(255) NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReplicateWebhookEvent_pkey" PRIMARY KEY ("id")
);

