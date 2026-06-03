import { ApiProperty } from '@nestjs/swagger';

export class SyncSectionEntity {
  @ApiProperty({ example: 'uuid-string', description: '섹션 고유 ID' })
  id: string;

  @ApiProperty({ example: 'Everyday', description: '섹션 제목' })
  title: string;

  @ApiProperty({ example: true, description: '고정 섹션 여부' })
  isFixed: boolean;

  @ApiProperty({ example: 1, description: '소유자 ID' })
  userId: number;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  @ApiProperty({
    description: '삭제일. 삭제되지 않은 데이터는 null입니다.',
    nullable: true,
  })
  deletedAt: Date | null;

  constructor(partial: Partial<SyncSectionEntity>) {
    Object.assign(this, partial);
  }
}
