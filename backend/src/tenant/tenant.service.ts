import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantStatus } from '@prisma/client';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    const existing = await this.prisma.tenant.findUnique({
      where: { tenantCode: createTenantDto.tenantCode },
    });

    if (existing) {
      throw new ConflictException('Tenant code already exists');
    }

    return this.prisma.tenant.create({
      data: {
        ...createTenantDto,
        status: TenantStatus.ACTIVE,
        m365Settings: {
          create: {
            azureTenantId: `mock-azure-id-${createTenantDto.tenantCode}`,
            clientId: `mock-client-id-${createTenantDto.tenantCode}`,
            redirectUrl: 'http://localhost:3000/auth/callback',
          }
        }
      },
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      where: { deletedAt: null },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, deletedAt: null },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    await this.findOne(id);

    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.tenant.update({
      where: { id },
      data: { deletedAt: new Date(), status: TenantStatus.DISABLED },
    });
  }
}
