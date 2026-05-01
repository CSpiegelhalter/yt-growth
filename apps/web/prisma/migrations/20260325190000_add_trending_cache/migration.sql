-- CreateTable
CREATE TABLE IF NOT EXISTS "TrendingCache" (
    "key" VARCHAR(64) NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "TrendingCache_pkey" PRIMARY KEY ("key")
);
