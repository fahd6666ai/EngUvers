import { EntitlementsService } from './entitlements.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EntitlementsService', () => {
  let service: EntitlementsService;
  let prisma: {
    plan: { findUniqueOrThrow: jest.Mock };
    entitlement: { create: jest.Mock; findMany: jest.Mock };
    planLimit: { findFirst: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      plan: { findUniqueOrThrow: jest.fn() },
      entitlement: { create: jest.fn(), findMany: jest.fn() },
      planLimit: { findFirst: jest.fn() },
    };
    service = new EntitlementsService(prisma as unknown as PrismaService);
  });

  it('grantPlan resolves the plan by code and creates an active entitlement', async () => {
    prisma.plan.findUniqueOrThrow.mockResolvedValue({ id: 'plan1' });
    prisma.entitlement.create.mockResolvedValue({ id: 'ent1' });

    await service.grantPlan('u1', 'student_pro', 'voucher');

    expect(prisma.plan.findUniqueOrThrow).toHaveBeenCalledWith({ where: { code: 'student_pro' } });
    expect(prisma.entitlement.create).toHaveBeenCalledWith({
      data: { userId: 'u1', planId: 'plan1', source: 'voucher', endsAt: undefined, status: 'active' },
    });
  });

  it('can() is false with no active entitlements', async () => {
    prisma.entitlement.findMany.mockResolvedValue([]);
    await expect(service.can('u1', 'circuit_lab.esp32')).resolves.toBe(false);
    expect(prisma.planLimit.findFirst).not.toHaveBeenCalled();
  });

  it('can() is false when no active plan declares the feature', async () => {
    prisma.entitlement.findMany.mockResolvedValue([{ planId: 'free-plan' }]);
    prisma.planLimit.findFirst.mockResolvedValue(null);
    await expect(service.can('u1', 'circuit_lab.esp32')).resolves.toBe(false);
  });

  it('can() is true when an active plan declares the feature', async () => {
    prisma.entitlement.findMany.mockResolvedValue([{ planId: 'pro-plan' }]);
    prisma.planLimit.findFirst.mockResolvedValue({ id: 'limit1' });
    await expect(service.can('u1', 'circuit_lab.esp32')).resolves.toBe(true);
  });
});
