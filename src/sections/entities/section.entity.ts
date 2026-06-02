import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ReminderEntity } from '../../reminders/entities/reminder.entity';

export class SectionEntity {
  @ApiProperty({ example: 'uuid-string', description: '섹션 고유 ID' })
  id: string;

  @ApiProperty({ example: 'Everyday', description: '섹션 제목' })
  title: string;

  @ApiProperty({ example: true, description: '고정 섹션 여부' })
  isFixed: boolean;

  @ApiProperty({ description: '생성일' })
  createdAt: Date;

  @ApiProperty({ description: '수정일' })
  updatedAt: Date;

  @ApiProperty({ type: () => [ReminderEntity], required: false })
  @Type(() => ReminderEntity)
  reminders?: ReminderEntity[];

  constructor(partial: Partial<SectionEntity>) {
    Object.assign(this, partial);
  }
}
