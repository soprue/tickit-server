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

interface GoogleRequest extends Request {
  user: {
    email: string;
    socialId: string;
    firstName?: string;
    lastName?: string;
    accessToken: string;
  };
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // 구글 로그인 창으로 리다이렉트 (Passport가 처리)
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
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
      success: true,
      message: '구글 로그인에 성공했습니다.',
      data: {
        access_token,
        user,
      },
    };
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(
      registerDto.email,
      registerDto.password,
    );

    const result: Partial<typeof user> = { ...user };
    delete result.password;

    return {
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: result,
    };
  }

  @Post('login')
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
      success: true,
      message: '로그인에 성공했습니다.',
      data: {
        access_token,
        user,
      },
    };
  }
}
