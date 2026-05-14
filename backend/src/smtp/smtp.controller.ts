import { Body, Controller, Get, Post } from '@nestjs/common';
import { SmtpService } from './smtp.service';
import { SmtpSettingsDto, TestSmtpDto } from './dto/smtp-settings.dto';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('settings/smtp')
export class SmtpController {
  constructor(private readonly smtpService: SmtpService) {}

  @Get()
  get(@TenantId() tenantId: string) {
    return this.smtpService.get(tenantId);
  }

  @Post()
  upsert(@TenantId() tenantId: string, @Body() dto: SmtpSettingsDto) {
    return this.smtpService.upsert(tenantId, dto);
  }

  @Post('test')
  test(@TenantId() tenantId: string, @Body() dto: TestSmtpDto) {
    return this.smtpService.testConnection(tenantId, dto);
  }
}
