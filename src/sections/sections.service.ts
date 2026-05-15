import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { PrismaService } from '../prisma/prisma.service';

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
   * 해당 사용자의 모든 섹션을 조회합니다.
   */
  async findAll(userId: number) {
    return await this.prisma.section.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * 특정 섹션을 상세 조회합니다. (본인 소유 확인)
   */
  async findOne(userId: number, id: string) {
    const section = await this.prisma.section.findUnique({
      where: { id },
    });

    if (!section || section.userId !== userId) {
      throw new NotFoundException('섹션을 찾을 수 없습니다.');
    }

    return section;
  }

  /**
   * 섹션 이름을 변경합니다. (고정 섹션 제외)
   */
  async update(userId: number, id: string, updateSectionDto: UpdateSectionDto) {
    const section = await this.findOne(userId, id);

    if (section.isFixed) {
      throw new ForbiddenException('기본 섹션은 수정할 수 없습니다.');
    }

    return await this.prisma.section.update({
      where: { id },
      data: updateSectionDto,
    });
  }

  /**
   * 섹션을 삭제합니다. (고정 섹션 제외)
   */
  async remove(userId: number, id: string) {
    const section = await this.findOne(userId, id);

    if (section.isFixed) {
      throw new ForbiddenException('기본 섹션은 삭제할 수 없습니다.');
    }

    return await this.prisma.section.delete({
      where: { id },
    });
  }
}
