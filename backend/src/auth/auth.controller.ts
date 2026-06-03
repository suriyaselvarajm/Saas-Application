import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { MfaService } from './mfa.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly mfaService: MfaService,
  ) {}

  @Get('tenant-config')
  async getTenantConfig(@Query('domain') domain: string) {
    if (!domain) {
      throw new HttpException('Domain is required', HttpStatus.BAD_REQUEST);
    }
    return this.authService.getTenantConfigByDomain(domain);
  }

  @Post('m365/callback')
  async handleM365Callback(@Body() body: { code: string; domain: string }) {
    if (!body.code || !body.domain) {
      throw new HttpException(
        'Code and domain are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.authService.exchangeM365Token(body.code, body.domain);
  }

  @Post('login')
  async login(@Body() body: { email: string; password?: string }) {
    if (!body.email) {
      throw new HttpException('Email is required', HttpStatus.BAD_REQUEST);
    }
    return this.authService.login(body.email, body.password);
  }

  @Post('change-password')
  async changePassword(@Body() body: { email: string; newPassword: string }) {
    if (!body.email || !body.newPassword) {
      throw new HttpException(
        'Email and new password are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.authService.changePassword(body.email, body.newPassword);
  }

  @Post('reset-password')
  async adminResetPassword(
    @Body() body: { userId: string; newPassword: string },
  ) {
    if (!body.userId || !body.newPassword) {
      throw new HttpException(
        'User ID and new password are required',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.authService.adminResetPassword(body.userId, body.newPassword);
  }

  // ─── MFA Endpoints ────────────────────────────────────────────────────────

  /** Generate a QR code for the user to scan in their authenticator app */
  @Post('mfa/setup')
  async setupMfa(@Body() body: { userId: string }) {
    if (!body.userId) {
      throw new HttpException('userId is required', HttpStatus.BAD_REQUEST);
    }
    return this.mfaService.generateSetup(body.userId);
  }

  /** Verify the first OTP code to confirm setup and activate MFA */
  @Post('mfa/enable')
  async enableMfa(@Body() body: { userId: string; token: string }) {
    if (!body.userId || !body.token) {
      throw new HttpException('userId and token are required', HttpStatus.BAD_REQUEST);
    }
    return this.mfaService.enableMfa(body.userId, body.token);
  }

  /** Verify OTP during login (after password is accepted, mfaRequired=true) */
  @Post('mfa/verify')
  async verifyMfaLogin(@Body() body: { userId: string; token: string }) {
    if (!body.userId || !body.token) {
      throw new HttpException('userId and token are required', HttpStatus.BAD_REQUEST);
    }
    const valid = await this.mfaService.verifyLoginOtp(body.userId, body.token);
    if (!valid) {
      throw new HttpException('Invalid or expired OTP code', HttpStatus.UNAUTHORIZED);
    }
    // Fetch user to build the full response
    return this.authService.completeMfaLogin(body.userId);
  }

  /** Disable MFA (requires current TOTP to confirm) */
  @Post('mfa/disable')
  async disableMfa(@Body() body: { userId: string; token: string }) {
    if (!body.userId || !body.token) {
      throw new HttpException('userId and token are required', HttpStatus.BAD_REQUEST);
    }
    return this.mfaService.disableMfa(body.userId, body.token);
  }
}
