import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    tenantId: string;
    userId?: string;
    module: string;
    action: string;
    details?: any;
    ipAddress?: string;
  }) {
    return this.prisma.auditLog.create({
      data,
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
