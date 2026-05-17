import { Test, TestingModule } from '@nestjs/testing';
import { MfaService } from './mfa.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpException } from '@nestjs/common';
import * as speakeasy from 'speakeasy';

// Mock speakeasy
jest.mock('speakeasy', () => ({
  generateSecret: jest.fn().mockReturnValue({
    base32: 'JBSWY3DPEHPK3PXP',
    otpauth_url: 'otpauth://totp/Petrus%20IAM%20(test%40corp.com)?secret=JBSWY3DPEHPK3PXP',
  }),
  totp: {
    verify: jest.fn(),
  },
}));

// Mock qrcode
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockQR'),
}));

const mockUser = {
  id: 'user-123',
  email: 'test@corp.com',
  mfaSecret: 'JBSWY3DPEHPK3PXP',
  mfaEnabled: false,
};

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('MfaService', () => {
  let service: MfaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MfaService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<MfaService>(MfaService);
    jest.clearAllMocks();
  });

  // ── generateSetup ─────────────────────────────────────────────────────────
  describe('generateSetup', () => {
    it('returns QR code and secret for valid user', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, mfaSecret: 'JBSWY3DPEHPK3PXP' });

      const result = await service.generateSetup('user-123');

      expect(result.secret).toBe('JBSWY3DPEHPK3PXP');
      expect(result.qrCodeDataUrl).toBe('data:image/png;base64,mockQR');
      expect(result.otpauthUrl).toContain('otpauth://');
    });

    it('throws 404 when user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.generateSetup('bad-id')).rejects.toThrow(HttpException);
    });

    it('persists the MFA secret before enabling', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue(mockUser);

      await service.generateSetup('user-123');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { mfaSecret: 'JBSWY3DPEHPK3PXP' },
      });
    });
  });

  // ── enableMfa ─────────────────────────────────────────────────────────────
  describe('enableMfa', () => {
    it('enables MFA when OTP token is valid', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, mfaEnabled: true });
      (speakeasy.totp.verify as ReturnType<typeof jest.fn>).mockReturnValue(true);

      const result = await service.enableMfa('user-123', '123456');
      expect(result.success).toBe(true);
    });

    it('throws 401 when OTP token is invalid', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      (speakeasy.totp.verify as ReturnType<typeof jest.fn>).mockReturnValue(false);

      await expect(service.enableMfa('user-123', '000000')).rejects.toThrow(HttpException);
    });

    it('throws 400 when user has no mfaSecret (setup not started)', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, mfaSecret: null });
      await expect(service.enableMfa('user-123', '123456')).rejects.toThrow(HttpException);
    });

    it('throws 404 when user is not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.enableMfa('bad-id', '123456')).rejects.toThrow(HttpException);
    });

    it('sets mfaEnabled to true on the user record', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({ ...mockUser, mfaEnabled: true });
      (speakeasy.totp.verify as ReturnType<typeof jest.fn>).mockReturnValue(true);

      await service.enableMfa('user-123', '123456');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { mfaEnabled: true },
      });
    });
  });

  // ── verifyLoginOtp ────────────────────────────────────────────────────────
  describe('verifyLoginOtp', () => {
    it('returns true for valid OTP', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, mfaEnabled: true });
      (speakeasy.totp.verify as ReturnType<typeof jest.fn>).mockReturnValue(true);

      const result = await service.verifyLoginOtp('user-123', '123456');
      expect(result).toBe(true);
    });

    it('returns false for invalid OTP', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, mfaEnabled: true });
      (speakeasy.totp.verify as ReturnType<typeof jest.fn>).mockReturnValue(false);

      const result = await service.verifyLoginOtp('user-123', '000000');
      expect(result).toBe(false);
    });

    it('returns false when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const result = await service.verifyLoginOtp('bad-id', '123456');
      expect(result).toBe(false);
    });

    it('returns false when MFA is not enabled', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, mfaEnabled: false });
      const result = await service.verifyLoginOtp('user-123', '123456');
      expect(result).toBe(false);
    });

    it('returns false when secret is missing', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, mfaSecret: null, mfaEnabled: true });
      const result = await service.verifyLoginOtp('user-123', '123456');
      expect(result).toBe(false);
    });
  });

  // ── disableMfa ────────────────────────────────────────────────────────────
  describe('disableMfa', () => {
    it('disables MFA when OTP is valid', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, mfaEnabled: true });
      prismaMock.user.update.mockResolvedValue({ ...mockUser, mfaEnabled: false, mfaSecret: null });
      (speakeasy.totp.verify as ReturnType<typeof jest.fn>).mockReturnValue(true);

      const result = await service.disableMfa('user-123', '123456');
      expect(result.success).toBe(true);
    });

    it('throws 401 when OTP is invalid on disable', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, mfaEnabled: true });
      (speakeasy.totp.verify as ReturnType<typeof jest.fn>).mockReturnValue(false);

      await expect(service.disableMfa('user-123', '000000')).rejects.toThrow(HttpException);
    });

    it('throws 400 when MFA is not set up at all', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, mfaSecret: null });
      await expect(service.disableMfa('user-123', '123456')).rejects.toThrow(HttpException);
    });

    it('clears mfaSecret and mfaEnabled on disable', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...mockUser, mfaEnabled: true });
      prismaMock.user.update.mockResolvedValue({ ...mockUser, mfaEnabled: false, mfaSecret: null });
      (speakeasy.totp.verify as ReturnType<typeof jest.fn>).mockReturnValue(true);

      await service.disableMfa('user-123', '123456');

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { mfaEnabled: false, mfaSecret: null },
      });
    });
  });
});
