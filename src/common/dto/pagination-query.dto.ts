import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: '가져올 데이터의 최대 개수. 기본값은 20, 최대값은 100입니다.',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  take?: number = 20;

  @ApiPropertyOptional({
    description: '마지막으로 조회한 리마인더 ID. 해당 ID 다음 항목부터 조회합니다.',
    example: 15,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  cursor?: number;

  @ApiPropertyOptional({
    description: '특정 섹션으로 필터링할 때 사용하는 섹션 ID',
    example: 'uuid-string',
  })
  @IsOptional()
  @IsString()
  sectionId?: string;
}
