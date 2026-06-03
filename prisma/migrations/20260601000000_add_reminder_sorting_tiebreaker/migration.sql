-- DropIndex
DROP INDEX "Reminder_sectionId_deletedAt_done_isAllDay_time_idx";

-- CreateIndex
CREATE INDEX "Reminder_sectionId_deletedAt_done_isAllDay_time_id_idx" ON "Reminder"("sectionId", "deletedAt", "done", "isAllDay" DESC, "time", "id");
