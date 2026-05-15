import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

/**
 * Prisma Client를 NestJS에서 사용할 수 있도록 래핑한 서비스입니다.
 * 데이터베이스 연결 및 해제를 관리합니다.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private configService: ConfigService) {
    const pool = new Pool({
      connectionString: configService.get<string>('DATABASE_URL'),
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  /**
   * 모듈이 초기화될 때 데이터베이스에 연결합니다.
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * 모듈이 파괴될 때 데이터베이스 연결을 종료합니다.
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
