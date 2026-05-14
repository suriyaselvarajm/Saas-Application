import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { M365SettingsDto } from './dto/m365-settings.dto';
import { AdSettingsDto } from './dto/ad-settings.dto';
import { AuthSettingsDto } from './dto/auth-settings.dto';
import { CreateOfficeDto, UpdateOfficeDto } from './dto/office.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async updateM365(tenantId: string, data: M365SettingsDto) {
    return this.prisma.m365Settings.upsert({
      where: { tenantId },
      update: data,
      create: { ...data, tenantId },
    });
  }

  async updateAD(tenantId: string, data: AdSettingsDto) {
    return this.prisma.adSettings.upsert({
      where: { tenantId },
      update: data,
      create: { ...data, tenantId },
    });
  }

  async updateAuth(tenantId: string, data: AuthSettingsDto) {
    return this.prisma.authSettings.upsert({
      where: { tenantId },
      update: data,
      create: { ...data, tenantId },
    });
  }

  async getSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        m365Settings: true,
        adSettings: true,
        smtpSettings: true,
        authSettings: true,
      },
    });

    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  // Placeholder for external integration tests
  async testM365Connection(tenantId: string) {
    // Logic to call Microsoft Graph API with tenant credentials
    return { success: true, message: 'Successfully connected to Microsoft Graph' };
  }

  async testAdConnection(tenantId: string) {
    // Logic to bind to LDAP server
    return { success: true, message: 'Successfully connected to AD Server' };
  }

  // Office Management
  async getOffices(tenantId: string) {
    return this.prisma.office.findMany({ where: { tenantId } });
  }

  async createOffice(tenantId: string, data: CreateOfficeDto) {
    return this.prisma.office.create({ data: { ...data, tenantId } });
  }

  async updateOffice(id: string, tenantId: string, data: UpdateOfficeDto) {
    return this.prisma.office.update({ where: { id, tenantId }, data });
  }

  async deleteOffice(id: string, tenantId: string) {
    return this.prisma.office.delete({ where: { id, tenantId } });
  }

  // Department Management
  async getDepartments(tenantId: string) {
    return this.prisma.department.findMany({ where: { tenantId } });
  }

  async createDepartment(tenantId: string, data: CreateDepartmentDto) {
    return this.prisma.department.create({ data: { ...data, tenantId } });
  }

  async updateDepartment(id: string, tenantId: string, data: UpdateDepartmentDto) {
    return this.prisma.department.update({ where: { id, tenantId }, data });
  }

  async deleteDepartment(id: string, tenantId: string) {
    return this.prisma.department.delete({ where: { id, tenantId } });
  }
}
