import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSectionDto {
  @ApiProperty({
    description: '섹션 제목. 최대 50자까지 입력할 수 있습니다.',
    example: '공부 기록',
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title: string;
}
