import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserEntity } from './entities/user.entity';

@ApiTags('사용자 (Users)')
@Controller('users')
export class UsersController {
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '현재 로그인한 사용자 프로필 조회',
    description: 'JWT 토큰을 사용하여 현재 인증된 사용자의 정보를 가져옵니다.',
  })
  @ApiResponse({
    status: 200,
    description: '프로필 조회 성공',
    type: UserEntity,
  })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  getProfile(@GetUser() user: UserEntity) {
    return new UserEntity(user);
  }
}
