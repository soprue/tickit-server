import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { EVERYDAY_SECTION_TITLE } from '../../common/constants/sections.constants';
import { EverydayReminderResetService } from './everyday-reminder-reset.service';

describe('EverydayReminderResetService', () => {
  let service: EverydayReminderResetService;

  const mockPrismaService = {
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    reminder: {
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    mockPrismaService.$transaction.mockImplementation((callback) =>
      callback(mockPrismaService),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EverydayReminderResetService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<EverydayReminderResetService>(
      EverydayReminderResetService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('Everyday 리마인더를 오늘 기준으로 리셋해야 함', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-31T15:30:00.000Z'));

    mockPrismaService.user.findUnique.mockResolvedValue({
      everydayLastResetDate: '2026-05-31',
    });
    mockPrismaService.user.updateMany.mockResolvedValue({ count: 1 });
    mockPrismaService.reminder.updateMany.mockResolvedValue({ count: 2 });

    await service.resetIfNeeded(1);

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
          title: EVERYDAY_SECTION_TITLE,
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
  });

  it('오늘 이미 리셋했다면 리마인더 업데이트를 건너뛰어야 함', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-31T15:30:00.000Z'));

    mockPrismaService.user.findUnique.mockResolvedValue({
      everydayLastResetDate: '2026-06-01',
    });

    await service.resetIfNeeded(1);

    expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    expect(mockPrismaService.user.updateMany).not.toHaveBeenCalled();
    expect(mockPrismaService.reminder.updateMany).not.toHaveBeenCalled();
  });
});
