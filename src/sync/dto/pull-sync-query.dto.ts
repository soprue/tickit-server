import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class PullSyncQueryDto {
  @ApiPropertyOptional({
    description:
      '마지막으로 성공한 동기화 시각. 생략하면 삭제되지 않은 전체 데이터를 반환합니다.',
    example: '2026-06-03T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  since?: string;
}
