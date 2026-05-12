import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Get,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserEntity } from '../users/entities/user.entity';

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

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: '구글 로그인 페이지로 리다이렉트',
    description: '사용자를 구글 OAuth2 로그인 창으로 리다이렉트합니다.',
  })
  googleAuth() {
    // 구글 로그인 창으로 리다이렉트 (Passport가 처리)
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({
    summary: '구글 로그인 콜백 처리',
    description: '구글 로그인 성공 후 리다이렉트되어 JWT를 발급받는 엔드포인트입니다.',
  })
  @ApiResponse({
    status: 200,
    description: '구글 로그인 성공 및 JWT 발급',
    schema: {
      example: {
        success: true,
        data: {
          message: '구글 로그인에 성공했습니다.',
          access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: 1,
            email: 'user@gmail.com',
            provider: 'google',
            socialId: '123456789',
            createdAt: '2024-05-12T00:00:00.000Z',
            updatedAt: '2024-05-12T00:00:00.000Z',
          },
        },
      },
    },
  })
  async googleAuthRedirect(@Req() req: GoogleRequest) {
    const user = await this.authService.validateOAuthUser({
      email: req.user.email,
      socialId: req.user.socialId,
      provider: 'google',
    });

    const { access_token } = await this.authService.login({
      email: user.email,
      id: user.id,
    });

    return {
      message: '구글 로그인에 성공했습니다.',
      access_token,
      user: new UserEntity(user),
    };
  }

  @Post('register')
  @ApiOperation({
    summary: '이메일 회원가입',
    description: '이메일과 비밀번호를 사용하여 새로운 계정을 생성합니다.',
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
    description: '이메일과 비밀번호로 로그인하여 JWT 액세스 토큰을 발급받습니다.',
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

    const { access_token } = await this.authService.login({
      email: user.email as string,
      id: user.id as number,
    });

    return {
      message: '로그인에 성공했습니다.',
      access_token,
      user: new UserEntity(user),
    };
  }
}
