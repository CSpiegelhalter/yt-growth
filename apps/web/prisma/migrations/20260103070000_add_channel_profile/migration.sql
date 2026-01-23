-- CreateTable: Channel Profile
-- Stores user-defined channel profile and AI-generated structured data

CREATE TABLE "ChannelProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "channelId" INTEGER NOT NULL,
    "inputJson" TEXT NOT NULL,
    "inputHash" VARCHAR(64) NOT NULL,
    "aiProfileJson" TEXT,
    "lastGeneratedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique channel profile per channel
CREATE UNIQUE INDEX "uq_channel_profile" ON "ChannelProfile"("channelId");

-- CreateIndex: For finding profiles that need regeneration
CREATE INDEX "idx_channel_profile_generated" ON "ChannelProfile"("lastGeneratedAt");

-- AddForeignKey: Channel relationship
ALTER TABLE "ChannelProfile" ADD CONSTRAINT "fk_channel_profile_channel" 
    FOREIGN KEY ("channelId") REFERENCES "Channel"("id") 
    ON DELETE CASCADE ON UPDATE NO ACTION;
