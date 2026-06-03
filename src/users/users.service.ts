import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { DEFAULT_SECTIONS } from '../common/constants/sections.constants';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * 전달받은 사용자 데이터를 그대로 생성합니다.
   * @param data 사용자 생성 데이터
   * @returns 생성된 사용자 객체
   */
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  /**
   * 사용자를 생성하고 기본 섹션을 같은 트랜잭션에서 생성합니다.
   * @param data 사용자 생성 데이터
   * @returns 생성된 사용자 객체
   */
  async createWithDefaultSections(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data });

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
   * 이메일로 사용자를 조회합니다.
   * @param email 검색할 이메일
   * @returns 찾은 사용자 객체 또는 null
   */
  async findOneByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * ID로 사용자를 조회합니다.
   * @param id 사용자 ID
   * @returns 사용자 객체 또는 null
   */
  async findOneById(id: number): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * 저장된 리프레시 토큰 해시를 갱신하거나 제거합니다.
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
   * 이메일 기준으로 OAuth 사용자를 갱신하거나 기본 섹션과 함께 생성합니다.
   * @param data 사용자 정보 (이메일, 소셜 ID, 가입 경로)
   * @returns 사용자 객체
   */
  async upsertByEmail(data: {
    email: string;
    socialId?: string;
    provider: string;
  }): Promise<User> {
    return this.prisma.user.upsert({
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
