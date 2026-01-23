-- CreateTable
CREATE TABLE "UserGoal" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER,
    "type" VARCHAR(64) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "target" INTEGER NOT NULL DEFAULT 1,
    "window" VARCHAR(16) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGoal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGoalCompletion" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "goalId" UUID NOT NULL,
    "windowKey" VARCHAR(16) NOT NULL,
    "completedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGoalCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER,
    "achievementKey" VARCHAR(64) NOT NULL,
    "unlockedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_user_goal_user" ON "UserGoal"("userId");

-- CreateIndex
CREATE INDEX "idx_user_goal_channel" ON "UserGoal"("channelId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_goal" ON "UserGoal"("userId", "channelId", "type", "window");

-- CreateIndex
CREATE INDEX "idx_goal_completion_goal" ON "UserGoalCompletion"("goalId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_goal_completion_window" ON "UserGoalCompletion"("goalId", "windowKey");

-- CreateIndex
CREATE INDEX "idx_user_achievement_user" ON "UserAchievement"("userId");

-- CreateIndex
CREATE INDEX "idx_user_achievement_unlocked" ON "UserAchievement"("unlockedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_achievement" ON "UserAchievement"("userId", "channelId", "achievementKey");

-- AddForeignKey
ALTER TABLE "UserGoalCompletion" ADD CONSTRAINT "UserGoalCompletion_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "UserGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
