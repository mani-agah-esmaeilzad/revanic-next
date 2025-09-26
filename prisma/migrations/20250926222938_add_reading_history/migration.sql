-- DropForeignKey
ALTER TABLE "Comment" DROP CONSTRAINT "Comment_parentId_fkey";

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "readTimeMinutes" INTEGER;

-- CreateTable
CREATE TABLE "ReadingHistory" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "articleId" INTEGER NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReadingHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReadingHistory_userId_articleId_key" ON "ReadingHistory"("userId", "articleId");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ReadingHistory" ADD CONSTRAINT "ReadingHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReadingHistory" ADD CONSTRAINT "ReadingHistory_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
