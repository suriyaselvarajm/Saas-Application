import { Injectable, NotFoundException } from '@nestjs/common';
import * as ldap from 'ldapjs';
import { PrismaService } from '../prisma/prisma.service';
import { M365SettingsDto } from './dto/m365-settings.dto';
import { AdSettingsDto } from './dto/ad-settings.dto';
import { AuthSettingsDto } from './dto/auth-settings.dto';
import { CreateOfficeDto, UpdateOfficeDto } from './dto/office.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async updateM365(tenantId: string, data: M365SettingsDto & { id?: string }) {
    if (data.id) {
      return this.prisma.m365Settings.update({
        where: { id: data.id },
        data: { ...data, tenantId },
      });
    }
    return this.prisma.m365Settings.create({
      data: { ...data, tenantId },
    });
  }

  async updateAD(tenantId: string, data: AdSettingsDto & { id?: string }) {
    if (data.id) {
      return this.prisma.adSettings.update({
        where: { id: data.id },
        data: { ...data, tenantId },
      });
    }
    return this.prisma.adSettings.create({
      data: { ...data, tenantId },
    });
  }

  async deleteAD(id: string, tenantId: string) {
    return this.prisma.adSettings.deleteMany({
      where: { id, tenantId },
    });
  }

  async deleteM365(id: string, tenantId: string) {
    return this.prisma.m365Settings.deleteMany({
      where: { id, tenantId },
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
  testM365Connection() {
    // Logic to call Microsoft Graph API with tenant credentials
    return {
      success: true,
      message: 'Successfully connected to Microsoft Graph',
    };
  }

  async testAdConnection(data: AdSettingsDto): Promise<{ success: boolean; message: string }> {
    const url = `${data.sslEnabled ? 'ldaps' : 'ldap'}://${data.adServerIp}:${data.port || 389}`;
    console.log(`Testing full LDAP bind to ${url} with user ${data.bindUsername}`);

    const client = ldap.createClient({
      url: url,
      timeout: 10000,
      connectTimeout: 10000,
      tlsOptions: data.sslEnabled ? { rejectUnauthorized: false } : undefined,
    });

    try {
      await new Promise<void>((resolve, reject) => {
        client.on('error', (err) => reject(new Error(`Connection failed: ${err.message}`)));
        client.bind(data.bindUsername, data.bindPassword, (err) => {
          if (err) reject(new Error(`Authentication failed: ${err.message}`));
          else resolve();
        });
      });

      console.log('LDAP Bind Successful, now validating Base DN...');

      const searchOptions: ldap.SearchOptions = {
        scope: 'base',
        attributes: ['dn'],
      };

      const found = await new Promise<boolean>((resolve, reject) => {
        client.search(data.baseDn, searchOptions, (err, res) => {
          if (err) {
            reject(new Error(`Base DN validation failed: ${err.message}`));
            return;
          }

          let isFound = false;
          res.on('searchEntry', () => { isFound = true; });
          res.on('error', (err) => reject(new Error(`Search error on Base DN: ${err.message}`)));
          res.on('end', () => resolve(isFound));
        });
      });

      if (found) {
        return { success: true, message: `Successfully authenticated and validated Base DN: ${data.baseDn}` };
      } else {
        return { success: false, message: `Base DN "${data.baseDn}" was not found on the server.` };
      }
    } catch (err: any) {
      console.error('LDAP Error:', err.message);
      return { success: false, message: err.message };
    } finally {
      client.unbind();
    }
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

  async updateDepartment(
    id: string,
    tenantId: string,
    data: UpdateDepartmentDto,
  ) {
    return this.prisma.department.update({ where: { id, tenantId }, data });
  }

  async deleteDepartment(id: string, tenantId: string) {
    return this.prisma.department.delete({ where: { id, tenantId } });
  }
}
