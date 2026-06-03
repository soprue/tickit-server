import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { SyncService } from './sync.service';

describe('SyncService', () => {
  let service: SyncService;

  const mockPrismaService = {
    section: {
      findMany: jest.fn(),
    },
    reminder: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('since 이후 변경/삭제된 현재 사용자 데이터만 조회해야 함', async () => {
    const since = '2026-06-03T00:00:00.000Z';
    const changedSection = {
      id: 'section-id',
      title: 'Inbox',
      isFixed: false,
      userId: 1,
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-03T01:00:00.000Z'),
      deletedAt: null,
    };
    const deletedReminder = {
      id: 1,
      text: 'Milk',
      time: null,
      isAllDay: false,
      notified: false,
      done: false,
      lastResetDate: null,
      sectionId: 'section-id',
      createdAt: new Date('2026-06-01T00:00:00.000Z'),
      updatedAt: new Date('2026-06-02T00:00:00.000Z'),
      deletedAt: new Date('2026-06-03T02:00:00.000Z'),
    };

    mockPrismaService.section.findMany
      .mockResolvedValueOnce([changedSection])
      .mockResolvedValueOnce([]);
    mockPrismaService.reminder.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([deletedReminder]);

    const result = await service.pull(1, since);

    expect(result.serverTime).toBeInstanceOf(Date);
    expect(result.sections.changed).toEqual([changedSection]);
    expect(result.sections.deleted).toEqual([]);
    expect(result.reminders.changed).toEqual([]);
    expect(result.reminders.deleted).toEqual([deletedReminder]);
    expect(mockPrismaService.section.findMany).toHaveBeenNthCalledWith(1, {
      where: {
        userId: 1,
        deletedAt: null,
        updatedAt: { gt: new Date(since) },
      },
      orderBy: { updatedAt: 'asc' },
    });
    expect(mockPrismaService.section.findMany).toHaveBeenNthCalledWith(2, {
      where: {
        userId: 1,
        deletedAt: { gt: new Date(since) },
      },
      orderBy: { deletedAt: 'asc' },
    });
    expect(mockPrismaService.reminder.findMany).toHaveBeenNthCalledWith(1, {
      where: {
        deletedAt: null,
        updatedAt: { gt: new Date(since) },
        section: {
          userId: 1,
        },
      },
      orderBy: { updatedAt: 'asc' },
    });
    expect(mockPrismaService.reminder.findMany).toHaveBeenNthCalledWith(2, {
      where: {
        deletedAt: { gt: new Date(since) },
        section: {
          userId: 1,
        },
      },
      orderBy: { deletedAt: 'asc' },
    });
  });

  it('since가 없으면 삭제되지 않은 전체 데이터를 조회하고 삭제 목록은 비워야 함', async () => {
    mockPrismaService.section.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    mockPrismaService.reminder.findMany
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    await service.pull(1);

    expect(mockPrismaService.section.findMany).toHaveBeenNthCalledWith(1, {
      where: {
        userId: 1,
        deletedAt: null,
      },
      orderBy: { updatedAt: 'asc' },
    });
    expect(mockPrismaService.reminder.findMany).toHaveBeenNthCalledWith(1, {
      where: {
        deletedAt: null,
        section: {
          userId: 1,
        },
      },
      orderBy: { updatedAt: 'asc' },
    });
    expect(mockPrismaService.section.findMany).toHaveBeenCalledTimes(1);
    expect(mockPrismaService.reminder.findMany).toHaveBeenCalledTimes(1);
  });
});
