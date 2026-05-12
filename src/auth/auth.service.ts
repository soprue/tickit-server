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

    return await this.usersService.createWithDefaultSections({
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
    return await this.usersService.upsertByEmail({
      email: profile.email,
      socialId: profile.socialId,
      provider: profile.provider,
    });
  }
}
