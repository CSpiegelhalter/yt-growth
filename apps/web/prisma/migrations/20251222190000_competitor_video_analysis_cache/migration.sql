-- AlterTable
ALTER TABLE "CompetitorVideo" ADD COLUMN "analysisJson" JSONB;

-- AlterTable
ALTER TABLE "CompetitorVideo" ADD COLUMN "analysisCapturedAt" TIMESTAMPTZ(6);

-- CreateIndex
CREATE INDEX "idx_competitor_video_analysis_captured" ON "CompetitorVideo"("analysisCapturedAt");


