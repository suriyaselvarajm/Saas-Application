import { Controller, Post, Get, Delete, Param, Query, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateSingleUserDto } from './dto/create-single-user.dto';
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
}
