import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return await this.prisma.user.create({
      data,
    });
  }

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

  async findOneByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

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
