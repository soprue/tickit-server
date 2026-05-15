import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_SECTIONS } from '../common/constants/sections.constants';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    section: {
      createMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createWithDefaultSections', () => {
    it('유저를 생성하고 기본 섹션들을 함께 생성해야 함 (트랜잭션)', async () => {
      const userData = { email: 'test@example.com', password: 'hashedPassword' };
      const mockUser = { id: 1, ...userData };

      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockPrismaService.section.createMany.mockResolvedValue({ count: 2 });

      const result = await service.createWithDefaultSections(userData);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({ data: userData });
      expect(mockPrismaService.section.createMany).toHaveBeenCalledWith({
        data: DEFAULT_SECTIONS.map((section) => ({
          ...section,
          userId: mockUser.id,
        })),
      });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findOneByEmail', () => {
    it('이메일로 유저를 찾아야 함', async () => {
      const email = 'test@example.com';
      const mockUser = { id: 1, email };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOneByEmail(email);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(result).toEqual(mockUser);
    });
  });
});
