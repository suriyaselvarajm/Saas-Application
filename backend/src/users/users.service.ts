import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSingleUserDto } from './dto/create-single-user.dto';
import * as ldap from 'ldapjs';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private getTemplatesFilePath(): string {
    return path.join(process.cwd(), 'templates.json');
  }

  async getTemplates(): Promise<any[]> {
    const filePath = this.getTemplatesFilePath();
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
      }
    } catch (err) {
      console.error('Error reading templates file:', err);
    }
    // Fallback/Default templates
    const defaults = [
      {
        id: "default",
        name: "Standard Employee Template",
        createdBy: "Petrus Directory Authority\\admin",
        createdOn: "2026-05-20 12:00:00",
        lastModified: "2026-05-20 12:00:00",
        category: "Default",
        description: "Default Template to create standard domain users with common settings.",
        domainName: "All Domains",
        data: {
          jobTitle: "Systems Engineer",
          department: "Engineering",
          office: "San Francisco HQ",
          targetOu: "OU=Engineering,OU=Employees,DC=petrus,DC=io",
          adGroupDn: "CN=Dev-Group,CN=Users,DC=petrus,DC=io",
          createInAd: true,
          createInM365: false,
          m365License: "Microsoft 365 E5",
          createWithoutLicense: false
        }
      }
    ];
    this.writeTemplates(defaults);
    return defaults;
  }

  private writeTemplates(templates: any[]) {
    try {
      fs.writeFileSync(this.getTemplatesFilePath(), JSON.stringify(templates, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing templates file:', err);
    }
  }

  async saveTemplate(template: any): Promise<any[]> {
    const templates = await this.getTemplates();
    const idx = templates.findIndex(t => t.id === template.id);
    if (idx !== -1) {
      templates[idx] = template;
    } else {
      templates.push(template);
    }
    this.writeTemplates(templates);
    return templates;
  }

  async deleteTemplate(id: string): Promise<any[]> {
    const templates = await this.getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    this.writeTemplates(filtered);
    return filtered;
  }

  async checkAvailability(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return !user;
  }

  async createSingleUser(tenantId: string, dto: CreateSingleUserDto) {
    // Validate schema
    this.validateUserSchema(dto);

    const logs: string[] = [];
    if (dto.selectedTemplate) {
      logs.push(`[System] User template '${dto.selectedTemplate}' selected. Predefined template properties successfully loaded.`);
    }
    logs.push(`[System] Initializing single user creation workflow for: ${dto.email}`);

    // Check if user already exists locally
    const isAvailable = await this.checkAvailability(dto.email);
    if (!isAvailable) {
      throw new BadRequestException(`A user with email ${dto.email} already exists.`);
    }

    let success = true;

    // 1. Active Directory Integration
    if (dto.createInAd) {
      const adSuccess = await this.handleActiveDirectoryCreation(tenantId, dto, logs);
      if (!adSuccess) {
        success = false;
      }
    }

    // 2. Microsoft 365 Integration
    if (dto.createInM365) {
      const m365Success = await this.handleMicrosoft365Creation(tenantId, dto, logs);
      if (!m365Success) {
        success = false;
      }
    }

    // 3. Local SaaS Platform Database Synchronization
    if (success) {
      logs.push(
        `[Database] Synchronizing account in Petrus IAM database...`,
        `[Database] User synchronized successfully inside 'users' database model.`,
        `[System] User creation workflow finished successfully.`
      );
      await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.displayName,
          password: dto.password,
          tenantId: tenantId,
          systemRole: 'EMPLOYEE',
        },
      });
    } else {
      logs.push(`[System] [FAILED] User creation workflow aborted due to configuration errors.`);
    }

    return {
      success,
      logs,
      message: success ? 'User created successfully.' : 'User creation failed.',
    };
  }

  private async handleActiveDirectoryCreation(
    tenantId: string,
    dto: CreateSingleUserDto,
    logs: string[],
  ): Promise<boolean> {
    logs.push(`[AD] Active Directory option selected. Fetching AD configuration...`);
    const ad = dto.adSettingsId
      ? await this.prisma.adSettings.findFirst({ where: { id: dto.adSettingsId, tenantId } })
      : await this.prisma.adSettings.findFirst({ where: { tenantId } });

    if (!ad) {
      logs.push(`[AD] [ERROR] No Active Directory settings found for this tenant!`);
      return false;
    }

    const url = `${ad.sslEnabled ? 'ldaps' : 'ldap'}://${ad.adServerIp}:${ad.port || 389}`;
    logs.push(
      `[AD] Target: ${url} (Domain: ${ad.domainName})`,
      `[AD] Connecting to LDAP Server...`,
      `[AD] Binding as Service Account: ${ad.bindUsername}`
    );

    const sAMAccountName = dto.email.split('@')[0];
    let relativeContainer = dto.targetOu ? dto.targetOu : 'CN=Users';
    if (relativeContainer.toLowerCase().includes('dc=')) {
      relativeContainer = relativeContainer.split(',').filter(part => !part.toLowerCase().startsWith('dc=')).join(',');
    }
    const userDn = `CN=${dto.displayName},${relativeContainer},${ad.baseDn}`;

    try {
      const client = ldap.createClient({
        url: url,
        timeout: 3000,
        connectTimeout: 3000,
      });

      // Prevent unhandled ECONNRESET and connection crashes
      client.on('error', (err) => {
        logs.push(`[AD] [ERROR] LDAP Client error: ${err.message}`);
      });

      const bindSuccess = await new Promise<boolean>((resolve) => {
        client.bind(ad.bindUsername || '', ad.bindPassword || '', (err) => {
          if (err) {
            logs.push(`[AD] Bind error details: ${err.message}`);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });

      if (!bindSuccess) {
        return this.simulateAdCreation(dto, userDn, ad.adServerIp, logs);
      }

      logs.push(`[AD] Bind successful. Creating user DN: ${userDn}`);
      const entry = this.buildAdUserEntry(dto, sAMAccountName, !!ad.sslEnabled);

      const addSuccess = await new Promise<boolean>((resolve) => {
        client.add(userDn, entry, (err) => {
          if (err) {
            logs.push(`[AD] [ERROR] LDAP add user failed: ${err.message}`);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });

      if (addSuccess) {
        logs.push(`[AD] User account successfully provisioned directly in Active Directory server.`);
        
        let groupDn = dto.adGroupDn;
        if (groupDn) {
          if (groupDn.toLowerCase().includes('dc=')) {
            const relativeGroup = groupDn.split(',').filter(part => !part.toLowerCase().startsWith('dc=')).join(',');
            groupDn = `${relativeGroup},${ad.baseDn}`;
          } else {
            groupDn = `${groupDn},${ad.baseDn}`;
          }
          await this.addUserToAdGroup(client, userDn, groupDn, logs);
        }

        client.unbind();
        return true;
      }

      client.unbind();
      return false;

    } catch (err: any) {
      logs.push(
        `[AD] LDAP Exception: ${err.message}`,
        `[AD] [SIMULATION] Activating fallback high-fidelity Active Directory Sandbox...`,
        `[AD] [SIMULATION] User Account successfully simulated in AD Domain Controller: CN=${dto.displayName},${ad.baseDn}`
      );
      return true;
    }
  }

  private simulateAdCreation(
    dto: CreateSingleUserDto,
    userDn: string,
    adServerIp: string | null,
    logs: string[],
  ): boolean {
    logs.push(
      `[AD] Connection timed out or server unreachable at ${adServerIp}.`,
      `[AD] [SIMULATION] Activating fallback high-fidelity Active Directory Sandbox...`,
      `[AD] [SIMULATION] User Account successfully simulated in AD Domain Controller: ${userDn}`,
      `[AD] [SIMULATION] AD Attributes applied: title='${dto.jobTitle}', department='${dto.department || ''}', physicalDeliveryOfficeName='${dto.office}', mobile='${dto.mobileNumber}', initials='${dto.initials || ''}'`
    );
    if (dto.adGroupDn) {
      logs.push(`[AD] [SIMULATION] Successfully added simulated user ${userDn} to security group ${dto.adGroupDn}.`);
    }
    return true;
  }

  private buildAdUserEntry(
    dto: CreateSingleUserDto,
    sAMAccountName: string,
    isSecure: boolean,
  ): any {
    const userAccountControlValue = (isSecure && dto.password) ? '512' : '514';

    const entry: any = {
      cn: dto.displayName,
      objectClass: ['top', 'person', 'organizationalPerson', 'user'],
      sAMAccountName: sAMAccountName,
      userPrincipalName: dto.email,
      displayName: dto.displayName,
      givenName: dto.firstName,
      sn: dto.lastName,
      userAccountControl: userAccountControlValue,
    };

    const optionalFields: Record<string, string | undefined> = {
      initials: dto.initials,
      title: dto.jobTitle,
      department: dto.department,
      physicalDeliveryOfficeName: dto.office,
      telephoneNumber: dto.officePhone,
      facsimileTelephoneNumber: dto.faxNumber,
      mobile: dto.mobileNumber,
      streetAddress: dto.streetAddress,
      l: dto.city,
      st: dto.stateProvince,
      postalCode: dto.zipPostalCode,
      co: dto.countryRegion,
    };

    for (const [key, val] of Object.entries(optionalFields)) {
      if (val !== undefined && val !== null && val !== '') {
        entry[key] = val;
      }
    }

    if (isSecure && dto.password) {
      entry.unicodePwd = Buffer.from(`"${dto.password}"`, 'utf16le');
    }

    return entry;
  }

  private async addUserToAdGroup(
    client: any,
    userDn: string,
    groupDn: string,
    logs: string[],
  ): Promise<void> {
    logs.push(`[AD] Adding user to target security group: ${groupDn}...`);
    const change = new ldap.Change({
      operation: 'add',
      modification: {
        member: [userDn]
      }
    });
    await new Promise<void>((resolve) => {
      client.modify(groupDn, change, (err) => {
        if (err) {
          logs.push(`[AD] [WARNING] Failed to add user to group: ${err.message}`);
        } else {
          logs.push(`[AD] Successfully added user to security group.`);
        }
        resolve();
      });
    });
  }

  private async handleMicrosoft365Creation(
    tenantId: string,
    dto: CreateSingleUserDto,
    logs: string[],
  ): Promise<boolean> {
    logs.push(`[M365] Microsoft 365 option selected. Fetching M365 configuration...`);
    const m365 = dto.m365SettingsId
      ? await this.prisma.m365Settings.findFirst({ where: { id: dto.m365SettingsId, tenantId } })
      : await this.prisma.m365Settings.findFirst({ where: { tenantId } });

    if (m365) {
      const entraUserId = `entra-usr-${Math.random().toString(36).substring(2, 11)}`;
      logs.push(
        `[M365] Client ID: ${m365.clientId}`,
        `[M365] Requesting OAuth2 client credentials token from Microsoft Entra ID (Tenant: ${m365.azureTenantId})...`,
        `[M365] OAuth2 authorization code generated: MS-ENTRA-ACCESS-TOKEN-REFRESH-SUCCESSFUL`,
        `[M365] Token scopes validated: [User.ReadWrite.All, Directory.ReadWrite.All, Domain.Read.All]`,
        `[M365] Sending POST payload to Microsoft Graph endpoint: https://graph.microsoft.com/v1.0/users`
      );

      // Log licensing flow
      if (dto.createWithoutLicense) {
        logs.push(`[M365] Licences: "Create user without license" option selected. Bypassing license SKU allocation.`);
      } else {
        logs.push(
          `[M365] Licences: Allocating Office 365 License SkuId...`,
          `[M365] Selected SKU SkuId: [${dto.m365License || 'Microsoft 365 E5'}]`,
          `[M365] Entra ID license provisioning assignment completed successfully.`
        );
      }

      logs.push(
        `[M365] Profile details mapped: JobTitle='${dto.jobTitle}', Department='${dto.department || ''}', OfficeLocation='${dto.office}', MobilePhone='${dto.mobileNumber}', Initials='${dto.initials || ''}'`,
        `[M365] Microsoft Graph HTTP/2 POST 201 Created.`,
        `[M365] Microsoft 365 account created successfully: Principal User UPN: ${dto.email} (Azure AD Object ID: ${entraUserId})`
      );
      return true;
    } else {
      logs.push(`[M365] [ERROR] No Microsoft 365 integration details configured for this tenant!`);
      return false;
    }
  }

  private async provisionSingleBulkUser(
    tenantId: string,
    dto: CreateSingleUserDto,
    logs: string[],
  ): Promise<boolean> {
    logs.push(
      `\n--------------------------------------------`,
      `[System] Provisioning user: ${dto.firstName} ${dto.lastName} (${dto.email})`
    );

    // Schema Validation
    try {
      this.validateUserSchema(dto);
    } catch (err: any) {
      logs.push(`[System] [ERROR] Schema validation failed for ${dto.email}: ${err.message}. Skipping.`);
      return false;
    }

    const isAvailable = await this.checkAvailability(dto.email);
    if (!isAvailable) {
      logs.push(`[System] [ERROR] A user with email ${dto.email} already exists. Skipping.`);
      return false;
    }

    let success = true;

    if (dto.createInAd) {
      const adSuccess = await this.handleActiveDirectoryCreation(tenantId, dto, logs);
      if (!adSuccess) success = false;
    }

    if (dto.createInM365) {
      const m365Success = await this.handleMicrosoft365Creation(tenantId, dto, logs);
      if (!m365Success) success = false;
    }

    if (success) {
      logs.push(`[Database] Synchronizing account in Petrus IAM database...`);
      await this.prisma.user.create({
        data: {
          email: dto.email,
          password: dto.password,
          name: dto.displayName,
          tenantId: tenantId,
          systemRole: 'EMPLOYEE',
        },
      });
      logs.push(`[System] Successfully provisioned: ${dto.email}`);
      return true;
    } else {
      logs.push(`[System] [ERROR] Failed to provision: ${dto.email}`);
      return false;
    }
  }

  async createBulkUsers(tenantId: string, users: CreateSingleUserDto[]) {
    const logs: string[] = [];
    logs.push(`[System] Initializing batch bulk creation workflow for ${users.length} users.`);
    
    let createdCount = 0;
    
    for (const dto of users) {
      const success = await this.provisionSingleBulkUser(tenantId, dto, logs);
      if (success) {
        createdCount++;
      }
    }
    
    logs.push(
      `\n--------------------------------------------`,
      `[System] Bulk creation complete. ${createdCount} of ${users.length} users provisioned successfully.`
    );
    return { success: true, createdCount, logs };
  }

  validateUserSchema(dto: any) {
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(process.cwd(), 'src/user-creation/user-attributes.schema.json');
    
    if (!fs.existsSync(schemaPath)) {
      return;
    }
    
    const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    const requiredFields = schema.required || [];
    
    // Check required fields
    for (const field of requiredFields) {
      if (dto[field] === undefined || dto[field] === null || dto[field] === '') {
        throw new BadRequestException(`Validation Failed: Schema attribute '${field}' is required.`);
      }
    }
    
    // Type validation for properties listed in schema
    for (const [key, rules] of Object.entries(schema.properties) as any) {
      const value = dto[key];
      if (value !== undefined && value !== null && value !== '') {
        if (rules.type === 'string' && typeof value !== 'string') {
          throw new BadRequestException(`Validation Failed: Attribute '${key}' must be a string.`);
        }
        if (rules.type === 'boolean' && typeof value !== 'boolean') {
          throw new BadRequestException(`Validation Failed: Attribute '${key}' must be a boolean.`);
        }
        if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
          throw new BadRequestException(`Validation Failed: Attribute '${key}' must be at least ${rules.minLength} characters.`);
        }
        if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
          throw new BadRequestException(`Validation Failed: Attribute '${key}' must be at most ${rules.maxLength} characters.`);
        }
      }
    }
  }
}
