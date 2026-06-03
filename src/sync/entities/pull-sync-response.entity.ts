import { ApiProperty } from '@nestjs/swagger';
import { SyncReminderEntity } from './sync-reminder.entity';
import { SyncSectionEntity } from './sync-section.entity';

class SyncSectionChangesEntity {
  @ApiProperty({ type: [SyncSectionEntity] })
  changed: SyncSectionEntity[];

  @ApiProperty({ type: [SyncSectionEntity] })
  deleted: SyncSectionEntity[];
}

class SyncReminderChangesEntity {
  @ApiProperty({ type: [SyncReminderEntity] })
  changed: SyncReminderEntity[];

  @ApiProperty({ type: [SyncReminderEntity] })
  deleted: SyncReminderEntity[];
}

export class PullSyncResponseEntity {
  @ApiProperty({
    example: '2026-06-03T08:00:00.000Z',
    description: '서버 기준 현재 시각. 클라이언트는 동기화 성공 후 이 값을 저장합니다.',
  })
  serverTime: Date;

  @ApiProperty({ type: SyncSectionChangesEntity })
  sections: SyncSectionChangesEntity;

  @ApiProperty({ type: SyncReminderChangesEntity })
  reminders: SyncReminderChangesEntity;
}
