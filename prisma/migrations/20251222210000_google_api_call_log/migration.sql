-- CreateTable
CREATE TABLE "GoogleApiCallLog" (
    "id" UUID NOT NULL,
    "at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "url" TEXT NOT NULL,
    "host" VARCHAR(255) NOT NULL,
    "path" VARCHAR(255) NOT NULL,
    "status" VARCHAR(16) NOT NULL,
    "estimatedUnits" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "GoogleApiCallLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_google_api_calllog_at" ON "GoogleApiCallLog"("at");

-- CreateIndex
CREATE INDEX "idx_google_api_calllog_host" ON "GoogleApiCallLog"("host");

-- CreateIndex
CREATE INDEX "idx_google_api_calllog_path" ON "GoogleApiCallLog"("path");


