import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PullSyncQueryDto } from './dto/pull-sync-query.dto';
import { PullSyncResponseEntity } from './entities/pull-sync-response.entity';
import { SyncService } from './sync.service';

@ApiTags('Sync (동기화)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get()
  @ApiOperation({
    summary: 'Pull Sync',
    description:
      '마지막 동기화 시각 이후 서버에서 변경되거나 삭제된 섹션과 리마인더를 조회합니다.',
  })
  @ApiResponse({ status: 200, type: PullSyncResponseEntity })
  async pull(
    @GetUser('id') userId: number,
    @Query() query: PullSyncQueryDto,
  ) {
    return this.syncService.pull(userId, query.since);
  }
}
