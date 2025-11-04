-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "isBilingual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "translatedContent" TEXT,
ADD COLUMN     "translatedTitle" TEXT,
ADD COLUMN     "translationProvider" TEXT,
ADD COLUMN     "translationUpdatedAt" TIMESTAMP(3);
