import { BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: { update: jest.Mock; findUnique: jest.Mock };
    country: { findUnique: jest.Mock };
    profile: { upsert: jest.Mock };
  };

  beforeEach(() => {
    prisma = {
      user: { update: jest.fn(), findUnique: jest.fn() },
      country: { findUnique: jest.fn() },
      profile: { upsert: jest.fn() },
    };
    service = new UsersService(prisma as unknown as PrismaService);
  });

  describe('getMe', () => {
    it('never leaks passwordHash', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        passwordHash: 'super-secret-hash',
        profile: null,
        country: null,
      });

      const result = await service.getMe('u1');

      expect(result).not.toHaveProperty('passwordHash');
      expect(result).toEqual({ id: 'u1', email: 'a@b.com', profile: null, country: null });
    });
  });

  describe('completeOnboarding', () => {
    it('clears academic fields on the generic-browse path', async () => {
      prisma.profile.upsert.mockResolvedValue({ id: 'p1' });
      await service.completeOnboarding('u1', { browseGenerally: true });

      expect(prisma.country.findUnique).not.toHaveBeenCalled();
      expect(prisma.profile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { universityId: null, majorId: null, studyYear: null },
        }),
      );
    });

    it('rejects a missing countryCode outside the generic-browse path', async () => {
      await expect(service.completeOnboarding('u1', {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects an unknown countryCode', async () => {
      prisma.country.findUnique.mockResolvedValue(null);
      await expect(
        service.completeOnboarding('u1', { countryCode: 'ZZ' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sets the user country and profile academic fields', async () => {
      prisma.country.findUnique.mockResolvedValue({ id: 'c1', code: 'SA' });
      prisma.user.update.mockResolvedValue({});
      prisma.profile.upsert.mockResolvedValue({ id: 'p1' });

      await service.completeOnboarding('u1', {
        countryCode: 'SA',
        universityId: 'uni1',
        majorId: 'maj1',
        studyYear: 2,
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { countryId: 'c1' },
      });
      expect(prisma.profile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { universityId: 'uni1', majorId: 'maj1', studyYear: 2 },
        }),
      );
    });
  });
});
