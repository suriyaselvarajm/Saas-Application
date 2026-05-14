import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@Controller('rbac/roles')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Post()
  createRole(@TenantId() tenantId: string, @Body() data: CreateRoleDto) {
    return this.rbacService.createRole(tenantId, data);
  }

  @Get()
  getRoles(@TenantId() tenantId: string) {
    return this.rbacService.getRoles(tenantId);
  }

  @Delete(':id')
  deleteRole(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.rbacService.deleteRole(tenantId, id);
  }
}
