import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantStatus } from '@prisma/client';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    const { adminEmail, initialPassword, ...tenantData } = createTenantDto;

    const existing = await this.prisma.tenant.findUnique({
      where: { tenantCode: tenantData.tenantCode },
    });

    if (existing) {
      throw new ConflictException('Tenant code already exists');
    }

    return this.prisma.tenant.create({
      data: {
        ...tenantData,
        status: TenantStatus.ACTIVE,
        m365Settings: {
          create: {
            azureTenantId: `mock-azure-id-${tenantData.tenantCode}`,
            clientId: `mock-client-id-${tenantData.tenantCode}`,
            redirectUrl: 'http://localhost:3000/auth/callback',
          }
        },
        users: {
          create: {
            email: adminEmail,
            password: initialPassword,
            mustChangePassword: true,
            name: 'Tenant Administrator',
            systemRole: 'TENANT_ADMIN',
          }
        }
      },
      include: { users: true }
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      where: { deletedAt: null },
      include: { users: true },
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
    const { adminEmail, initialPassword, ...tenantData } = updateTenantDto;
    await this.findOne(id);

    // If adminEmail is provided, update the TENANT_ADMIN user
    if (adminEmail) {
      const adminUser = await this.prisma.user.findFirst({
        where: { tenantId: id, systemRole: 'TENANT_ADMIN' }
      });

      if (adminUser) {
        await this.prisma.user.update({
          where: { id: adminUser.id },
          data: { email: adminEmail }
        });
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: tenantData,
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
