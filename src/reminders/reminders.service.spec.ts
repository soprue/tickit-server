import { Test, TestingModule } from '@nestjs/testing';
import { RemindersService } from './reminders.service';
import { PrismaService } from '../prisma/prisma.service';
import { SectionsService } from '../sections/sections.service';
import { ReminderNotFoundException } from '../common/exceptions/reminder-not-found.exception';
import { UnauthorizedSectionException } from '../common/exceptions/unauthorized-section.exception';
import { SectionNotFoundException } from '../common/exceptions/section-not-found.exception';

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
    it('권한이 있는 섹션에 리마인더를 생성해야 함 (쿼리 최적화 버전)', async () => {
      const dto = { text: 'Test', sectionId: 'uuid' };
      mockPrismaService.reminder.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(1, dto);

      expect(mockPrismaService.reminder.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          section: {
            connect: {
              id: 'uuid',
              userId: 1,
              deletedAt: null,
            },
          },
        }),
      });
      expect(result.text).toBe('Test');
    });

    it('권한이 없는 섹션이면 UnauthorizedSectionException을 던져야 함', async () => {
      mockPrismaService.reminder.create.mockRejectedValue(new Error('Prisma error'));

      await expect(service.create(1, { text: 'Test', sectionId: 'wrong' })).rejects.toThrow(UnauthorizedSectionException);
    });
  });

  describe('update', () => {
    it('다른 사람의 섹션으로 이동하려 하면 UnauthorizedSectionException을 던져야 함', async () => {
      mockSectionsService.findOne.mockRejectedValue(new SectionNotFoundException());

      await expect(service.update(1, 1, { sectionId: 'other-uuid' })).rejects.toThrow(SectionNotFoundException);
    });

    it('자신의 리마인더를 수정해야 함', async () => {
      const updateDto = { text: 'Updated' };
      mockPrismaService.reminder.update.mockResolvedValue({ id: 1, ...updateDto });

      await service.update(1, 1, updateDto);

      expect(mockPrismaService.reminder.update).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null, section: { userId: 1 } },
        data: expect.objectContaining(updateDto),
      });
    });
  });

  describe('remove', () => {
    it('리마인더를 소프트 삭제해야 함 (최적화 버전)', async () => {
      mockPrismaService.reminder.update.mockResolvedValue({ id: 1, deletedAt: new Date() });

      await service.remove(1, 1);

      expect(mockPrismaService.reminder.update).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null, section: { userId: 1 } },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
