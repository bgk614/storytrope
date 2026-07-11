/*
  Warnings:

  - You are about to drop the column `rawJson` on the `Author` table. All the data in the column will be lost.
  - You are about to drop the column `rawJson` on the `Work` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Author" DROP COLUMN "rawJson";

-- AlterTable
ALTER TABLE "Work" DROP COLUMN "rawJson";
