import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Prisma, User } from '@prisma/client';
import { PasswordService } from './password.service';

interface JwtPayload {
  sub: number;
  email: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private passwordService: PasswordService,
  ) {}

  /**
   * 새로운 사용자를 등록합니다.
   * @param email 사용자 이메일
   * @param password 사용자 비밀번호 (로컬 가입 시 필수)
   * @param socialId 소셜 로그인 고유 ID (소셜 가입 시)
   * @param provider 가입 경로 (default: 'local')
   * @returns 생성된 사용자 객체
   * @throws ConflictException 이미 존재하는 이메일일 경우
   */
  async register(
    email: string,
    password?: string,
    socialId?: string,
    provider = 'local',
  ): Promise<User> {
    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    let hashedPassword: string | null = null;
    if (password) {
      hashedPassword = await this.passwordService.hashPassword(password);
    }

    try {
      return await this.usersService.createWithDefaultSections({
        email,
        password: hashedPassword,
        socialId,
        provider,
      });
    } catch (error) {
      if (this.isUniqueEmailConflict(error)) {
        throw new ConflictException('이미 존재하는 이메일입니다.');
      }

      throw error;
    }
  }

  /**
   * 사용자 로그인을 위한 이메일과 비밀번호를 검증합니다.
   * @param email 사용자 이메일
   * @param pass 사용자 비밀번호
   * @returns 비밀번호가 제외된 사용자 정보 또는 null
   */
  async validateUser(
    email: string,
    pass: string,
  ): Promise<Partial<User> | null> {
    const user = await this.usersService.findOneByEmail(email);
    if (
      user &&
      user.password &&
      (await this.passwordService.comparePassword(pass, user.password))
    ) {
      const result: Partial<User> = { ...user };
      delete result.password;
      return result;
    }
    return null;
  }

  /**
   * 검증된 사용자 정보를 바탕으로 JWT 액세스 토큰과 리프레시 토큰을 생성합니다.
   * 리프레시 토큰은 보안을 위해 해싱하여 DB에 저장합니다.
   * @param user 이메일과 ID를 포함한 사용자 정보
   * @returns access_token과 refresh_token이 포함된 객체
   */
  async login(user: { email: string; id: number }) {
    const payload = { email: user.email, sub: user.id };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '1h', // 액세스 토큰은 짧게
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '14d', // 리프레시 토큰은 길게
      }),
    ]);

    // 리프레시 토큰을 해싱하여 DB에 저장
    const hashedRefreshToken =
      await this.passwordService.hashPassword(refreshToken);
    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  /**
   * 리프레시 토큰을 검증하고 새로운 액세스 토큰을 발급합니다.
   * @param refreshToken 클라이언트로부터 받은 리프레시 토큰
   * @returns 새로운 access_token과 refresh_token
   */
  async refreshTokens(refreshToken: string) {
    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken);
    } catch {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }

    const user = await this.usersService.findOneById(payload.sub);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('접근이 거부되었습니다.');
    }

    const isTokenMatching = await this.passwordService.comparePassword(
      refreshToken,
      user.refreshToken,
    );

    if (!isTokenMatching) {
      throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
    }

    // 새로운 토큰 세트 발급
    return this.login({ email: user.email, id: user.id });
  }

  /**
   * 로그아웃 시 사용자의 리프레시 토큰을 무효화합니다.
   * @param userId 사용자 ID
   */
  async logout(userId: number) {
    await this.usersService.updateRefreshToken(userId, null);
  }

  /**
   * OAuth(구글 등) 로그인 사용자를 검증하고 없으면 생성(Upsert)합니다.
   * @param profile 소셜 프로필 정보
   * @returns 사용자 객체
   */
  async validateOAuthUser(profile: {
    email: string;
    socialId: string;
    provider: string;
  }) {
    return this.usersService.upsertByEmail({
      email: profile.email,
      socialId: profile.socialId,
      provider: profile.provider,
    });
  }

  private isUniqueEmailConflict(error: unknown) {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      Array.isArray(error.meta?.target) &&
      error.meta.target.includes('email')
    );
  }
}
