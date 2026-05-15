import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service';
import * as bcrypt from 'bcrypt';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hashPassword', () => {
    it('should successfully hash a password', async () => {
      const password = 'password123';
      const hash = await service.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(await bcrypt.compare(password, hash)).toBe(true);
    });
  });

  describe('comparePassword', () => {
    it('should return true for a matching password and hash', async () => {
      const password = 'password123';
      const hash = await bcrypt.hash(password, 10);
      const result = await service.comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for a non-matching password and hash', async () => {
      const password = 'password123';
      const hash = await bcrypt.hash('wrongPassword', 10);
      const result = await service.comparePassword(password, hash);

      expect(result).toBe(false);
    });
  });
});
