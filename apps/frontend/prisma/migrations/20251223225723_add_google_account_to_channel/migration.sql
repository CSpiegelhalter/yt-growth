-- AlterTable
ALTER TABLE "Channel" ADD COLUMN     "googleAccountId" INTEGER;

-- CreateIndex
CREATE INDEX "idx_channel_google_account" ON "Channel"("googleAccountId");

-- AddForeignKey
ALTER TABLE "Channel" ADD CONSTRAINT "Channel_googleAccountId_fkey" FOREIGN KEY ("googleAccountId") REFERENCES "GoogleAccount"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
