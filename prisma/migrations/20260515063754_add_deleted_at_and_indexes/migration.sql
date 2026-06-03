-- AlterTable
ALTER TABLE "Reminder" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Section" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Reminder_sectionId_deletedAt_idx" ON "Reminder"("sectionId", "deletedAt");

-- CreateIndex
CREATE INDEX "Section_userId_deletedAt_idx" ON "Section"("userId", "deletedAt");
