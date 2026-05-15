import { IsOptional, IsInt, Min, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: '가져올 데이터의 최대 개수 (기본값: 20)',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  take?: number = 20;

  @ApiPropertyOptional({
    description: '마지막으로 조회한 데이터의 ID (Cursor)',
    example: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cursor?: number;

  @ApiPropertyOptional({
    description: '특정 섹션으로 필터링',
    example: 'uuid-string',
  })
  @IsOptional()
  @IsString()
  sectionId?: string;
}
