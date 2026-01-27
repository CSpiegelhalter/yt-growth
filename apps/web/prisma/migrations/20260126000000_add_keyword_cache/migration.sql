-- CreateTable
CREATE TABLE "KeywordCache" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" VARCHAR(32) NOT NULL DEFAULT 'semrush',
    "mode" VARCHAR(32) NOT NULL,
    "phrase" VARCHAR(255) NOT NULL,
    "database" VARCHAR(8) NOT NULL,
    "requestHash" VARCHAR(64) NOT NULL,
    "responseJson" JSONB NOT NULL,
    "fetchedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeywordCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_keyword_cache_request" ON "KeywordCache"("provider", "mode", "requestHash");

-- CreateIndex
CREATE INDEX "idx_keyword_cache_expires" ON "KeywordCache"("expiresAt");

-- CreateIndex
CREATE INDEX "idx_keyword_cache_phrase" ON "KeywordCache"("phrase", "database");
