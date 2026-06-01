import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateReminderDto } from './create-reminder.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateReminderDto extends PartialType(CreateReminderDto) {
  @ApiProperty({ description: '완료 여부', required: false })
  @IsOptional()
  @IsBoolean()
  done?: boolean;

  @ApiProperty({ description: '알림 발송 여부', required: false })
  @IsOptional()
  @IsBoolean()
  notified?: boolean;
}
