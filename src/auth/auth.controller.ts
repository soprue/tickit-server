import { instanceToPlain } from 'class-transformer';
import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import type { Response as ExpressResponse } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UserEntity } from '../users/entities/user.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';
import { renderGoogleAuthRedirectPage } from './templates/google-auth-redirect.template';

interface GoogleRequest extends Request {
  user: {
    email: string;
    socialId: string;
    firstName?: string;
    lastName?: string;
    accessToken: string;
  };
}

@ApiTags('인증 (Auth)')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '로그아웃',
    description:
      '현재 사용자의 저장된 리프레시 토큰을 제거하여 이후 토큰 갱신을 막습니다.',
  })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout(@GetUser('id') userId: number) {
    await this.authService.logout(userId);
    return { message: '로그아웃 되었습니다.' };
  }

  @Post('refresh')
  @ApiOperation({
    summary: '토큰 갱신',
    description:
      '유효한 리프레시 토큰을 검증한 뒤 새 액세스 토큰과 리프레시 토큰을 발급하고, 서버에 저장된 리프레시 토큰 해시를 교체합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '토큰 갱신 성공',
    schema: {
      example: {
        success: true,
        data: {
          access_token: '...',
          refresh_token: '...',
        },
      },
    },
  })
  async refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshTokens(refreshTokenDto.refresh_token);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: '구글 로그인 페이지로 리다이렉트',
    description: '사용자를 구글 OAuth2 로그인 창으로 리다이렉트합니다.',
  })
  googleAuth() {
    // Passport Google strategy가 Google OAuth 화면으로 리다이렉트합니다.
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: '구글 로그인 콜백 처리',
    description:
      '구글 로그인 성공 후 사용자를 생성 또는 갱신하고, 앱 딥링크로 토큰과 사용자 정보를 전달하는 완료 페이지를 반환합니다.',
  })
  async googleAuthRedirect(
    @Req() req: GoogleRequest,
    @Res() res: ExpressResponse,
  ) {
    const user = await this.authService.validateOAuthUser({
      email: req.user.email,
      socialId: req.user.socialId,
      provider: 'google',
    });

    const { access_token, refresh_token } = await this.authService.login({
      email: user.email,
      id: user.id,
    });

    const userEntity = new UserEntity(user);
    const userData = encodeURIComponent(
      JSON.stringify(instanceToPlain(userEntity)),
    );
    const redirectUrl = `tickit://auth?access_token=${access_token}&refresh_token=${refresh_token}&user=${userData}`;

    res.send(renderGoogleAuthRedirectPage(redirectUrl));
  }

  @Post('register')
  @ApiOperation({
    summary: '이메일 회원가입',
    description:
      '이메일과 비밀번호로 계정을 생성하고 기본 섹션을 함께 생성합니다.',
  })
  @ApiResponse({
    status: 201,
    description: '회원가입 성공',
    type: UserEntity,
  })
  @ApiResponse({ status: 409, description: '이미 존재하는 이메일' })
  @ApiResponse({ status: 400, description: '잘못된 입력 데이터' })
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(
      registerDto.email,
      registerDto.password,
    );

    return {
      message: '회원가입이 완료되었습니다.',
      user: new UserEntity(user),
    };
  }

  @Post('login')
  @ApiOperation({
    summary: '이메일 로그인',
    description:
      '이메일과 비밀번호를 검증하고 액세스 토큰과 리프레시 토큰을 발급합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '로그인 성공',
    schema: {
      example: {
        success: true,
        data: {
          message: '로그인에 성공했습니다.',
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: 1,
            email: 'user@example.com',
            provider: 'local',
            createdAt: '2024-05-12T00:00:00.000Z',
            updatedAt: '2024-05-12T00:00:00.000Z',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '이메일 또는 비밀번호 불일치' })
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException(
        '이메일 또는 비밀번호가 일치하지 않습니다.',
      );
    }

    const { access_token, refresh_token } = await this.authService.login({
      email: user.email as string,
      id: user.id as number,
    });

    return {
      message: '로그인에 성공했습니다.',
      access_token,
      refresh_token,
      user: new UserEntity(user),
    };
  }
}
