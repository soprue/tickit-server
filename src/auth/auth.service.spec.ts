import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from './password.service';
import { ConflictException } from '@nestjs/common';

const mockUsersService = {
  findOneByEmail: jest.fn(),
  createWithDefaultSections: jest.fn(),
  upsertByEmail: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
};

const mockPasswordService = {
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PasswordService, useValue: mockPasswordService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword';
      const user = { id: 1, email, password: hashedPassword };

      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockPasswordService.hashPassword.mockResolvedValue(hashedPassword);
      mockUsersService.createWithDefaultSections.mockResolvedValue(user);

      const result = await service.register(email, password);

      expect(result).toEqual(user);
      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(email);
      expect(mockPasswordService.hashPassword).toHaveBeenCalledWith(password);
      expect(mockUsersService.createWithDefaultSections).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      const email = 'test@example.com';
      mockUsersService.findOneByEmail.mockResolvedValue({ id: 1, email });

      await expect(service.register(email, 'password')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('validateUser', () => {
    it('should return user without password if validation succeeds', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const user = { id: 1, email, password: 'hashedPassword' };

      mockUsersService.findOneByEmail.mockResolvedValue(user);
      mockPasswordService.comparePassword.mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(result).toEqual({ id: 1, email });
      expect(result).not.toHaveProperty('password');
    });

    it('should return null if validation fails', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);
      const result = await service.validateUser('test@example.com', 'pass');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return an access token', async () => {
      const user = { id: 1, email: 'test@example.com' };
      const token = 'jwtToken';
      mockJwtService.signAsync.mockResolvedValue(token);

      const result = await service.login(user);

      expect(result).toEqual({ access_token: token });
      expect(mockJwtService.signAsync).toHaveBeenCalled();
    });
  });

  describe('validateOAuthUser', () => {
    it('should call upsertByEmail', async () => {
      const profile = { email: 't@t.com', socialId: '123', provider: 'google' };
      mockUsersService.upsertByEmail.mockResolvedValue({ id: 1, ...profile });

      const result = await service.validateOAuthUser(profile);

      expect(result.id).toBe(1);
      expect(mockUsersService.upsertByEmail).toHaveBeenCalledWith(profile);
    });
  });
});
