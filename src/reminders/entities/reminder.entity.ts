import { Exclude, Type } from 'class-transformer';
import { Reminder } from '@prisma/client';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { SectionEntity } from '../../sections/entities/section.entity';

export class ReminderEntity implements Reminder {
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

  @ApiProperty({ description: '소속 섹션 ID' })
  sectionId: string;

  @Exclude()
  @ApiHideProperty()
  @Type(() => SectionEntity)
  section?: Partial<SectionEntity>;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  constructor(partial: Partial<ReminderEntity>) {
    Object.assign(this, partial);
  }
}
