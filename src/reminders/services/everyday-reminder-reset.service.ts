import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EVERYDAY_SECTION_TITLE } from '../../common/constants/sections.constants';

const DAILY_RESET_TIME_ZONE = 'Asia/Seoul';

@Injectable()
export class EverydayReminderResetService {
  constructor(private prisma: PrismaService) {}

  async resetIfNeeded(userId: number) {
    const today = this.getTodayResetDate();
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { everydayLastResetDate: true },
    });

    if (!user || user.everydayLastResetDate === today) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.updateMany({
        where: {
          id: userId,
          OR: [
            { everydayLastResetDate: null },
            { everydayLastResetDate: { not: today } },
          ],
        },
        data: { everydayLastResetDate: today },
      });

      if (updatedUser.count === 0) {
        return;
      }

      await tx.reminder.updateMany({
        where: {
          deletedAt: null,
          section: {
            userId,
            title: EVERYDAY_SECTION_TITLE,
            isFixed: true,
            deletedAt: null,
          },
        },
        data: {
          done: false,
          notified: false,
          lastResetDate: today,
        },
      });
    });
  }

  private getTodayResetDate(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: DAILY_RESET_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );

    return `${values.year}-${values.month}-${values.day}`;
  }
}
