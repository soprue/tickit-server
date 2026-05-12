import { Exclude } from 'class-transformer';
import { User } from '@prisma/client';

export class UserEntity implements User {
  id: number;
  email: string;

  @Exclude()
  password: string | null;

  provider: string;
  socialId: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }
}
