import { Injectable } from '@nestjs/common';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { PrismaService } from '../prisma/prisma.service';
import { SectionsService } from '../sections/sections.service';
import { ReminderNotFoundException } from '../common/exceptions/reminder-not-found.exception';
import { UnauthorizedSectionException } from '../common/exceptions/unauthorized-section.exception';

@Injectable()
export class RemindersService {
  constructor(
    private prisma: PrismaService,
    private sectionsService: SectionsService,
  ) {}

  /**
   * 새로운 리마인더를 생성합니다.
   */
  async create(userId: number, createReminderDto: CreateReminderDto) {
    // 섹션 소유권 확인 (SectionsService 활용)
    await this.sectionsService.findOne(userId, createReminderDto.sectionId);

    return await this.prisma.reminder.create({
      data: {
        ...createReminderDto,
        time: createReminderDto.time ? new Date(createReminderDto.time) : null,
      },
    });
  }

  /**
   * 사용자의 모든 리마인더를 조회합니다.
   */
  async findAll(userId: number, sectionId?: string) {
    return await this.prisma.reminder.findMany({
      where: {
        section: {
          userId: userId,
          ...(sectionId ? { id: sectionId } : {}),
        },
      },
      include: {
        section: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 리마인더 상세 조회 (소유권 확인 포함)
   */
  async findOne(userId: number, id: number) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id },
      include: { section: true },
    });

    if (!reminder || reminder.section.userId !== userId) {
      throw new ReminderNotFoundException();
    }

    return reminder;
  }

  /**
   * 리마인더 정보를 수정합니다.
   */
  async update(
    userId: number,
    id: number,
    updateReminderDto: UpdateReminderDto,
  ) {
    await this.findOne(userId, id);

    // 섹션 이동 시 해당 섹션 소유권 확인
    if (updateReminderDto.sectionId) {
      try {
        await this.sectionsService.findOne(userId, updateReminderDto.sectionId);
      } catch {
        throw new UnauthorizedSectionException();
      }
    }

    return await this.prisma.reminder.update({
      where: { id },
      data: {
        ...updateReminderDto,
        time: updateReminderDto.time
          ? new Date(updateReminderDto.time)
          : undefined,
      },
    });
  }

  /**
   * 리마인더를 삭제합니다.
   */
  async remove(userId: number, id: number) {
    await this.findOne(userId, id);

    return await this.prisma.reminder.delete({
      where: { id },
    });
  }
}
