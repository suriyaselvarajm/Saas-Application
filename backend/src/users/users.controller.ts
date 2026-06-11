import { Controller, Post, Get, Patch, Delete, Param, Query, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateSingleUserDto } from './dto/create-single-user.dto';
import { ModifyUserDto } from './dto/modify-user.dto';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('users')
@UseGuards(RolesGuard)
@Roles(SystemRole.TENANT_ADMIN)
@UseInterceptors(AuditInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('templates')
  async getTemplates() {
    return this.usersService.getTemplates();
  }

  @Post('templates')
  async saveTemplate(@Body() body: any) {
    return this.usersService.saveTemplate(body);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    return this.usersService.deleteTemplate(id);
  }

  @Post('create-single')
  async createSingleUser(
    @TenantId() tenantId: string,
    @Body() dto: CreateSingleUserDto,
  ) {
    return this.usersService.createSingleUser(tenantId, dto);
  }

  @Post('create-bulk')
  async createBulkUsers(
    @TenantId() tenantId: string,
    @Body() body: { users: CreateSingleUserDto[] },
  ) {
    return this.usersService.createBulkUsers(tenantId, body.users);
  }

  @Get('check-availability')
  async checkAvailability(@Query('email') email: string) {
    const available = await this.usersService.checkAvailability(email);
    return { available };
  }

  @Get()
  async searchUsers(
    @TenantId() tenantId: string,
    @Query('q') query: string = '',
  ) {
    return this.usersService.searchUsers(tenantId, query);
  }

  @Patch('modify-single')
  async modifySingleUser(
    @TenantId() tenantId: string,
    @Body() dto: ModifyUserDto,
  ) {
    return this.usersService.modifySingleUser(tenantId, dto);
  }

  @Post('modify-bulk')
  async modifyBulkUsers(
    @TenantId() tenantId: string,
    @Body() body: { users: ModifyUserDto[] },
  ) {
    return this.usersService.modifyBulkUsers(tenantId, body.users);
  }

  @Post('reports')
  async getUserReport(
    @TenantId() tenantId: string,
    @Body() body: { reportType: string; csvUsers?: string[] },
  ) {
    return this.usersService.getUserReport(tenantId, body.reportType, body.csvUsers);
  }

  @Post('reports/action')
  async executeReportAction(
    @TenantId() tenantId: string,
    @Body() body: { email: string; action: string },
  ) {
    return this.usersService.executeReportAction(tenantId, body.email, body.action);
  }
}
