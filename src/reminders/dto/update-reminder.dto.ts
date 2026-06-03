import { PartialType, ApiProperty, OmitType } from '@nestjs/swagger';
import { CreateReminderDto } from './create-reminder.dto';
import { IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class UpdateReminderDto extends PartialType(
  OmitType(CreateReminderDto, ['time'] as const),
) {
  @ApiProperty({
    description:
      '알림 시간. 생략하면 기존 값을 유지하고, null을 보내면 알림 시간이 제거됩니다.',
    example: '2026-05-15T10:00:00Z',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  time?: string | null;

  @ApiProperty({ description: '완료 여부', required: false })
  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @ApiProperty({ description: '알림 발송 여부', required: false })
  @IsOptional()
  @IsBoolean()
  notified?: boolean;
}
