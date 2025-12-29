-- AlterTable
ALTER TABLE "UsageCounter" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "categoryId" VARCHAR(32);
