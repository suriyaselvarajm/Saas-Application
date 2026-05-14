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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
