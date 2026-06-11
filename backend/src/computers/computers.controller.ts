import { Controller, Get, Post, Delete, Patch, Param, Query, Body, UseGuards, UseInterceptors } from '@nestjs/common';
import { ComputersService } from './computers.service';
import { CreateComputerDto } from './dto/create-computer.dto';
import { ModifyComputerDto } from './dto/modify-computer.dto';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { SystemRole } from '@prisma/client';
import { AuditInterceptor } from '../audit/audit.interceptor';

@Controller('computers')
@UseGuards(RolesGuard)
@Roles(SystemRole.TENANT_ADMIN)
@UseInterceptors(AuditInterceptor)
export class ComputersController {
  constructor(private readonly computersService: ComputersService) {}

  @Get('templates')
  async getTemplates() {
    return this.computersService.getTemplates();
  }

  @Post('templates')
  async saveTemplate(@Body() body: any) {
    return this.computersService.saveTemplate(body);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string) {
    return this.computersService.deleteTemplate(id);
  }

  @Get()
  async searchComputers(@TenantId() tenantId: string, @Query('q') query = '') {
    return this.computersService.searchComputers(tenantId, query);
  }

  @Post('create-single')
  async createSingleComputer(@TenantId() tenantId: string, @Body() dto: CreateComputerDto) {
    return this.computersService.createSingleComputer(tenantId, dto);
  }

  @Post('create-bulk')
  async createBulkComputers(@TenantId() tenantId: string, @Body() body: { computers: CreateComputerDto[] }) {
    return this.computersService.createBulkComputers(tenantId, body.computers);
  }

  @Patch('modify-single')
  async modifySingleComputer(@TenantId() tenantId: string, @Body() dto: ModifyComputerDto) {
    return this.computersService.modifySingleComputer(tenantId, dto);
  }

  @Post('modify-bulk')
  async modifyBulkComputers(@TenantId() tenantId: string, @Body() body: { computers: ModifyComputerDto[] }) {
    return this.computersService.modifyBulkComputers(tenantId, body.computers);
  }
}
