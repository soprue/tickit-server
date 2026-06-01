import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { DEFAULT_SECTIONS } from '../common/constants/sections.constants';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 새로운 사용자를 데이터베이스에 직접 생성합니다.
   * @param data 사용자 생성 데이터
   * @returns 생성된 사용자 객체
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return await this.prisma.user.create({
      data,
    });
  }

  /**
   * 새로운 사용자를 생성하고 기본 섹션(Everyday, To Do)을 함께 생성합니다.
   * 명시적 트랜잭션을 사용하여 데이터 일관성을 보장합니다.
   * @param data 사용자 생성 데이터
   * @returns 생성된 사용자 객체
   */
  async createWithDefaultSections(data: Prisma.UserCreateInput): Promise<User> {
    return await this.prisma.$transaction(async (tx) => {
      // 1. 유저 생성
      const user = await tx.user.create({ data });

      // 2. 기본 섹션 생성
      await tx.section.createMany({
        data: DEFAULT_SECTIONS.map((section) => ({
          ...section,
          userId: user.id,
        })),
      });

      return user;
    });
  }

  /**
   * 이메일을 통해 사용자를 검색합니다.
   * @param email 검색할 이메일
   * @returns 찾은 사용자 객체 또는 null
   */
  async findOneByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * ID를 통해 사용자를 검색합니다.
   * @param id 사용자 ID
   * @returns 사용자 객체 또는 null
   */
  async findOneById(id: number): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * 사용자의 리프레시 토큰을 업데이트합니다.
   * @param id 사용자 ID
   * @param refreshToken 새로운 리프레시 토큰 (로그아웃 시 null)
   */
  async updateRefreshToken(id: number, refreshToken: string | null) {
    await this.prisma.user.update({
      where: { id },
      data: { refreshToken },
    });
  }

  /**
   * 이메일로 사용자를 찾고 정보가 있으면 업데이트, 없으면 기본 섹션과 함께 생성합니다.
   * @param data 사용자 정보 (이메일, 소셜 ID, 가입 경로)
   * @returns 사용자 객체
   */
  async upsertByEmail(data: {
    email: string;
    socialId?: string;
    provider: string;
  }): Promise<User> {
    return await this.prisma.user.upsert({
      where: { email: data.email },
      update: {
        socialId: data.socialId,
        provider: data.provider,
      },
      create: {
        email: data.email,
        socialId: data.socialId,
        provider: data.provider,
        sections: {
          create: DEFAULT_SECTIONS,
        },
      },
    });
  }
}
