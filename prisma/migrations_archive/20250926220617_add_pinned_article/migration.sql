/*
  Warnings:

  - A unique constraint covering the columns `[pinnedArticleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pinnedArticleId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "User_pinnedArticleId_key" ON "User"("pinnedArticleId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_pinnedArticleId_fkey" FOREIGN KEY ("pinnedArticleId") REFERENCES "Article"("id") ON DELETE SET NULL ON UPDATE CASCADE;
