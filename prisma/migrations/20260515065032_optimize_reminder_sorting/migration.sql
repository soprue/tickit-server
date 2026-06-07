-- DropIndex
DROP INDEX "Reminder_sectionId_deletedAt_isAllDay_time_idx";

-- CreateIndex
CREATE INDEX "Reminder_sectionId_deletedAt_done_isAllDay_time_idx" ON "Reminder"("sectionId", "deletedAt", "done", "isAllDay", "time");
