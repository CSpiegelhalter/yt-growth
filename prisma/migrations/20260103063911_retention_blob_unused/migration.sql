-- AlterTable
ALTER TABLE "UserAchievement" ADD COLUMN     "coinsAwarded" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "xpAwarded" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UserRewards" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER,
    "totalXp" INTEGER NOT NULL DEFAULT 0,
    "totalCoins" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRewards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserDefaultGoalCompletion" (
    "id" UUID NOT NULL,
    "userId" INTEGER NOT NULL,
    "channelId" INTEGER,
    "goalId" VARCHAR(64) NOT NULL,
    "windowKey" VARCHAR(16) NOT NULL,
    "completedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT true,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "coinsAwarded" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "UserDefaultGoalCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_user_rewards_user" ON "UserRewards"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "uq_user_rewards" ON "UserRewards"("userId", "channelId");

-- CreateIndex
CREATE INDEX "idx_default_goal_user_channel" ON "UserDefaultGoalCompletion"("userId", "channelId");

-- CreateIndex
CREATE INDEX "idx_default_goal_completed" ON "UserDefaultGoalCompletion"("completedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uq_default_goal_completion" ON "UserDefaultGoalCompletion"("userId", "channelId", "goalId", "windowKey");
