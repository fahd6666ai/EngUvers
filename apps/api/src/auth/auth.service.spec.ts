import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock };
    phoneOtp: { create: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
  };
  let entitlements: { grantPlan: jest.Mock };
  let otpProvider: { send: jest.Mock };

  beforeEach(() => {
    prisma = {
      user: { findUnique: jest.fn(), create: jest.fn() },
      phoneOtp: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    };
    entitlements = { grantPlan: jest.fn() };
    otpProvider = { send: jest.fn() };

    service = new AuthService(
      prisma as unknown as PrismaService,
      new JwtService({ secret: 'test-secret' }),
      entitlements as unknown as EntitlementsService,
      otpProvider,
    );
  });

  describe('register', () => {
    it('rejects a duplicate email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      await expect(
        service.register({ email: 'a@b.com', password: 'password123' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates the user, grants the free plan, and returns a token', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        phone: null,
        role: 'student',
        locale: 'ar',
      });

      const result = await service.register({ email: 'a@b.com', password: 'password123' });

      expect(entitlements.grantPlan).toHaveBeenCalledWith('u1', 'free', 'subscription');
      expect(result.user).toEqual({ id: 'u1', email: 'a@b.com', phone: null, role: 'student', locale: 'ar' });
      expect(typeof result.accessToken).toBe('string');
    });
  });

  describe('login', () => {
    it('rejects an unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ email: 'missing@b.com', password: 'password123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        passwordHash: await bcrypt.hash('correct-password', 10),
      });
      await expect(
        service.login({ email: 'a@b.com', password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('accepts the correct password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        phone: null,
        role: 'student',
        locale: 'ar',
        passwordHash: await bcrypt.hash('correct-password', 10),
      });
      const result = await service.login({ email: 'a@b.com', password: 'correct-password' });
      expect(result.user.id).toBe('u1');
    });
  });

  describe('OTP', () => {
    it('sends a code via the injected provider and echoes it outside production', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      prisma.phoneOtp.create.mockResolvedValue({});

      const result = await service.requestOtp('+966500000000');

      expect(otpProvider.send).toHaveBeenCalledWith('+966500000000', expect.any(String));
      expect(result.devCode).toEqual(expect.any(String));
      process.env.NODE_ENV = originalEnv;
    });

    it('rejects an incorrect code', async () => {
      prisma.phoneOtp.findFirst.mockResolvedValue({
        id: 'otp1',
        codeHash: await bcrypt.hash('123456', 10),
        attempts: 0,
      });
      prisma.phoneOtp.update.mockResolvedValue({});

      await expect(service.verifyOtp('+966500000000', '000000')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('creates a new user and grants the free plan on first verification', async () => {
      prisma.phoneOtp.findFirst.mockResolvedValue({
        id: 'otp1',
        codeHash: await bcrypt.hash('123456', 10),
        attempts: 0,
      });
      prisma.phoneOtp.update.mockResolvedValue({});
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'u2',
        email: null,
        phone: '+966500000000',
        role: 'student',
        locale: 'ar',
      });

      const result = await service.verifyOtp('+966500000000', '123456');

      expect(result.isNewUser).toBe(true);
      expect(entitlements.grantPlan).toHaveBeenCalledWith('u2', 'free', 'subscription');
    });
  });
});
