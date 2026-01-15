/*
  Add ThumbnailJobPrediction for tracking multiple Replicate predictions per job.
*/

CREATE TABLE IF NOT EXISTS "ThumbnailJobPrediction" (
  "id" UUID NOT NULL,
  "thumbnailJobId" UUID NOT NULL,
  "replicatePredictionId" VARCHAR(128) NOT NULL,
  "status" VARCHAR(32) NOT NULL DEFAULT 'starting',
  "outputImages" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ThumbnailJobPrediction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ThumbnailJobPrediction_replicatePredictionId_key"
  ON "ThumbnailJobPrediction"("replicatePredictionId");

CREATE INDEX IF NOT EXISTS "idx_thumbnail_job_pred_job"
  ON "ThumbnailJobPrediction"("thumbnailJobId");

CREATE INDEX IF NOT EXISTS "idx_thumbnail_job_pred_status"
  ON "ThumbnailJobPrediction"("status");

ALTER TABLE "ThumbnailJobPrediction"
  ADD CONSTRAINT "ThumbnailJobPrediction_thumbnailJobId_fkey"
  FOREIGN KEY ("thumbnailJobId") REFERENCES "ThumbnailJob"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

