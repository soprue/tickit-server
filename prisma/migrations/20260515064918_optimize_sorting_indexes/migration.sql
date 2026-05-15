-- DropIndex
DROP INDEX "Reminder_sectionId_deletedAt_idx";

-- DropIndex
DROP INDEX "Section_userId_deletedAt_idx";

-- CreateIndex
CREATE INDEX "Reminder_sectionId_deletedAt_isAllDay_time_idx" ON "Reminder"("sectionId", "deletedAt", "isAllDay", "time");

-- CreateIndex
CREATE INDEX "Section_userId_deletedAt_createdAt_idx" ON "Section"("userId", "deletedAt", "createdAt");
