import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const user = await this.authService.register(
      registerDto.email,
      registerDto.password,
    );
    
    // 비밀번호는 제외하고 응답
    const { password, ...result } = user;
    return {
      success: true,
      message: '회원가입이 완료되었습니다.',
      data: result,
    };
  }
}
