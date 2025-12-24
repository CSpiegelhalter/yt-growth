-- CreateTable
CREATE TABLE "UsageCounter" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "featureKey" VARCHAR(64) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_usage_counter" ON "UsageCounter"("userId", "date", "featureKey");

-- CreateIndex
CREATE INDEX "idx_usage_counter_user_date" ON "UsageCounter"("userId", "date");

