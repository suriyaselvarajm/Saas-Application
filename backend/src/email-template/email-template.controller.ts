import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmailTemplateService } from './email-template.service';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto } from './dto/email-template.dto';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('settings/email-templates')
export class EmailTemplateController {
  constructor(private readonly emailTemplateService: EmailTemplateService) {}

  @Post()
  create(@TenantId() tenantId: string, @Body() dto: CreateEmailTemplateDto) {
    return this.emailTemplateService.create(tenantId, dto);
  }

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.emailTemplateService.findAll(tenantId);
  }

  @Get(':id')
  findOne(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.emailTemplateService.findOne(tenantId, id);
  }

  @Patch(':id')
  update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateEmailTemplateDto) {
    return this.emailTemplateService.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.emailTemplateService.remove(tenantId, id);
  }
}
