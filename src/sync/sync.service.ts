import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncReminderEntity } from './entities/sync-reminder.entity';
import { SyncSectionEntity } from './entities/sync-section.entity';

@Injectable()
export class SyncService {
  constructor(private prisma: PrismaService) {}

  async pull(userId: number, since?: string) {
    const serverTime = new Date();
    const changedSince = since ? new Date(since) : undefined;

    const [changedSections, deletedSections, changedReminders, deletedReminders] =
      await Promise.all([
        this.prisma.section.findMany({
          where: {
            userId,
            deletedAt: null,
            ...(changedSince ? { updatedAt: { gt: changedSince } } : {}),
          },
          orderBy: { updatedAt: 'asc' },
        }),
        changedSince
          ? this.prisma.section.findMany({
              where: {
                userId,
                deletedAt: { gt: changedSince },
              },
              orderBy: { deletedAt: 'asc' },
            })
          : Promise.resolve([]),
        this.prisma.reminder.findMany({
          where: {
            deletedAt: null,
            ...(changedSince ? { updatedAt: { gt: changedSince } } : {}),
            section: {
              userId,
            },
          },
          orderBy: { updatedAt: 'asc' },
        }),
        changedSince
          ? this.prisma.reminder.findMany({
              where: {
                deletedAt: { gt: changedSince },
                section: {
                  userId,
                },
              },
              orderBy: { deletedAt: 'asc' },
            })
          : Promise.resolve([]),
      ]);

    return {
      serverTime,
      sections: {
        changed: changedSections.map(
          (section) => new SyncSectionEntity(section),
        ),
        deleted: deletedSections.map(
          (section) => new SyncSectionEntity(section),
        ),
      },
      reminders: {
        changed: changedReminders.map(
          (reminder) => new SyncReminderEntity(reminder),
        ),
        deleted: deletedReminders.map(
          (reminder) => new SyncReminderEntity(reminder),
        ),
      },
    };
  }
}
