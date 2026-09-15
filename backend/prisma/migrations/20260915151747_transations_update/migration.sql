/*
  Warnings:

  - You are about to drop the column `organizationId` on the `Group` table. All the data in the column will be lost.
  - You are about to drop the column `createdById` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `groupId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `groupId` on the `UserGroup` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `UserGroup` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,group_id]` on the table `UserGroup` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organization_id` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Group` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Organization` table without a default value. This is not possible if the table is not empty.
  - Added the required column `group_id` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `group_id` to the `UserGroup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `permission` to the `UserGroup` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `UserGroup` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "GroupPermission" AS ENUM ('READ_ONLY', 'EDITOR');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'TRANSFERENCIA');

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'MEMBRO';

-- DropForeignKey
ALTER TABLE "Group" DROP CONSTRAINT "Group_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_groupId_fkey";

-- DropForeignKey
ALTER TABLE "UserGroup" DROP CONSTRAINT "UserGroup_groupId_fkey";

-- DropForeignKey
ALTER TABLE "UserGroup" DROP CONSTRAINT "UserGroup_userId_fkey";

-- DropIndex
DROP INDEX "Transaction_createdById_idx";

-- DropIndex
DROP INDEX "Transaction_groupId_idx";

-- DropIndex
DROP INDEX "UserGroup_userId_groupId_key";

-- AlterTable
ALTER TABLE "Group" DROP COLUMN "organizationId",
ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "leaderName" TEXT,
ADD COLUMN     "organization_id" TEXT NOT NULL,
ADD COLUMN     "saldo_inicial" DECIMAL(10,2),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "createdById" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "createdById",
DROP COLUMN "groupId",
DROP COLUMN "tipo",
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "group_id" TEXT NOT NULL,
ADD COLUMN     "payment_type" "PaymentType",
ADD COLUMN     "type" "TransactionType" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updated_by" TEXT,
ALTER COLUMN "data" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "UserGroup" DROP COLUMN "groupId",
DROP COLUMN "userId",
ADD COLUMN     "created_by" TEXT,
ADD COLUMN     "group_id" TEXT NOT NULL,
ADD COLUMN     "permission" "GroupPermission" NOT NULL,
ADD COLUMN     "user_id" TEXT NOT NULL;

-- DropEnum
DROP TYPE "Tipo";

-- CreateIndex
CREATE INDEX "Group_organization_id_idx" ON "Group"("organization_id");

-- CreateIndex
CREATE INDEX "Organization_deletedAt_idx" ON "Organization"("deletedAt");

-- CreateIndex
CREATE INDEX "Transaction_group_id_idx" ON "Transaction"("group_id");

-- CreateIndex
CREATE INDEX "Transaction_created_by_idx" ON "Transaction"("created_by");

-- CreateIndex
CREATE INDEX "Transaction_updated_by_idx" ON "Transaction"("updated_by");

-- CreateIndex
CREATE INDEX "Transaction_payment_type_idx" ON "Transaction"("payment_type");

-- CreateIndex
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE INDEX "UserGroup_user_id_idx" ON "UserGroup"("user_id");

-- CreateIndex
CREATE INDEX "UserGroup_group_id_idx" ON "UserGroup"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserGroup_user_id_group_id_key" ON "UserGroup"("user_id", "group_id");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Group" ADD CONSTRAINT "Group_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGroup" ADD CONSTRAINT "UserGroup_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
