import { Test, TestingModule } from '@nestjs/testing';
import { SectionsService } from './sections.service';
import { PrismaService } from '../prisma/prisma.service';
import { SectionNotFoundException } from '../common/exceptions/section-not-found.exception';
import { FixedSectionException } from '../common/exceptions/fixed-section.exception';

describe('SectionsService', () => {
  let service: SectionsService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    section: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    reminder: {
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SectionsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SectionsService>(SectionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('섹션이 존재하고 소유자가 일치하면 섹션을 반환해야 함', async () => {
      const mockSection = { id: 'uuid', userId: 1, deletedAt: null };
      mockPrismaService.section.findFirst.mockResolvedValue(mockSection);

      const result = await service.findOne(1, 'uuid');

      expect(result).toEqual(mockSection);
    });

    it('섹션이 없거나 소유자가 다르면 SectionNotFoundException을 던져야 함', async () => {
      mockPrismaService.section.findFirst.mockResolvedValue(null);

      await expect(service.findOne(1, 'uuid')).rejects.toThrow(SectionNotFoundException);
    });
  });

  describe('update', () => {
    it('고정 섹션을 수정하려고 하면 FixedSectionException을 던져야 함', async () => {
      const mockSection = { id: 'uuid', userId: 1, isFixed: true, deletedAt: null };
      mockPrismaService.section.findFirst.mockResolvedValue(mockSection);

      await expect(service.update(1, 'uuid', { title: 'New Title' })).rejects.toThrow(FixedSectionException);
    });

    it('일반 섹션은 성공적으로 수정되어야 함', async () => {
      const mockSection = { id: 'uuid', userId: 1, isFixed: false, deletedAt: null };
      mockPrismaService.section.findFirst.mockResolvedValue(mockSection);
      mockPrismaService.section.update.mockResolvedValue({ ...mockSection, title: 'Updated' });

      const result = await service.update(1, 'uuid', { title: 'Updated' });

      expect(result.title).toBe('Updated');
      expect(mockPrismaService.section.update).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('삭제 시 섹션과 하위 리마인더를 함께 소프트 삭제해야 함', async () => {
      const mockSection = {
        id: 'uuid',
        userId: 1,
        isFixed: false,
        deletedAt: null,
      };
      const deletedSection = { ...mockSection, deletedAt: new Date() };
      mockPrismaService.section.findFirst.mockResolvedValue(mockSection);
      mockPrismaService.section.update.mockResolvedValue(deletedSection);
      mockPrismaService.reminder.updateMany.mockResolvedValue({ count: 3 });
      mockPrismaService.$transaction.mockImplementation((callback) =>
        callback(mockPrismaService),
      );

      const result = await service.remove(1, 'uuid');

      expect(mockPrismaService.section.update).toHaveBeenCalledWith({
        where: { id: 'uuid' },
        data: { deletedAt: expect.any(Date) },
      });
      expect(mockPrismaService.reminder.updateMany).toHaveBeenCalledWith({
        where: {
          sectionId: 'uuid',
          deletedAt: null,
        },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toBe(deletedSection);
    });
  });
});
