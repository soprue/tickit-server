import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PasswordService } from './password.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

const mockUsersService = {
  findOneByEmail: jest.fn(),
  findOneById: jest.fn(),
  createWithDefaultSections: jest.fn(),
  upsertByEmail: jest.fn(),
  updateRefreshToken: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
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
    });

    it('should throw ConflictException if email already exists', async () => {
      const email = 'test@example.com';
      mockUsersService.findOneByEmail.mockResolvedValue({ id: 1, email });

      await expect(service.register(email, 'password')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if email is created concurrently', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword';
      const uniqueEmailError = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`email`)',
        {
          code: 'P2002',
          clientVersion: 'test',
          meta: { target: ['email'] },
        },
      );

      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockPasswordService.hashPassword.mockResolvedValue(hashedPassword);
      mockUsersService.createWithDefaultSections.mockRejectedValue(
        uniqueEmailError,
      );

      await expect(service.register(email, password)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should rethrow non-email create errors during register', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const error = new Error('database unavailable');

      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockPasswordService.hashPassword.mockResolvedValue('hashedPassword');
      mockUsersService.createWithDefaultSections.mockRejectedValue(error);

      await expect(service.register(email, password)).rejects.toThrow(error);
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      const user = { id: 1, email: 'test@example.com' };
      const accessToken = 'accessToken';
      const refreshToken = 'refreshToken';
      const hashedRefreshToken = 'hashedRefreshToken';

      mockJwtService.signAsync
        .mockResolvedValueOnce(accessToken)
        .mockResolvedValueOnce(refreshToken);
      mockPasswordService.hashPassword.mockResolvedValue(hashedRefreshToken);
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.login(user);

      expect(result).toEqual({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(
        user.id,
        hashedRefreshToken,
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens if refresh token is valid', async () => {
      const userId = 1;
      const refreshToken = 'validRefreshToken';
      const user = {
        id: userId,
        email: 'test@example.com',
        refreshToken: 'hashedRefreshToken',
      };

      mockJwtService.verifyAsync.mockResolvedValue({
        sub: userId,
        email: user.email,
      });
      mockUsersService.findOneById.mockResolvedValue(user);
      mockPasswordService.comparePassword.mockResolvedValue(true);

      // login 메서드가 내부적으로 호출되므로 mock 설정
      mockJwtService.signAsync.mockResolvedValue('token');
      mockPasswordService.hashPassword.mockResolvedValue('hashed');

      const result = await service.refreshTokens(refreshToken);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(refreshToken);
      expect(mockUsersService.findOneById).toHaveBeenCalledWith(userId);
      expect(mockPasswordService.comparePassword).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if refresh token jwt is invalid', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.refreshTokens('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );

      expect(mockUsersService.findOneById).not.toHaveBeenCalled();
      expect(mockPasswordService.comparePassword).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 1,
        email: 'test@example.com',
      });
      mockUsersService.findOneById.mockResolvedValue(null);
      await expect(service.refreshTokens('token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should nullify refresh token', async () => {
      const userId = 1;
      mockUsersService.updateRefreshToken.mockResolvedValue(undefined);

      await service.logout(userId);

      expect(mockUsersService.updateRefreshToken).toHaveBeenCalledWith(
        userId,
        null,
      );
    });
  });
});
