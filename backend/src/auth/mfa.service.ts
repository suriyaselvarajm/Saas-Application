import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class MfaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Step 1: Generate a new TOTP secret and return the QR code for setup.
   * The user scans this with Google Authenticator / Authy.
   * MFA is NOT yet enabled — it is only enabled after the user verifies the code.
   */
  async generateSetup(userId: string): Promise<{ otpauthUrl: string; qrCodeDataUrl: string; secret: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const secret = speakeasy.generateSecret({
      name: `Petrus IAM (${user.email})`,
      length: 20,
    });

    // Persist the pending secret (but mfaEnabled stays false until verified)
    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret.base32 },
    });

    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url ?? '');

    return {
      otpauthUrl: secret.otpauth_url ?? '',
      qrCodeDataUrl,
      secret: secret.base32,
    };
  }

  /**
   * Step 2: Verify the first TOTP code from the authenticator app and enable MFA.
   */
  async enableMfa(userId: string, token: string): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret) {
      throw new HttpException('MFA setup not initiated', HttpStatus.BAD_REQUEST);
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      throw new HttpException('Invalid verification code', HttpStatus.UNAUTHORIZED);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: true },
    });

    return { success: true };
  }

  /**
   * Step 3 (login): Verify TOTP during the login challenge.
   */
  async verifyLoginOtp(userId: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret || !user?.mfaEnabled) return false;

    return speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });
  }

  /**
   * Disable MFA for a user (requires current TOTP verification).
   */
  async disableMfa(userId: string, token: string): Promise<{ success: boolean }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.mfaSecret) {
      throw new HttpException('MFA is not enabled', HttpStatus.BAD_REQUEST);
    }

    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      throw new HttpException('Invalid verification code', HttpStatus.UNAUTHORIZED);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaEnabled: false, mfaSecret: null },
    });

    return { success: true };
  }
}
