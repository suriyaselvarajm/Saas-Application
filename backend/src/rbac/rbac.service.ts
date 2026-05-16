import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RbacService {
  constructor(private readonly prisma: PrismaService) {}

  async createRole(tenantId: string, data: CreateRoleDto) {
    return this.prisma.role.create({
      data: { ...data, tenantId },
    });
  }

  async getRoles(tenantId: string) {
    return this.prisma.role.findMany({ where: { tenantId } });
  }

  async deleteRole(tenantId: string, id: string) {
    const role = await this.prisma.role.findFirst({ where: { id, tenantId } });
    if (!role) throw new NotFoundException('Role not found');
    return this.prisma.role.delete({ where: { id } });
  }
}
