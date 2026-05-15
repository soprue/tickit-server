import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateReminderDto } from './dto/create-reminder.dto';
import { UpdateReminderDto } from './dto/update-reminder.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RemindersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 새로운 리마인더를 생성합니다.
   * 해당 섹션이 사용자의 소유인지 확인합니다.
   */
  async create(userId: number, createReminderDto: CreateReminderDto) {
    const section = await this.prisma.section.findUnique({
      where: { id: createReminderDto.sectionId },
    });

    if (!section || section.userId !== userId) {
      throw new ForbiddenException('해당 섹션에 권한이 없습니다.');
    }

    return await this.prisma.reminder.create({
      data: {
        ...createReminderDto,
        time: createReminderDto.time ? new Date(createReminderDto.time) : null,
      },
    });
  }

  /**
   * 사용자의 모든 리마인더를 조회합니다. (또는 섹션별 필터링)
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
        section: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * 리마인더 상세 조회
   */
  async findOne(userId: number, id: number) {
    const reminder = await this.prisma.reminder.findUnique({
      where: { id },
      include: { section: true },
    });

    if (!reminder || reminder.section.userId !== userId) {
      throw new NotFoundException('리마인더를 찾을 수 없습니다.');
    }

    return reminder;
  }

  /**
   * 리마인더 정보를 수정합니다.
   */
  async update(userId: number, id: number, updateReminderDto: UpdateReminderDto) {
    await this.findOne(userId, id);

    // 섹션 이동 시 해당 섹션 소유권 확인
    if (updateReminderDto.sectionId) {
      const section = await this.prisma.section.findUnique({
        where: { id: updateReminderDto.sectionId },
      });
      if (!section || section.userId !== userId) {
        throw new ForbiddenException('이동하려는 섹션에 권한이 없습니다.');
      }
    }

    return await this.prisma.reminder.update({
      where: { id },
      data: {
        ...updateReminderDto,
        time: updateReminderDto.time ? new Date(updateReminderDto.time) : undefined,
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
