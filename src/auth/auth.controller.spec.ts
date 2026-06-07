import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    validateUser: jest.fn(),
    validateOAuthUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should return access and refresh tokens when credentials are valid', async () => {
      const loginDto = {
        email: 'user@example.com',
        password: 'Password123!',
      };
      const user = {
        id: 1,
        email: loginDto.email,
        provider: 'local',
        createdAt: new Date('2026-05-21T00:00:00.000Z'),
        updatedAt: new Date('2026-05-21T00:00:00.000Z'),
      };

      mockAuthService.validateUser.mockResolvedValue(user);
      mockAuthService.login.mockResolvedValue({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      });

      const result = await controller.login(loginDto);

      expect(mockAuthService.validateUser).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
      );
      expect(mockAuthService.login).toHaveBeenCalledWith({
        email: user.email,
        id: user.id,
      });
      expect(result).toMatchObject({
        message: '로그인에 성공했습니다.',
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: {
          id: user.id,
          email: user.email,
        },
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      await expect(
        controller.login({
          email: 'user@example.com',
          password: 'wrong-password',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(mockAuthService.login).not.toHaveBeenCalled();
    });
  });
});
