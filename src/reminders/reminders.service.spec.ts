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
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    reminder: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
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
    mockPrismaService.$transaction.mockImplementation((callback) =>
      callback(mockPrismaService),
    );
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
      mockPrismaService.reminder.create.mockRejectedValue(
        new Error('Prisma error'),
      );

      await expect(
        service.create(1, { text: 'Test', sectionId: 'wrong' }),
      ).rejects.toThrow(UnauthorizedSectionException);
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );
    });

    it('Everyday 리마인더를 조회 전에 오늘 기준으로 리셋해야 함', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-05-31T15:30:00.000Z'));

      mockPrismaService.user.findUnique.mockResolvedValue({
        everydayLastResetDate: '2026-05-31',
      });
      mockPrismaService.user.updateMany.mockResolvedValue({ count: 1 });
      mockPrismaService.reminder.updateMany.mockResolvedValue({ count: 2 });
      mockPrismaService.reminder.findMany.mockResolvedValue([]);

      await service.findAll(1, {});

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { everydayLastResetDate: true },
      });
      expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
        where: {
          id: 1,
          OR: [
            { everydayLastResetDate: null },
            { everydayLastResetDate: { not: '2026-06-01' } },
          ],
        },
        data: { everydayLastResetDate: '2026-06-01' },
      });
      expect(mockPrismaService.reminder.updateMany).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          section: {
            userId: 1,
            title: 'Everyday',
            isFixed: true,
            deletedAt: null,
          },
        },
        data: {
          done: false,
          notified: false,
          lastResetDate: '2026-06-01',
        },
      });
      expect(mockPrismaService.reminder.findMany).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('오늘 이미 리셋했다면 리마인더 업데이트를 건너뛰어야 함', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-05-31T15:30:00.000Z'));

      mockPrismaService.user.findUnique.mockResolvedValue({
        everydayLastResetDate: '2026-06-01',
      });
      mockPrismaService.reminder.findMany.mockResolvedValue([]);

      await service.findAll(1, {});

      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
      expect(mockPrismaService.user.updateMany).not.toHaveBeenCalled();
      expect(mockPrismaService.reminder.updateMany).not.toHaveBeenCalled();
      expect(mockPrismaService.reminder.findMany).toHaveBeenCalled();

      jest.useRealTimers();
    });
  });

  describe('update', () => {
    it('다른 사람의 섹션으로 이동하려 하면 UnauthorizedSectionException을 던져야 함', async () => {
      mockSectionsService.findOne.mockRejectedValue(
        new SectionNotFoundException(),
      );

      await expect(
        service.update(1, 1, { sectionId: 'other-uuid' }),
      ).rejects.toThrow(SectionNotFoundException);
    });

    it('자신의 리마인더를 수정해야 함', async () => {
      const updateDto = { text: 'Updated' };
      mockPrismaService.reminder.update.mockResolvedValue({
        id: 1,
        ...updateDto,
      });

      await service.update(1, 1, updateDto);

      expect(mockPrismaService.reminder.update).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null, section: { userId: 1 } },
        data: expect.objectContaining(updateDto),
      });
    });

    it('리마인더 알림 발송 여부를 수정해야 함', async () => {
      const updateDto = { notified: true };
      mockPrismaService.reminder.update.mockResolvedValue({
        id: 1,
        ...updateDto,
      });

      await service.update(1, 1, updateDto);

      expect(mockPrismaService.reminder.update).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null, section: { userId: 1 } },
        data: expect.objectContaining(updateDto),
      });
    });
  });

  describe('remove', () => {
    it('리마인더를 소프트 삭제해야 함 (최적화 버전)', async () => {
      mockPrismaService.reminder.update.mockResolvedValue({
        id: 1,
        deletedAt: new Date(),
      });

      await service.remove(1, 1);

      expect(mockPrismaService.reminder.update).toHaveBeenCalledWith({
        where: { id: 1, deletedAt: null, section: { userId: 1 } },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
