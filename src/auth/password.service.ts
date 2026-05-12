import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordService {
  private readonly saltRounds = 10;

  /**
   * 평문 비밀번호를 bcrypt 알고리즘으로 해싱합니다.
   * @param password 해싱할 평문 비밀번호
   * @returns 해싱된 비밀번호 문자열
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return bcrypt.hash(password, salt);
  }

  /**
   * 평문 비밀번호와 해싱된 비밀번호가 일치하는지 비교합니다.
   * @param password 비교할 평문 비밀번호
   * @param hash 비교할 해싱된 비밀번호
   * @returns 일치 여부 (boolean)
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
