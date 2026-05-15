import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { PrismaService } from '../prisma/prisma.service';
import { SectionNotFoundException } from '../common/exceptions/section-not-found.exception';
import { FixedSectionException } from '../common/exceptions/fixed-section.exception';

@Injectable()
export class SectionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 새로운 섹션을 생성합니다.
   */
  async create(userId: number, createSectionDto: CreateSectionDto) {
    return await this.prisma.section.create({
      data: {
        ...createSectionDto,
        userId,
      },
    });
  }

  /**
   * 해당 사용자의 삭제되지 않은 모든 섹션을 조회합니다.
   */
  async findAll(userId: number) {
    return await this.prisma.section.findMany({
      where: { 
        userId,
        deletedAt: null // Soft delete 필터링
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * 특정 섹션을 상세 조회합니다. (삭제된 섹션 제외)
   */
  async findOne(userId: number, id: string) {
    const section = await this.prisma.section.findFirst({
      where: { 
        id,
        userId,
        deletedAt: null 
      },
    });

    if (!section) {
      throw new SectionNotFoundException();
    }

    return section;
  }

  /**
   * 섹션 이름을 변경합니다. (고정 섹션 제외)
   */
  async update(userId: number, id: string, updateSectionDto: UpdateSectionDto) {
    const section = await this.findOne(userId, id);

    this.validateIfFixed(section.isFixed, '수정');

    return await this.prisma.section.update({
      where: { id },
      data: updateSectionDto,
    });
  }

  /**
   * 섹션을 소프트 삭제합니다. (고정 섹션 제외)
   */
  async remove(userId: number, id: string) {
    const section = await this.findOne(userId, id);

    this.validateIfFixed(section.isFixed, '삭제');

    return await this.prisma.section.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * 고정 섹션 여부를 확인하여 예외를 발생시킵니다.
   */
  private validateIfFixed(isFixed: boolean, action: '수정' | '삭제') {
    if (isFixed) {
      throw new FixedSectionException(action);
    }
  }
}
