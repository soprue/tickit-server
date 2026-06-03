import { ApiProperty } from '@nestjs/swagger';

export class SyncReminderEntity {
  @ApiProperty({ example: 1, description: '리마인더 고유 ID' })
  id: number;

  @ApiProperty({ example: '우유 사기', description: '리마인더 내용' })
  text: string;

  @ApiProperty({
    example: '2026-05-15T10:00:00Z',
    description: '알림 시간',
    nullable: true,
  })
  time: Date | null;

  @ApiProperty({ example: false, description: '하루 종일 여부' })
  isAllDay: boolean;

  @ApiProperty({ example: false, description: '알림 발송 여부' })
  notified: boolean;

  @ApiProperty({ example: false, description: '완료 여부' })
  done: boolean;

  @ApiProperty({
    example: '2026-06-01',
    description: 'Everyday 섹션 리마인더가 마지막으로 일일 리셋된 날짜',
    nullable: true,
  })
  lastResetDate: string | null;

  @ApiProperty({ description: '소속 섹션 ID' })
  sectionId: string;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  @ApiProperty({
    description: '삭제일. 삭제되지 않은 데이터는 null입니다.',
    nullable: true,
  })
  deletedAt: Date | null;

  constructor(partial: Partial<SyncReminderEntity>) {
    Object.assign(this, partial);
  }
}
