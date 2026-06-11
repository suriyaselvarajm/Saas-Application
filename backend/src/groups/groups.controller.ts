import { Controller, Get, Post, Delete, Patch, Param, Query, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { ModifyGroupDto } from './dto/modify-group.dto';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('groups')
@UseGuards(RolesGuard)
@Roles(SystemRole.TENANT_ADMIN)
@UseInterceptors(AuditInterceptor)
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get('templates')
  async getTemplates() {
    return this.groupsService.getTemplates();
  }

  @Post('templates')
  async saveTemplate(@Body() body: any) {
    return this.groupsService.saveTemplate(body);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    return this.groupsService.deleteTemplate(id);
  }

  @Get()
  async searchGroups(@TenantId() tenantId: string, @Query('q') query = '') {
    return this.groupsService.searchGroups(tenantId, query);
  }

  @Post('create-single')
  async createSingleGroup(@TenantId() tenantId: string, @Body() dto: CreateGroupDto) {
    return this.groupsService.createSingleGroup(tenantId, dto);
  }

  @Post('create-bulk')
  async createBulkGroups(@TenantId() tenantId: string, @Body() body: { groups: CreateGroupDto[] }) {
    return this.groupsService.createBulkGroups(tenantId, body.groups);
  }

  @Patch('modify-single')
  async modifySingleGroup(@TenantId() tenantId: string, @Body() dto: ModifyGroupDto) {
    return this.groupsService.modifySingleGroup(tenantId, dto);
  }

  @Post('modify-bulk')
  async modifyBulkGroups(@TenantId() tenantId: string, @Body() body: { groups: ModifyGroupDto[] }) {
    return this.groupsService.modifyBulkGroups(tenantId, body.groups);
  }
}
