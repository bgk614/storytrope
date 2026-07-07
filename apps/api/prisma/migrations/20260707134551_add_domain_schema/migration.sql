/*
  Warnings:

  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- CreateEnum
CREATE TYPE "ReadingStatus" AS ENUM ('TO_READ', 'READ');

-- CreateEnum
CREATE TYPE "WorkTropeSource" AS ENUM ('AI', 'USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('UP', 'DOWN');

-- AlterTable
ALTER TABLE "User" DROP CONSTRAINT "User_pkey",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "User_id_seq";

-- CreateTable
CREATE TABLE "Author" (
    "id" TEXT NOT NULL,
    "olKey" TEXT,
    "name" TEXT NOT NULL,
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Author_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Work" (
    "id" TEXT NOT NULL,
    "olKey" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "firstPublishDate" TEXT,
    "coverId" INTEGER,
    "sourceCreatedAt" TIMESTAMP(3),
    "sourceModifiedAt" TIMESTAMP(3),
    "likeScore" INTEGER NOT NULL DEFAULT 0,
    "rawJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Work_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkAuthor" (
    "workId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "WorkAuthor_pkey" PRIMARY KEY ("workId","authorId")
);

-- CreateTable
CREATE TABLE "UserBook" (
    "userId" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "status" "ReadingStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBook_pkey" PRIMARY KEY ("userId","workId")
);

-- CreateTable
CREATE TABLE "WorkTrope" (
    "workId" TEXT NOT NULL,
    "tropeId" TEXT NOT NULL,
    "source" "WorkTropeSource" NOT NULL,
    "aiConfidence" DOUBLE PRECISION,
    "createdByUserId" TEXT,
    "voteScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkTrope_pkey" PRIMARY KEY ("workId","tropeId")
);

-- CreateTable
CREATE TABLE "WorkTropeVote" (
    "userId" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "tropeId" TEXT NOT NULL,
    "voteType" "VoteType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkTropeVote_pkey" PRIMARY KEY ("userId","workId","tropeId")
);

-- CreateTable
CREATE TABLE "Edition" (
    "id" TEXT NOT NULL,
    "workId" TEXT NOT NULL,
    "isbn10" TEXT,
    "isbn13" TEXT,
    "publisher" TEXT,
    "publishDate" TEXT,
    "language" TEXT,
    "pageCount" INTEGER,
    "coverId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Edition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trope" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "likeScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trope_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TropeLike" (
    "tropeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TropeLike_pkey" PRIMARY KEY ("tropeId","userId")
);

-- CreateTable
CREATE TABLE "WorkLike" (
    "workId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkLike_pkey" PRIMARY KEY ("workId","userId")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkSubject" (
    "workId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "WorkSubject_pkey" PRIMARY KEY ("workId","subjectId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Author_olKey_key" ON "Author"("olKey");

-- CreateIndex
CREATE UNIQUE INDEX "Work_olKey_key" ON "Work"("olKey");

-- CreateIndex
CREATE INDEX "Work_title_idx" ON "Work"("title");

-- CreateIndex
CREATE INDEX "UserBook_workId_idx" ON "UserBook"("workId");

-- CreateIndex
CREATE INDEX "WorkTrope_tropeId_idx" ON "WorkTrope"("tropeId");

-- CreateIndex
CREATE UNIQUE INDEX "Trope_name_key" ON "Trope"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE INDEX "WorkSubject_subjectId_idx" ON "WorkSubject"("subjectId");

-- AddForeignKey
ALTER TABLE "WorkAuthor" ADD CONSTRAINT "WorkAuthor_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkAuthor" ADD CONSTRAINT "WorkAuthor_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBook" ADD CONSTRAINT "UserBook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserBook" ADD CONSTRAINT "UserBook_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTrope" ADD CONSTRAINT "WorkTrope_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTrope" ADD CONSTRAINT "WorkTrope_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTrope" ADD CONSTRAINT "WorkTrope_tropeId_fkey" FOREIGN KEY ("tropeId") REFERENCES "Trope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTropeVote" ADD CONSTRAINT "WorkTropeVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkTropeVote" ADD CONSTRAINT "WorkTropeVote_workId_tropeId_fkey" FOREIGN KEY ("workId", "tropeId") REFERENCES "WorkTrope"("workId", "tropeId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Edition" ADD CONSTRAINT "Edition_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trope" ADD CONSTRAINT "Trope_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Trope"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TropeLike" ADD CONSTRAINT "TropeLike_tropeId_fkey" FOREIGN KEY ("tropeId") REFERENCES "Trope"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TropeLike" ADD CONSTRAINT "TropeLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLike" ADD CONSTRAINT "WorkLike_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkLike" ADD CONSTRAINT "WorkLike_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSubject" ADD CONSTRAINT "WorkSubject_workId_fkey" FOREIGN KEY ("workId") REFERENCES "Work"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkSubject" ADD CONSTRAINT "WorkSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
