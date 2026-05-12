import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
