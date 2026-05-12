import { Injectable, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async register(email: string, password?: string, socialId?: string, provider = 'local') {
    // 1. 이미 존재하는 이메일인지 확인
    const existingUser = await this.usersService.findOneByEmail(email);
    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다.');
    }

    // 2. 비밀번호 암호화 (일반 가입인 경우)
    let hashedPassword = null;
    if (password) {
      const salt = await bcrypt.genSalt();
      hashedPassword = await bcrypt.hash(password, salt);
    }

    // 3. 사용자 생성
    return this.usersService.create({
      email,
      password: hashedPassword,
      socialId,
      provider,
    });
  }
}
