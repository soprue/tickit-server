import { Injectable, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
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
      const salt = await bcrypt.genSalt();
      hashedPassword = await bcrypt.hash(password, salt);
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
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
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
}
