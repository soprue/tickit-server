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
    description: '서버의 리프레시 토큰을 무효화하여 로그아웃 처리합니다.',
  })
  @ApiResponse({ status: 200, description: '로그아웃 성공' })
  async logout(@GetUser('id') userId: number) {
    await this.authService.logout(userId);
    return { message: '로그아웃 되었습니다.' };
  }

  @Post('refresh')
  @ApiOperation({
    summary: '액세스 토큰 갱신',
    description:
      '리프레시 토큰을 사용하여 새로운 액세스 토큰과 리프레시 토큰을 발급받습니다.',
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
  async refresh(
    @Body('refresh_token') refreshToken: string,
    @Body('userId') userId: number,
  ) {
    return await this.authService.refreshTokens(userId, refreshToken);
  }

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
    description:
      '구글 로그인 성공 후 리다이렉트되어 앱(Deep Link)으로 데이터를 전달합니다.',
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

    // 인증 완료 HTML 페이지 반환 (보안 및 자동 실행 보강 버전)
    res.send(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>로그인 완료 | Tickit</title>
          <style>
              :root {
                  --color-bg: #f4f4f5;
                  --color-text: #18181b;
                  --color-muted: #71717a;
                  --color-accent: #e54c32;
              }
              body {
                  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  background-color: var(--color-bg);
                  color: var(--color-text);
              }
              .ticket {
                  background: white;
                  padding: 54px 40px;
                  border-radius: 28px;
                  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.05);
                  text-align: center;
                  max-width: 340px;
                  width: 85%;
                  position: relative;
                  border: 1px solid rgba(0, 0, 0, 0.03);
              }
              .ticket::before, .ticket::after {
                  content: '';
                  position: absolute;
                  top: 50%;
                  width: 20px;
                  height: 20px;
                  background-color: var(--color-bg);
                  border-radius: 50%;
                  transform: translateY(-50%);
              }
              .ticket::before { left: -10px; }
              .ticket::after { right: -10px; }
              .logo-wrapper {
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 86px;
                  height: 86px;
                  margin: 0 auto 32px;
              }
              h1 {
                  margin: 0 0 12px;
                  font-size: 24px;
                  font-weight: 800;
                  letter-spacing: -0.04em;
              }
              p {
                  color: var(--color-muted);
                  font-size: 15px;
                  font-weight: 500;
                  line-height: 1.6;
                  margin-bottom: 32px;
              }
              .btn {
                  display: block;
                  background: var(--color-text);
                  color: white;
                  padding: 18px;
                  border-radius: 18px;
                  text-decoration: none;
                  font-weight: 700;
                  font-size: 16px;
                  transition: all 0.2s ease;
              }
              .btn:hover {
                  transform: translateY(-2px);
                  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                  opacity: 0.95;
              }
              .btn:active {
                  transform: translateY(0);
              }
          </style>
      </head>
      <body>
          <div class="ticket">
              <div class="logo-wrapper">
                  <svg viewBox="0 0 169 169" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 0 C8.25776947 6.78803803 13.82664627 15.23765514 16.12890625 25.75 C17.0226498 40.53339748 15.45373671 51.73243775 6.12890625 63.75 C3.75390625 66.3125 3.75390625 66.3125 2.12890625 67.75 C2.74765625 69.5753125 2.74765625 69.5753125 3.37890625 71.4375 C3.96515808 73.20736928 4.54814821 74.97832041 5.12890625 76.75 C5.46535156 77.77480469 5.80179688 78.79960938 6.1484375 79.85546875 C6.49261719 80.93441406 6.83679688 82.01335937 7.19140625 83.125 C7.67287109 84.62160156 7.67287109 84.62160156 8.1640625 86.1484375 C14.31706336 109.11631924 12.2204457 133.26257246 2.12890625 154.75 C1.46890625 156.4 0.80890625 158.05 0.12890625 159.75 C-50.03109375 159.75 -100.19109375 159.75 -151.87109375 159.75 C-152.01546875 139.90875 -152.15984375 120.0675 -152.30859375 99.625 C-152.37232178 93.36257324 -152.4360498 87.10014648 -152.50170898 80.64794922 C-152.5333252 72.99438477 -152.5333252 72.99438477 -152.53919983 69.41018677 C-152.54994158 66.90952843 -152.57454664 64.40890612 -152.61012268 61.90847778 C-152.66135427 58.11787042 -152.66843673 54.32947584 -152.66577148 50.53857422 C-152.69095824 49.42659101 -152.716145 48.31460781 -152.74209499 47.16892815 C-152.67278 39.80613744 -152.67278 39.80613744 -150.36476326 36.76556778 C-148.6030299 35.22814832 -146.85976508 33.97399022 -144.87109375 32.75 C-143.88109375 32.04875 -142.89109375 31.3475 -141.87109375 30.625 C-124.65045491 19.86210072 -106.77813531 14.5744463 -86.43359375 14.5625 C-84.79293945 14.54413086 -84.79293945 14.54413086 -83.11914062 14.52539062 C-77.00378639 14.51434543 -71.72351474 14.9508961 -65.87109375 16.75 C-65.49984375 15.4196875 -65.49984375 15.4196875 -65.12109375 14.0625 C-61.34406947 4.05338566 -51.95870137 -2.02501591 -42.61328125 -6.27734375 C-28.25082357 -11.559807 -12.2498542 -8.76554862 0 0 Z" fill="#291817" transform="translate(151.87109375,9.25)"/><path d="M0 0 C9.4415885 6.75605617 15.81456373 15.90667797 18.3125 27.3125 C19.29044311 43.48864087 16.89296956 55.2610928 6.125 67.875 C4.3125 69.3125 4.3125 69.3125 1.3125 69.3125 C-0.046875 67.44140625 -0.046875 67.44140625 -1.4375 64.875 C-4.43415369 59.61784329 -7.87982791 55.00166181 -11.6875 50.3125 C-12.43 49.3225 -13.1725 48.3325 -13.9375 47.3125 C-26.32640786 32.80548854 -45.34463731 23.48348686 -63.6875 19.3125 C-62.61126783 11.64434577 -57.17227228 6.28815561 -51.375 1.5 C-46.83142928 -1.85321743 -42.04640564 -3.96598627 -36.6875 -5.6875 C-35.80191406 -5.97560547 -35.80191406 -5.97560547 -34.8984375 -6.26953125 C-22.403 -8.63174293 -10.79435066 -6.5792392 0 0 Z" fill="#EEEBEA" transform="translate(149.6875,7.6875)"/><path d="M0 0 C27.07802049 5.90531298 47.82955816 20.98148304 63 44 C66 48.71330275 66 48.71330275 66 51 C66.66 51.33 67.32 51.66 68 52 C66.50553137 52.94629264 65.00405802 53.88152432 63.5 54.8125 C62.24703125 55.59560547 62.24703125 55.59560547 60.96875 56.39453125 C54.39680235 59.94857136 48.73225265 61.54113904 41.25 61.4375 C40.46359131 61.42847656 39.67718262 61.41945312 38.86694336 61.41015625 C26.99070738 61.06024771 17.86895174 56.90743108 9 49 C6.72322085 46.47695698 4.81469221 43.86858563 3 41 C2.443125 40.195625 1.88625 39.39125 1.3125 38.5625 C-5.06953849 26.10232962 -4.11006316 13.13752331 0 0 Z" fill="#E54C32" transform="translate(85,26)"/></svg>
              </div>
              <h1>로그인 성공!</h1>
              <p>인증이 완료되었습니다.<br>아래 버튼을 눌러 앱으로 돌아가세요.</p>
              <a href="${redirectUrl}" class="btn">앱으로 돌아가기</a>
          </div>
          <script>
              // 1. 자동 리다이렉트 시도
              window.location.href = ${JSON.stringify(redirectUrl)};
              
              // 2. 브라우저 정책으로 차단될 경우를 대비해 3초 뒤에 한 번 더 시도
              setTimeout(() => { 
                  window.location.href = ${JSON.stringify(redirectUrl)}; 
              }, 3000);
          </script>
      </body>
      </html>
    `);
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
    description:
      '이메일과 비밀번호로 로그인하여 JWT 액세스 토큰을 발급받습니다.',
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
