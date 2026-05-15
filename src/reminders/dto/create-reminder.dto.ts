import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReminderDto {
  @ApiProperty({ description: '리마인더 내용', example: '우유 사기' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: '알림 시간',
    example: '2026-05-15T10:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  time?: string;

  @ApiProperty({ description: '하루 종일 여부', default: false })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiProperty({
    description: '소속 섹션 ID',
    example: 'uuid-string',
  })
  @IsUUID()
  @IsNotEmpty()
  sectionId: string;
}
