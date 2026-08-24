/*
  Warnings:

  - Added the required column `passwordHash` to the `users` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "passwordHash" TEXT NOT NULL,
ALTER COLUMN "phone" DROP NOT NULL,
ALTER COLUMN "email" SET NOT NULL;
