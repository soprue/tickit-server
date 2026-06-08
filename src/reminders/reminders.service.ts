import { Injectable } from '@nestjs/common';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { PrismaService } from '../prisma/prisma.service';
import { SectionsService } from '../sections/sections.service';
import { ReminderNotFoundException } from '../common/exceptions/reminder-not-found.exception';
import { UnauthorizedSectionException } from '../common/exceptions/unauthorized-section.exception';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { EverydayReminderResetService } from './services/everyday-reminder-reset.service';

@Injectable()
export class RemindersService {
  constructor(
    private prisma: PrismaService,
    private sectionsService: SectionsService,
    private everydayReminderResetService: EverydayReminderResetService,
  ) {}

  /**
   * 현재 사용자가 소유한 섹션에 새 리마인더를 생성합니다.
   */
  async create(userId: number, createReminderDto: CreateReminderDto) {
    try {
      return await this.prisma.reminder.create({
        data: {
          text: createReminderDto.text,
          time: createReminderDto.time
            ? new Date(createReminderDto.time)
            : null,
          isAllDay: createReminderDto.isAllDay || false,
          section: {
            connect: {
              id: createReminderDto.sectionId,
              userId: userId,
              deletedAt: null,
            },
          },
        },
      });
    } catch {
      throw new UnauthorizedSectionException();
    }
  }

  /**
   * 삭제되지 않은 리마인더를 커서 기반으로 조회합니다.
   */
  async findAll(userId: number, query: PaginationQueryDto) {
    const { take, cursor, sectionId } = query;

    await this.everydayReminderResetService.resetIfNeeded(userId);

    return this.prisma.reminder.findMany({
      take,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      where: {
        deletedAt: null,
        section: {
          userId: userId,
          deletedAt: null,
          ...(sectionId ? { id: sectionId } : {}),
        },
      },
      orderBy: [
        { done: 'asc' },
        { isAllDay: 'desc' },
        { time: 'asc' },
        { id: 'asc' },
      ],
    });
  }

  /**
   * 삭제되지 않았고 현재 사용자가 접근할 수 있는 리마인더를 조회합니다.
   */
  async findOne(userId: number, id: number) {
    await this.everydayReminderResetService.resetIfNeeded(userId);

    const reminder = await this.prisma.reminder.findFirst({
      where: {
        id,
        deletedAt: null,
        section: {
          userId,
          deletedAt: null,
        },
      },
    });

    if (!reminder) {
      throw new ReminderNotFoundException();
    }

    return reminder;
  }

  /**
   * 리마인더 정보를 수정합니다.
   * time이 undefined이면 유지하고, null이면 알림 시간을 제거합니다.
   */
  async update(
    userId: number,
    id: number,
    updateReminderDto: UpdateReminderDto,
  ) {
    if (updateReminderDto.sectionId) {
      await this.sectionsService.findOne(userId, updateReminderDto.sectionId);
    }

    try {
      const { time, ...reminderData } = updateReminderDto;
      const nextTime = time === undefined ? undefined : time && new Date(time);
      const shouldCheckTimeChange =
        time !== undefined && updateReminderDto.notified === undefined;
      let shouldResetNotified = false;

      if (shouldCheckTimeChange) {
        const existingReminder = await this.prisma.reminder.findFirst({
          where: {
            id,
            deletedAt: null,
            section: {
              userId,
              deletedAt: null,
            },
          },
          select: {
            time: true,
          },
        });

        if (!existingReminder) {
          throw new ReminderNotFoundException();
        }

        shouldResetNotified =
          this.getTimeValue(existingReminder.time) !==
          this.getTimeValue(nextTime || null);
      }

      return await this.prisma.reminder.update({
        where: {
          id: id,
          deletedAt: null,
          section: {
            userId: userId,
          },
        },
        data: {
          ...reminderData,
          time: nextTime,
          ...(shouldResetNotified ? { notified: false } : {}),
        },
      });
    } catch {
      throw new ReminderNotFoundException();
    }
  }

  /**
   * 리마인더를 실제 삭제하지 않고 deletedAt을 설정해 숨깁니다.
   */
  async remove(userId: number, id: number) {
    try {
      return await this.prisma.reminder.update({
        where: {
          id: id,
          deletedAt: null,
          section: {
            userId: userId,
          },
        },
        data: { deletedAt: new Date() },
      });
    } catch {
      throw new ReminderNotFoundException();
    }
  }

  private getTimeValue(time: Date | null) {
    return time ? time.getTime() : null;
  }
}
