import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSectionDto {
  @ApiProperty({ description: '섹션 제목', example: '공부 기록' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title: string;
}
