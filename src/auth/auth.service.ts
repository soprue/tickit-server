import { Injectable, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PasswordService } from './password.service';

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

    return await this.usersService.createWithDefaultSections({
      email,
      password: hashedPassword,
      socialId,
      provider,
    });
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
   * 검증된 사용자 정보를 바탕으로 JWT 액세스 토큰을 생성합니다.
   * @param user 이메일과 ID를 포함한 사용자 정보
   * @returns access_token이 포함된 객체
   */
  async login(user: { email: string; id: number }) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
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
    return await this.usersService.upsertByEmail({
      email: profile.email,
      socialId: profile.socialId,
      provider: profile.provider,
    });
  }
}
