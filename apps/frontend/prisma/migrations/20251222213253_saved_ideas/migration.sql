-- CreateTable
CREATE TABLE "SavedIdea" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER,
    "ideaId" VARCHAR(64) NOT NULL,
    "title" VARCHAR(500) NOT NULL,
    "angle" TEXT,
    "format" VARCHAR(16) NOT NULL,
    "difficulty" VARCHAR(16) NOT NULL,
    "ideaJson" JSONB NOT NULL,
    "notes" TEXT,
    "status" VARCHAR(32) NOT NULL DEFAULT 'saved',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedIdea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_saved_idea_user_status" ON "SavedIdea"("userId", "status");

-- CreateIndex
CREATE INDEX "idx_saved_idea_user_created" ON "SavedIdea"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_saved_idea_user_idea" ON "SavedIdea"("userId", "ideaId");
