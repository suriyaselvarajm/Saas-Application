import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto } from './dto/email-template.dto';

@Injectable()
export class EmailTemplateService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, data: CreateEmailTemplateDto) {
    return this.prisma.emailTemplate.create({
      data: { ...data, tenantId },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.emailTemplate.findMany({ where: { tenantId } });
  }

  async findOne(tenantId: string, id: string) {
    const template = await this.prisma.emailTemplate.findFirst({ where: { id, tenantId } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async update(tenantId: string, id: string, data: UpdateEmailTemplateDto) {
    await this.findOne(tenantId, id); // Ensure it exists and belongs to tenant
    return this.prisma.emailTemplate.update({
      where: { id },
      data,
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    return this.prisma.emailTemplate.delete({ where: { id } });
  }
}
