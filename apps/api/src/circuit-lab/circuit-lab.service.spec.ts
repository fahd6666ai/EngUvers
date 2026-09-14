import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CircuitLabService } from './circuit-lab.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnavailableIseAnalysisProvider } from './ise-analysis/unavailable-ise-analysis.provider';

describe('CircuitLabService', () => {
  let service: CircuitLabService;
  let prisma: {
    circuitProject: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      circuitProject: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };
    service = new CircuitLabService(
      prisma as unknown as PrismaService,
      new JwtService({ secret: 'test-secret' }),
      new UnavailableIseAnalysisProvider(),
    );
  });

  describe('findOneOwned', () => {
    it('throws NotFoundException for a missing project', async () => {
      prisma.circuitProject.findUnique.mockResolvedValue(null);
      await expect(service.findOneOwned('p1', 'u1')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException for a project owned by someone else', async () => {
      prisma.circuitProject.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'someone-else' });
      await expect(service.findOneOwned('p1', 'u1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('returns the project when the owner matches', async () => {
      prisma.circuitProject.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'u1' });
      await expect(service.findOneOwned('p1', 'u1')).resolves.toEqual({ id: 'p1', ownerId: 'u1' });
    });
  });

  describe('update', () => {
    it('rejects updating a project owned by someone else', async () => {
      prisma.circuitProject.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'someone-else' });
      await expect(
        service.update('p1', 'u1', { vlxContent: { format: 'velxio-project' } }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.circuitProject.update).not.toHaveBeenCalled();
    });

    it('bumps version on a successful update', async () => {
      prisma.circuitProject.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'u1' });
      prisma.circuitProject.update.mockResolvedValue({ id: 'p1' });

      await service.update('p1', 'u1', { name: 'renamed' });

      expect(prisma.circuitProject.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { name: 'renamed', version: { increment: 1 } },
      });
    });
  });

  describe('issueSessionToken', () => {
    it('rejects issuing a token for a project owned by someone else', async () => {
      prisma.circuitProject.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'someone-else' });
      await expect(service.issueSessionToken('p1', 'u1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('issues a token scoped to the project for its owner', async () => {
      prisma.circuitProject.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'u1' });
      const result = await service.issueSessionToken('p1', 'u1');
      expect(typeof result.token).toBe('string');
    });
  });

  describe('explainProject', () => {
    it('rejects explaining a project owned by someone else', async () => {
      prisma.circuitProject.findUnique.mockResolvedValue({ id: 'p1', ownerId: 'someone-else' });
      await expect(service.explainProject('p1', 'u1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('delegates to the ISE analysis provider, which is unavailable until Phase 4', async () => {
      prisma.circuitProject.findUnique.mockResolvedValue({
        id: 'p1',
        ownerId: 'u1',
        vlxContent: {},
      });
      await expect(service.explainProject('p1', 'u1')).rejects.toThrow(
        /not configured yet/,
      );
    });
  });
});
