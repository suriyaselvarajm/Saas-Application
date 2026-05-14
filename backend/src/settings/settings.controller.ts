import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { M365SettingsDto } from './dto/m365-settings.dto';
import { AdSettingsDto } from './dto/ad-settings.dto';
import { AuthSettingsDto } from './dto/auth-settings.dto';
import { CreateOfficeDto, UpdateOfficeDto } from './dto/office.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';
import { UseGuards } from '@nestjs/common';

@Controller('settings')
@UseGuards(RolesGuard)
@Roles(SystemRole.TENANT_ADMIN)
@UseInterceptors(AuditInterceptor)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getSettings(@TenantId() tenantId: string) {
    return this.settingsService.getSettings(tenantId);
  }

  @Post('m365')
  updateM365(@TenantId() tenantId: string, @Body() data: M365SettingsDto) {
    return this.settingsService.updateM365(tenantId, data);
  }

  @Post('ad')
  async updateAD(@TenantId() tenantId: string, @Body() data: AdSettingsDto) {
    try {
      return await this.settingsService.updateAD(tenantId, data);
    } catch (error) {
      console.error('Error updating AD settings:', error);
      throw error;
    }
  }

  @Post('auth')
  updateAuth(@TenantId() tenantId: string, @Body() data: AuthSettingsDto) {
    return this.settingsService.updateAuth(tenantId, data);
  }

  @Post('m365/test')
  testM365() {
    return this.settingsService.testM365Connection();
  }

  @Post('ad/test')
  testAD(@Body() data: AdSettingsDto) {
    return this.settingsService.testAdConnection(data);
  }

  // Office Endpoints
  @Get('offices')
  getOffices(@TenantId() tenantId: string) {
    return this.settingsService.getOffices(tenantId);
  }

  @Post('offices')
  createOffice(@TenantId() tenantId: string, @Body() data: CreateOfficeDto) {
    return this.settingsService.createOffice(tenantId, data);
  }

  @Patch('offices/:id')
  updateOffice(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() data: UpdateOfficeDto,
  ) {
    return this.settingsService.updateOffice(id, tenantId, data);
  }

  @Delete('offices/:id')
  deleteOffice(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.settingsService.deleteOffice(id, tenantId);
  }

  // Department Endpoints
  @Get('departments')
  getDepartments(@TenantId() tenantId: string) {
    return this.settingsService.getDepartments(tenantId);
  }

  @Post('departments')
  createDepartment(
    @TenantId() tenantId: string,
    @Body() data: CreateDepartmentDto,
  ) {
    return this.settingsService.createDepartment(tenantId, data);
  }

  @Patch('departments/:id')
  updateDepartment(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() data: UpdateDepartmentDto,
  ) {
    return this.settingsService.updateDepartment(id, tenantId, data);
  }

  @Delete('departments/:id')
  deleteDepartment(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.settingsService.deleteDepartment(id, tenantId);
  }
}
