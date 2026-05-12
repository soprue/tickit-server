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

    return await this.usersService.create({
      email,
      password: hashedPassword,
      socialId,
      provider,
    });
  }

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

  async login(user: { email: string; id: number }) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async validateOAuthUser(profile: {
    email: string;
    socialId: string;
    provider: string;
  }) {
    let user = await this.usersService.findOneByEmail(profile.email);

    if (!user) {
      // 유저가 없으면 새로 생성 (구글 가입)
      user = await this.usersService.create({
        email: profile.email,
        socialId: profile.socialId,
        provider: profile.provider,
      });
    } else if (user.provider !== profile.provider) {
      // 이메일은 같은데 가입 경로가 다른 경우 (예: 일반 가입 후 구글 로그인 시도)
      // 보안 정책에 따라 에러를 내거나, 계정을 연동할 수 있음. 여기서는 연동 처리.
      // 나중에 필요에 따라 업데이트 로직 추가 가능
    }

    return user;
  }
}
