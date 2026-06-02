import { Injectable } from '@nestjs/common';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { PrismaService } from '../prisma/prisma.service';
import { SectionsService } from '../sections/sections.service';
import { ReminderNotFoundException } from '../common/exceptions/reminder-not-found.exception';
import { UnauthorizedSectionException } from '../common/exceptions/unauthorized-section.exception';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { EVERYDAY_SECTION_TITLE } from '../common/constants/sections.constants';

const DAILY_RESET_TIME_ZONE = 'Asia/Seoul';

@Injectable()
export class RemindersService {
  constructor(
    private prisma: PrismaService,
    private sectionsService: SectionsService,
  ) {}

  /**
   * 새로운 리마인더를 생성합니다.
   * 최적화: 섹션 소유권 확인과 생성을 한 번의 쿼리로 처리합니다.
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
              userId: userId, // 섹션의 userId가 현재 유저와 일치해야만 성공
              deletedAt: null,
            },
          },
        },
      });
    } catch {
      // connect 조건이 맞지 않으면(섹션이 없거나 주인이 아니면) 에러 발생
      throw new UnauthorizedSectionException();
    }
  }

  /**
   * 사용자의 삭제되지 않은 모든 리마인더를 조회합니다. (Cursor Pagination 적용)
   */
  async findAll(userId: number, query: PaginationQueryDto) {
    const { take, cursor, sectionId } = query;

    await this.resetEverydayReminders(userId);

    return this.prisma.reminder.findMany({
      take,
      skip: cursor ? 1 : 0, // cursor가 있으면 해당 cursor 다음부터 가져옴
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
        { done: 'asc' }, // 미완료(false)가 위로, 완료(true)가 아래로
        { isAllDay: 'desc' }, // 하루종일(true)이 위로
        { time: 'asc' }, // 시간 오름차순 (오전 1시 -> 오전 2시)
        { id: 'asc' }, // 동일한 정렬 값에서 커서 페이지네이션을 안정화
      ],
    });
  }

  /**
   * 리마인더 상세 조회 (삭제된 항목 제외)
   */
  async findOne(userId: number, id: number) {
    await this.resetEverydayReminders(userId);

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
   * 최적화: 한 번의 update 쿼리로 소유권 확인과 수정을 동시에 시도합니다.
   */
  async update(
    userId: number,
    id: number,
    updateReminderDto: UpdateReminderDto,
  ) {
    // 1. 섹션 이동이 포함된 경우, 이동할 섹션에 대한 권한 먼저 확인 (이건 별도 조회가 필요)
    if (updateReminderDto.sectionId) {
      await this.sectionsService.findOne(userId, updateReminderDto.sectionId);
    }

    try {
      // 2. update 시 where 절에 소유권 조건을 포함하여 최적화
      return await this.prisma.reminder.update({
        where: {
          id: id,
          deletedAt: null,
          section: {
            userId: userId,
          },
        },
        data: {
          ...updateReminderDto,
          time: updateReminderDto.time
            ? new Date(updateReminderDto.time)
            : undefined,
        },
      });
    } catch {
      throw new ReminderNotFoundException();
    }
  }

  /**
   * 리마인더를 소프트 삭제합니다.
   * 최적화: where 절에 소유권 조건을 넣어 한 번에 처리합니다.
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

  private async resetEverydayReminders(userId: number) {
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
