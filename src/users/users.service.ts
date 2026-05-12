import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

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
   * @param data 사용자 생성 데이터
   * @returns 생성된 사용자 객체
   */
  async createWithDefaultSections(data: Prisma.UserCreateInput): Promise<User> {
    return await this.prisma.user.create({
      data: {
        ...data,
        sections: {
          create: [
            { title: 'Everyday', isFixed: true },
            { title: 'To Do', isFixed: true },
          ],
        },
      },
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
   * 이메일로 사용자를 찾고 정보가 있으면 업데이트, 없으면 기본 섹션과 함께 생성합니다.
   * 주로 소셜 로그인 시 활용됩니다.
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
          create: [
            { title: 'Everyday', isFixed: true },
            { title: 'To Do', isFixed: true },
          ],
        },
      },
    });
  }
}
