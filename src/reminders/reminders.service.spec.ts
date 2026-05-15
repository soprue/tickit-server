import { Test, TestingModule } from '@nestjs/testing';
import { RemindersService } from './reminders.service';
import { PrismaService } from '../prisma/prisma.service';
import { SectionsService } from '../sections/sections.service';
import { ReminderNotFoundException } from '../common/exceptions/reminder-not-found.exception';
import { UnauthorizedSectionException } from '../common/exceptions/unauthorized-section.exception';

describe('RemindersService', () => {
  let service: RemindersService;
  let sectionsService: SectionsService;

  const mockPrismaService = {
    reminder: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockSectionsService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RemindersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SectionsService,
          useValue: mockSectionsService,
        },
      ],
    }).compile();

    service = module.get<RemindersService>(RemindersService);
    sectionsService = module.get<SectionsService>(SectionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('권한이 있는 섹션에 리마인더를 생성해야 함', async () => {
      const dto = { text: 'Test', sectionId: 'uuid' };
      mockSectionsService.findOne.mockResolvedValue({ id: 'uuid', userId: 1 });
      mockPrismaService.reminder.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(1, dto);

      expect(sectionsService.findOne).toHaveBeenCalledWith(1, 'uuid');
      expect(result.text).toBe('Test');
    });
  });

  describe('update', () => {
    it('다른 사람의 섹션으로 이동하려 하면 UnauthorizedSectionException을 던져야 함', async () => {
      mockPrismaService.reminder.findFirst.mockResolvedValue({ id: 1, section: { userId: 1 } });
      mockSectionsService.findOne.mockRejectedValue(new Error());

      await expect(service.update(1, 1, { sectionId: 'other-uuid' })).rejects.toThrow(UnauthorizedSectionException);
    });
  });

  describe('remove', () => {
    it('리마인더를 소프트 삭제해야 함', async () => {
      mockPrismaService.reminder.findFirst.mockResolvedValue({ id: 1, section: { userId: 1 } });
      mockPrismaService.reminder.update.mockResolvedValue({ id: 1, deletedAt: new Date() });

      await service.remove(1, 1);

      expect(mockPrismaService.reminder.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
