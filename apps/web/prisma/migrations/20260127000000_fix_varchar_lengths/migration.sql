-- Fix VARCHAR column lengths for Replicate model version strings
-- These need to accommodate full version identifiers like:
-- "cspiegelhalter/user-fd1a03ac-0851-4416-bbc3-c33e7950fa6a-identity:0d1afcb751a65504422153eb21cfb8449ad1e0d6294f88676f61f0513fbc052a"

-- UserModel.replicateModelVersion: 128 -> 256
ALTER TABLE "UserModel" ALTER COLUMN "replicateModelVersion" TYPE VARCHAR(256);

-- ThumbnailJobV2.styleModelVersionId: 128 -> 256
ALTER TABLE "ThumbnailJobV2" ALTER COLUMN "styleModelVersionId" TYPE VARCHAR(256);

-- ThumbnailJobV2.identityModelVersionId: 128 -> 256
ALTER TABLE "ThumbnailJobV2" ALTER COLUMN "identityModelVersionId" TYPE VARCHAR(256);

-- Add loraWeightsUrl column to UserModel (stores Replicate LoRA weights URL)
ALTER TABLE "UserModel" ADD COLUMN IF NOT EXISTS "loraWeightsUrl" TEXT;
