import { Exclude } from 'class-transformer';
import { User } from '@prisma/client';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';

export class UserEntity implements User {
  @ApiProperty({ example: 1, description: '사용자 고유 ID' })
  id: number;

  @ApiProperty({ example: 'user@example.com', description: '사용자 이메일' })
  email: string;

  @Exclude()
  @ApiHideProperty()
  password: string | null;

  @ApiProperty({ example: 'local', description: '가입 경로 (local, google 등)' })
  provider: string;

  @ApiProperty({
    example: '123456789',
    description: '소셜 로그인 고유 ID',
    nullable: true,
    required: false,
  })
  socialId: string | null;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
