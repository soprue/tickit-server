-- AlterTable
ALTER TABLE "User" ADD COLUMN     "provider" TEXT NOT NULL DEFAULT 'local',
ADD COLUMN     "socialId" TEXT,
ALTER COLUMN "password" DROP NOT NULL;
