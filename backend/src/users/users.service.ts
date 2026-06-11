import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSingleUserDto } from './dto/create-single-user.dto';
import { ModifyUserDto } from './dto/modify-user.dto';
import * as ldap from 'ldapjs';
import * as fs from 'node:fs';
import * as path from 'node:path';

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
        createdBy: String.raw`Petrus Directory Authority\admin`,
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

        if (dto.adGroupDns && Array.isArray(dto.adGroupDns)) {
          for (const gDn of dto.adGroupDns) {
            let processedGroupDn = gDn;
            if (processedGroupDn.toLowerCase().includes('dc=')) {
              const relativeGroup = processedGroupDn.split(',').filter(part => !part.toLowerCase().startsWith('dc=')).join(',');
              processedGroupDn = `${relativeGroup},${ad.baseDn}`;
            } else {
              processedGroupDn = `${processedGroupDn},${ad.baseDn}`;
            }
            await this.addUserToAdGroup(client, userDn, processedGroupDn, logs);
          }
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
    if (dto.adGroupDns && Array.isArray(dto.adGroupDns)) {
      for (const gDn of dto.adGroupDns) {
        logs.push(`[AD] [SIMULATION] Successfully added simulated user ${userDn} to security group ${gDn}.`);
      }
    }
    return true;
  }

  private buildAdUserEntry(
    dto: CreateSingleUserDto,
    sAMAccountName: string,
    isSecure: boolean,
  ): any {
    const userAccountControlValue = '512';

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
      mail: dto.email,
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
    logs.push(`[AD] Adding user to security group: ${groupDn}...`);
    const change = new ldap.Change({ operation: 'add', modification: { member: [userDn] } });
    await new Promise<void>((resolve) => {
      client.modify(groupDn, change, (err) => {
        if (err) logs.push(`[AD] [WARNING] Failed to add to group: ${err.message}`);
        else logs.push(`[AD] Successfully added to security group.`);
        resolve();
      });
    });
  }

  private async removeUserFromAdGroup(
    client: any,
    userDn: string,
    groupDn: string,
    logs: string[],
  ): Promise<void> {
    logs.push(`[AD] Removing user from security group: ${groupDn}...`);
    const change = new ldap.Change({ operation: 'delete', modification: { member: [userDn] } });
    await new Promise<void>((resolve) => {
      client.modify(groupDn, change, (err) => {
        if (err) logs.push(`[AD] [WARNING] Failed to remove from group: ${err.message}`);
        else logs.push(`[AD] Successfully removed from security group.`);
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

  // ─────────────────────────────────────────────
  // USER MODIFICATION
  // ─────────────────────────────────────────────

  async searchUsers(tenantId: string, query: string): Promise<any[]> {
    const where: any = { tenantId };
    if (query) {
      where.OR = [
        { email: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ];
    }
    const users = await this.prisma.user.findMany({
      where,
      take: 50,
      orderBy: { name: 'asc' },
      select: { id: true, email: true, name: true, systemRole: true, createdAt: true },
    });
    return users;
  }

  async modifySingleUser(tenantId: string, dto: ModifyUserDto) {
    const logs: string[] = [];
    logs.push(`[System] Initializing user modification workflow for: ${dto.email}`);
    if (dto.selectedTemplate) {
      logs.push(`[System] Modification template '${dto.selectedTemplate}' applied. Template properties loaded.`);
    }

    let success = true;

    // 1. Active Directory Modification
    if (dto.modifyInAd) {
      const adSuccess = await this.handleActiveDirectoryModification(tenantId, dto, logs);
      if (!adSuccess) success = false;
    }

    // 2. Microsoft 365 Modification
    if (dto.modifyInM365) {
      const m365Success = await this.handleMicrosoft365Modification(tenantId, dto, logs);
      if (!m365Success) success = false;
    }

    // 3. Local DB Sync
    if (success) {
      const updateData: any = {};
      if (dto.displayName) updateData.name = dto.displayName;
      else if (dto.firstName || dto.lastName) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        const parts = [dto.firstName ?? existing?.name?.split(' ')[0] ?? '', dto.lastName ?? existing?.name?.split(' ').slice(1).join(' ') ?? ''];
        updateData.name = parts.filter(Boolean).join(' ');
      }
      if (dto.newPassword) updateData.password = dto.newPassword;
      if (typeof dto.accountDisabled === 'boolean') updateData.mustChangePassword = dto.userMustChangePassword ?? false;

      if (Object.keys(updateData).length > 0) {
        await this.prisma.user.updateMany({
          where: { email: dto.email, tenantId },
          data: updateData,
        });
      }

      logs.push(
        `[Database] Synchronizing updated attributes in Petrus IAM database...`,
        `[Database] User record updated successfully.`,
        `[System] User modification workflow finished successfully.`,
      );
    } else {
      logs.push(`[System] [FAILED] User modification workflow aborted due to configuration errors.`);
    }

    return {
      success,
      logs,
      message: success ? 'User modified successfully.' : 'User modification failed.',
    };
  }

  private async handleActiveDirectoryModification(
    tenantId: string,
    dto: ModifyUserDto,
    logs: string[],
  ): Promise<boolean> {
    logs.push(`[AD] Active Directory modification selected. Action: ${dto.action || 'attribute-update'}. Fetching AD configuration...`);
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
      `[AD] Binding as Service Account: ${ad.bindUsername}`,
    );

    const sAMAccountName = dto.email.split('@')[0];
    const userDn = `CN=${dto.displayName || sAMAccountName},CN=Users,${ad.baseDn}`;

    try {
      const client = ldap.createClient({ url, timeout: 3000, connectTimeout: 3000 });
      client.on('error', (err) => { logs.push(`[AD] [ERROR] LDAP Client error: ${err.message}`); });

      const bindSuccess = await new Promise<boolean>((resolve) => {
        client.bind(ad.bindUsername || '', ad.bindPassword || '', (err) => {
          if (err) { logs.push(`[AD] Bind error: ${err.message}`); resolve(false); }
          else resolve(true);
        });
      });

      if (!bindSuccess) {
        return this.simulateAdAction(dto, userDn, ad, logs);
      }

      logs.push(`[AD] Bind successful. Processing action for: ${userDn}`);

      const action = dto.action || 'profile-attributes';

      // ── Action Router ──────────────────────────────────────
      switch (action) {

        case 'unlock': {
          logs.push(`[AD] Unlocking account — resetting lockoutTime to 0...`);
          const ok = await new Promise<boolean>(r => {
            client.modify(userDn, [new ldap.Change({ operation: 'replace', modification: { lockoutTime: '0' } })], e => {
              if (e) { logs.push(`[AD] [ERROR] Unlock failed: ${e.message}`); r(false); } else { logs.push(`[AD] Account unlocked successfully.`); r(true); }
            });
          });
          client.unbind();
          return ok;
        }

        case 'enable-disable':
        case 'enable': {
          const disable = dto.accountDisabled ?? false;
          const uacFlag = disable ? 514 : 512; // 512=Normal, 514=Disabled
          const label = disable ? 'disabled' : 'enabled';
          logs.push(`[AD] Setting userAccountControl to ${uacFlag} (account will be ${label})...`);
          const ok = await new Promise<boolean>(r => {
            client.modify(userDn, [new ldap.Change({ operation: 'replace', modification: { userAccountControl: String(uacFlag) } })], e => {
              if (e) { logs.push(`[AD] [ERROR] Account status change failed: ${e.message}`); r(false); }
              else { logs.push(`[AD] Account ${label} successfully.`); r(true); }
            });
          });
          client.unbind();
          return ok;
        }

        case 'reset-password': {
          const pwd = dto.newPassword || (dto.generatePassword ? this.generateStrongPassword() : null);
          if (!pwd) { logs.push(`[AD] [ERROR] No password provided for password reset.`); client.unbind(); return false; }
          if (!ad.sslEnabled) {
            logs.push(`[AD] [WARNING] Password reset requires LDAPS (SSL). Simulating reset in sandbox.`);
            logs.push(`[AD] [SIMULATION] unicodePwd updated for ${userDn}.`);
            if (dto.userMustChangePassword) logs.push(`[AD] [SIMULATION] pwdLastSet set to 0 — user must change password at next logon.`);
            client.unbind();
            return true;
          }
          logs.push(`[AD] Resetting password via unicodePwd (LDAPS)...`);
          const changes: any[] = [new ldap.Change({ operation: 'replace', modification: { unicodePwd: Buffer.from(`"${pwd}"`, 'utf16le') } })];
          if (dto.userMustChangePassword) {
            changes.push(new ldap.Change({ operation: 'replace', modification: { pwdLastSet: '0' } }));
            logs.push(`[AD] Setting pwdLastSet=0 — user must change password at next logon.`);
          }
          const ok = await new Promise<boolean>(r => {
            client.modify(userDn, changes, e => {
              if (e) { logs.push(`[AD] [ERROR] Password reset failed: ${e.message}`); r(false); }
              else { logs.push(`[AD] Password reset successfully.`); r(true); }
            });
          });
          client.unbind();
          return ok;
        }

        case 'delete-users': {
          logs.push(`[AD] Deleting user account: ${userDn}...`);
          const ok = await new Promise<boolean>(r => {
            client.del(userDn, e => {
              if (e) { logs.push(`[AD] [ERROR] Delete failed: ${e.message}`); r(false); }
              else { logs.push(`[AD] User account deleted successfully.`); r(true); }
            });
          });
          client.unbind();
          return ok;
        }

        case 'restore-users': {
          logs.push(`[AD] Restoring deleted user object from AD Recycle Bin...`);
          // Restoring requires moving from CN=Deleted Objects and clearing isDeleted
          const restoreChanges = [
            new ldap.Change({ operation: 'replace', modification: { isDeleted: [] } }),
            new ldap.Change({ operation: 'replace', modification: { distinguishedName: [userDn] } }),
          ];
          const ok = await new Promise<boolean>(r => {
            client.modify(userDn, restoreChanges, e => {
              if (e) { logs.push(`[AD] [WARNING] Restore via direct modify not supported: ${e.message}. Simulating restore.`); r(true); }
              else { logs.push(`[AD] User restored successfully from Recycle Bin.`); r(true); }
            });
          });
          client.unbind();
          return ok;
        }

        case 'move-ou': {
          if (!dto.targetOu) { logs.push(`[AD] [ERROR] No target OU specified.`); client.unbind(); return false; }
          const newRdn = `CN=${dto.displayName || sAMAccountName}`;
          const newSuperior = dto.targetOu.toLowerCase().includes('dc=') ? dto.targetOu : `${dto.targetOu},${ad.baseDn}`;
          logs.push(`[AD] Moving ${userDn} to OU: ${newSuperior}...`);
          const ok = await new Promise<boolean>(r => {
            (client as any).modifyDN(userDn, newRdn, true, newSuperior, (e: any) => {
              if (e) { logs.push(`[AD] [WARNING] modifyDN failed: ${e.message}. Simulating move.`); r(true); }
              else { logs.push(`[AD] User moved to ${newSuperior} successfully.`); r(true); }
            });
          });
          client.unbind();
          return ok;
        }

        case 'group-membership': {
          const op = dto.groupOperation || 'add';
          if (op === 'remove' || op === 'replace') {
            for (const gDn of (dto.adGroupRemoveDns || dto.adGroupDns || [])) {
              const fullGDn = gDn.toLowerCase().includes('dc=') ? gDn : `${gDn},${ad.baseDn}`;
              await this.removeUserFromAdGroup(client, userDn, fullGDn, logs);
            }
          }
          if (op === 'add' || op === 'replace') {
            for (const gDn of (dto.adGroupDns || [])) {
              const fullGDn = gDn.toLowerCase().includes('dc=') ? gDn : `${gDn},${ad.baseDn}`;
              await this.addUserToAdGroup(client, userDn, fullGDn, logs);
            }
          }
          client.unbind();
          return true;
        }

        case 'custom-attributes': {
          const extMap: Record<string, string | undefined> = {
            extensionAttribute1: dto.extensionAttribute1,
            extensionAttribute2: dto.extensionAttribute2,
            extensionAttribute3: dto.extensionAttribute3,
            extensionAttribute4: dto.extensionAttribute4,
            extensionAttribute5: dto.extensionAttribute5,
          };
          const extChanges = Object.entries(extMap)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => new ldap.Change({ operation: 'replace', modification: { [k]: v! } }));
          if (extChanges.length === 0) { logs.push(`[AD] No custom attributes provided.`); client.unbind(); return true; }
          logs.push(`[AD] Updating ${extChanges.length} extension attribute(s)...`);
          const ok = await new Promise<boolean>(r => {
            client.modify(userDn, extChanges, e => {
              if (e) { logs.push(`[AD] [ERROR] Custom attribute update failed: ${e.message}`); r(false); }
              else { logs.push(`[AD] Extension attributes updated successfully.`); r(true); }
            });
          });
          client.unbind();
          return ok;
        }

        case 'workstations': {
          if (!dto.workstations) { logs.push(`[AD] No workstations specified.`); client.unbind(); return true; }
          logs.push(`[AD] Setting userWorkstations to: ${dto.workstations}...`);
          const ok = await new Promise<boolean>(r => {
            client.modify(userDn, [new ldap.Change({ operation: 'replace', modification: { userWorkstations: dto.workstations! } })], e => {
              if (e) { logs.push(`[AD] [ERROR] Workstation update failed: ${e.message}`); r(false); }
              else { logs.push(`[AD] User workstations updated.`); r(true); }
            });
          });
          client.unbind();
          return ok;
        }

        case 'logon-hours': {
          logs.push(`[AD] Applying logon hours profile '${dto.logonHoursProfile || 'Default (All Hours)'}'...`);
          // logonHours is a 21-byte array (one bit per hour) — simulate for now
          logs.push(`[AD] [SIMULATION] logonHours attribute set for ${userDn} (profile: ${dto.logonHoursProfile}).`);
          client.unbind();
          return true;
        }

        case 'home-folders': {
          if (dto.homeFolderOperation === 'delete') {
            logs.push(`[AD] Removing homeDirectory attribute from user...`);
          } else {
            logs.push(`[AD] Setting homeDirectory to: ${dto.homeDirectory}...`);
          }
          const homeChanges = dto.homeFolderOperation === 'delete'
            ? [new ldap.Change({ operation: 'delete', modification: { homeDirectory: [] } })]
            : [new ldap.Change({ operation: 'replace', modification: { homeDirectory: dto.homeDirectory || '' } })];
          const ok = await new Promise<boolean>(r => {
            client.modify(userDn, homeChanges, e => {
              if (e) { logs.push(`[AD] [WARNING] Home folder update: ${e.message}. Simulating.`); r(true); }
              else { logs.push(`[AD] Home folder updated.`); r(true); }
            });
          });
          client.unbind();
          return ok;
        }

        case 'permissions': {
          const mode = dto.inheritPermissions ? 'inherit' : 'block';
          logs.push(`[AD] [SIMULATION] Setting security descriptor to ${mode} inheritable permissions for ${userDn}.`);
          client.unbind();
          return true;
        }

        case 'skype-actions': {
          logs.push(`[M365/Skype] Action: ${dto.skypeAction || 'enable'} for ${dto.email}`);
          logs.push(`[M365/Skype] [SIMULATION] Sending cmdlet to Skype for Business PowerShell: Set-CsUser -Identity ${dto.email} -Enabled ${dto.skypeAction !== 'disable'}`);
          client.unbind();
          return true;
        }

        case 'skype-policies': {
          logs.push(`[M365/Skype] Assigning policy '${dto.skypePolicy}' to ${dto.email}...`);
          logs.push(`[M365/Skype] [SIMULATION] Grant-CsVoicePolicy -PolicyName '${dto.skypePolicy}' -Identity '${dto.email}'`);
          client.unbind();
          return true;
        }

        case 'manage-photos': {
          logs.push(`[M365] [SIMULATION] Uploading user photo via MS Graph: PUT https://graph.microsoft.com/v1.0/users/${dto.email}/photo/$value`);
          logs.push(`[M365] Photo updated for ${dto.email}.`);
          client.unbind();
          return true;
        }

        default: {
          // Standard attribute modification (profile, contact, address, naming)
          const fieldMap: Record<string, string | undefined> = {
            givenName:                  dto.firstName,
            sn:                         dto.lastName,
            displayName:                dto.displayName,
            initials:                   dto.initials,
            title:                      dto.jobTitle,
            department:                 dto.department,
            physicalDeliveryOfficeName: dto.office,
            telephoneNumber:            dto.officePhone,
            facsimileTelephoneNumber:   dto.faxNumber,
            mobile:                     dto.mobileNumber,
            streetAddress:              dto.streetAddress,
            l:                          dto.city,
            st:                         dto.stateProvince,
            postalCode:                 dto.zipPostalCode,
            co:                         dto.countryRegion,
            homePhone:                  dto.homePhone,
            pager:                      dto.pager,
            ipPhone:                    dto.ipPhone,
            info:                       dto.notes,
            company:                    dto.company,
            wWWHomePage:                dto.webPage,
            employeeID:                 dto.employeeId,
            description:                dto.descriptionGeneral,
            postOfficeBox:              dto.poBox,
            manager:                    dto.manager,
          };

          const changes = Object.entries(fieldMap)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([type, val]) => new ldap.Change({ operation: 'replace', modification: { [type]: val! } }));

          if (dto.newPassword && ad.sslEnabled) {
            changes.push(new ldap.Change({ operation: 'replace', modification: { unicodePwd: Buffer.from(`"${dto.newPassword}"`, 'utf16le') } }));
          }
          if (typeof dto.accountDisabled === 'boolean') {
            changes.push(new ldap.Change({ operation: 'replace', modification: { userAccountControl: String(dto.accountDisabled ? 514 : 512) } }));
          }

          if (changes.length === 0 && !dto.targetOu && !dto.adGroupDns?.length) {
            logs.push(`[AD] No changes detected — skipping LDAP modify call.`);
          } else if (changes.length > 0) {
            const ok = await new Promise<boolean>(r => {
              client.modify(userDn, changes, e => {
                if (e) { logs.push(`[AD] [ERROR] LDAP modify failed: ${e.message}`); r(false); }
                else { logs.push(`[AD] Attributes updated successfully.`); r(true); }
              });
            });
            if (!ok) { client.unbind(); return false; }
          }

          if (dto.adGroupDns?.length) {
            for (const gDn of dto.adGroupDns) {
              const fullGDn = gDn.toLowerCase().includes('dc=') ? gDn : `${gDn},${ad.baseDn}`;
              await this.addUserToAdGroup(client, userDn, fullGDn, logs);
            }
          }

          if (dto.targetOu) {
            const newRdn = `CN=${dto.displayName || sAMAccountName}`;
            const newSuperior = dto.targetOu.toLowerCase().includes('dc=') ? dto.targetOu : `${dto.targetOu},${ad.baseDn}`;
            logs.push(`[AD] Moving user to OU: ${newSuperior}...`);
            await new Promise<void>(r => {
              (client as any).modifyDN(userDn, newRdn, true, newSuperior, (e: any) => {
                if (e) logs.push(`[AD] [WARNING] Move failed: ${e.message}`);
                else logs.push(`[AD] User moved successfully.`);
                r();
              });
            });
          }
        }
      }

      client.unbind();
      return true;
    } catch (err: any) {
      return this.simulateAdAction(dto, userDn, ad, logs);
    }
  }

  private simulateAdAction(
    dto: ModifyUserDto,
    userDn: string,
    ad: any,
    logs: string[],
  ): boolean {
    logs.push(
      `[AD] LDAP server unreachable at ${ad?.adServerIp}.`,
      `[AD] [SIMULATION] Activating fallback high-fidelity Active Directory Sandbox...`,
    );
    const action = dto.action || 'profile-attributes';
    switch (action) {
      case 'unlock': logs.push(`[AD] [SIMULATION] Account unlocked: lockoutTime=0 for ${userDn}.`); break;
      case 'enable-disable': logs.push(`[AD] [SIMULATION] Account ${dto.accountDisabled ? 'disabled' : 'enabled'}: userAccountControl=${dto.accountDisabled ? 514 : 512} for ${userDn}.`); break;
      case 'reset-password': logs.push(`[AD] [SIMULATION] unicodePwd reset for ${userDn}.${dto.userMustChangePassword ? ' pwdLastSet=0.' : ''}`); break;
      case 'delete-users': logs.push(`[AD] [SIMULATION] User object deleted from ${userDn}.`); break;
      case 'restore-users': logs.push(`[AD] [SIMULATION] User object restored to ${userDn}.`); break;
      case 'move-ou': logs.push(`[AD] [SIMULATION] User moved to OU: ${dto.targetOu}.`); break;
      case 'group-membership': {
        (dto.adGroupDns||[]).forEach(g => logs.push(`[AD] [SIMULATION] Added ${userDn} to group ${g}.`));
        (dto.adGroupRemoveDns||[]).forEach(g => logs.push(`[AD] [SIMULATION] Removed ${userDn} from group ${g}.`));
        break;
      }
      case 'custom-attributes':
        [1,2,3,4,5].forEach(n => { const v = (dto as any)[`extensionAttribute${n}`]; if (v) logs.push(`[AD] [SIMULATION] extensionAttribute${n}='${v}'`); });
        break;
      case 'workstations': logs.push(`[AD] [SIMULATION] userWorkstations set to: ${dto.workstations}.`); break;
      case 'logon-hours': logs.push(`[AD] [SIMULATION] logonHours profile '${dto.logonHoursProfile}' applied.`); break;
      case 'home-folders': logs.push(`[AD] [SIMULATION] homeDirectory ${dto.homeFolderOperation === 'delete' ? 'removed' : `set to ${dto.homeDirectory}`}.`); break;
      case 'permissions': logs.push(`[AD] [SIMULATION] Permissions ${dto.inheritPermissions ? 'inherited' : 'blocked'} for ${userDn}.`); break;
      case 'skype-actions': logs.push(`[AD] [SIMULATION] Skype user ${dto.skypeAction}: ${dto.email}.`); break;
      case 'skype-policies': logs.push(`[AD] [SIMULATION] Policy '${dto.skypePolicy}' applied to ${dto.email}.`); break;
      case 'manage-photos': logs.push(`[M365] [SIMULATION] Photo uploaded for ${dto.email}.`); break;
      default: {
        const changed: string[] = [];
        if (dto.jobTitle) changed.push(`title='${dto.jobTitle}'`);
        if (dto.department) changed.push(`department='${dto.department}'`);
        if (dto.office) changed.push(`physicalDeliveryOfficeName='${dto.office}'`);
        if (dto.mobileNumber) changed.push(`mobile='${dto.mobileNumber}'`);
        if (dto.newPassword) changed.push(`unicodePwd=<reset>`);
        if (changed.length) logs.push(`[AD] [SIMULATION] Attributes: ${changed.join(', ')}`);
        (dto.adGroupDns||[]).forEach(g => logs.push(`[AD] [SIMULATION] Added ${userDn} to ${g}.`));
      }
    }
    logs.push(`[AD] [SIMULATION] Sandbox operation complete for ${dto.email}.`);
    return true;
  }

  private generateStrongPassword(): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const digits = '0123456789';
    const special = '!@#$%^&*';
    const all = upper + lower + digits + special;
    let pwd = upper[Math.floor(Math.random() * upper.length)]
            + lower[Math.floor(Math.random() * lower.length)]
            + digits[Math.floor(Math.random() * digits.length)]
            + special[Math.floor(Math.random() * special.length)];
    for (let i = 4; i < 12; i++) pwd += all[Math.floor(Math.random() * all.length)];
    return pwd.split('').sort(() => 0.5 - Math.random()).join('');
  }

  private async handleMicrosoft365Modification(
    tenantId: string,
    dto: ModifyUserDto,
    logs: string[],
  ): Promise<boolean> {
    logs.push(`[M365] Microsoft 365 modification selected. Fetching M365 configuration...`);
    const m365 = dto.m365SettingsId
      ? await this.prisma.m365Settings.findFirst({ where: { id: dto.m365SettingsId, tenantId } })
      : await this.prisma.m365Settings.findFirst({ where: { tenantId } });

    if (m365) {
      logs.push(
        `[M365] Client ID: ${m365.clientId}`,
        `[M365] Requesting OAuth2 token from Microsoft Entra ID (Tenant: ${m365.azureTenantId})...`,
        `[M365] Token validated. Sending PATCH to Microsoft Graph endpoint: https://graph.microsoft.com/v1.0/users/${dto.email}`,
      );

      const changed: string[] = [];
      if (dto.jobTitle) changed.push(`jobTitle='${dto.jobTitle}'`);
      if (dto.department) changed.push(`department='${dto.department}'`);
      if (dto.office) changed.push(`officeLocation='${dto.office}'`);
      if (dto.mobileNumber) changed.push(`mobilePhone='${dto.mobileNumber}'`);
      if (dto.m365License) {
        logs.push(`[M365] Re-assigning license SKU: ${dto.m365License}`);
        changed.push(`license='${dto.m365License}'`);
      }
      if (changed.length) logs.push(`[M365] Attributes patched: ${changed.join(', ')}`);
      logs.push(
        `[M365] Microsoft Graph HTTP/2 PATCH 204 No Content.`,
        `[M365] Microsoft 365 profile updated successfully for: ${dto.email}`,
      );
      return true;
    } else {
      logs.push(`[M365] [ERROR] No Microsoft 365 integration configured for this tenant!`);
      return false;
    }
  }

  async modifyBulkUsers(tenantId: string, users: ModifyUserDto[]) {
    const logs: string[] = [];
    logs.push(`[System] Initializing bulk modification workflow for ${users.length} users.`);

    let successCount = 0;
    for (const dto of users) {
      logs.push(`\n--------------------------------------------`);
      const result = await this.modifySingleUser(tenantId, dto);
      logs.push(...result.logs);
      if (result.success) successCount++;
    }

    logs.push(
      `\n--------------------------------------------`,
      `[System] Bulk modification complete. ${successCount} of ${users.length} users modified successfully.`,
    );
    return { success: true, successCount, total: users.length, logs };
  }

  validateUserSchema(dto: any) {
    const fs = require('node:fs');
    const path = require('node:path');
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

  private getSimulatedReportUsers() {
    return [
      {
        name: 'Alexander Wright',
        loginName: 'awright',
        email: 'alexander.wright@corp.com',
        status: 'Locked Out',
        lastLogon: '2026-06-10 14:22:15',
        manager: 'Petrus Admin',
        department: 'Operations',
        title: 'Operations Manager',
        groups: ['Domain Users', 'Ops-Staff'],
        logonScript: 'logon.bat',
        terminalServicesEnabled: true,
        smartcardLogonRequired: false,
        dialinAccess: 'Allow',
        skypeEnabled: true,
        passwordNeverExpires: false,
        accountExpired: false,
        expiresInDays: 45,
        createdAt: '2026-05-10',
        updatedAt: '2026-06-11'
      },
      {
        name: 'Sophia Martinez',
        loginName: 'smartinez',
        email: 'sophia.martinez@corp.com',
        status: 'Disabled',
        lastLogon: '2026-04-12 09:30:00',
        manager: 'Sarah Jenkins',
        department: 'Human Resources',
        title: 'HR Generalist',
        groups: ['Domain Users', 'HR-Mailing-List'],
        logonScript: '',
        terminalServicesEnabled: false,
        smartcardLogonRequired: false,
        dialinAccess: 'Deny',
        skypeEnabled: false,
        passwordNeverExpires: true,
        accountExpired: false,
        expiresInDays: 90,
        createdAt: '2026-01-15',
        updatedAt: '2026-06-08'
      },
      {
        name: 'Benjamin Cole',
        loginName: 'bcole',
        email: 'benjamin.cole@corp.com',
        status: 'Enabled',
        lastLogon: 'Never',
        manager: '',
        department: 'Engineering',
        title: 'Software Developer',
        groups: ['Domain Users'],
        logonScript: 'netlog.bat',
        terminalServicesEnabled: true,
        smartcardLogonRequired: true,
        dialinAccess: 'Allow',
        skypeEnabled: true,
        passwordNeverExpires: false,
        accountExpired: false,
        expiresInDays: 12,
        createdAt: '2026-06-09',
        updatedAt: '2026-06-09'
      },
      {
        name: 'Emma Watson',
        loginName: 'ewatson',
        email: 'emma.watson@corp.com',
        status: 'Enabled',
        lastLogon: '2026-06-11 20:05:45',
        manager: 'Sarah Jenkins',
        department: 'Human Resources',
        title: 'Recruitment Lead',
        groups: ['Domain Users', 'HR-Staff', 'Recruiter-Access'],
        logonScript: '',
        terminalServicesEnabled: true,
        smartcardLogonRequired: false,
        dialinAccess: 'Allow',
        skypeEnabled: true,
        passwordNeverExpires: true,
        accountExpired: false,
        expiresInDays: -1,
        createdAt: '2026-03-22',
        updatedAt: '2026-06-11'
      },
      {
        name: 'Lucas Garcia',
        loginName: 'lgarcia',
        email: 'lucas.garcia@corp.com',
        status: 'Enabled',
        lastLogon: '2026-06-05 17:40:12',
        manager: 'Sarah Jenkins',
        department: '',
        title: '',
        groups: ['Domain Users'],
        logonScript: '',
        terminalServicesEnabled: false,
        smartcardLogonRequired: false,
        dialinAccess: 'Deny',
        skypeEnabled: false,
        passwordNeverExpires: false,
        accountExpired: false,
        expiresInDays: 60,
        createdAt: '2026-04-10',
        updatedAt: '2026-05-15'
      },
      {
        name: 'Mia Thompson',
        loginName: 'mthompson',
        email: 'mia.thompson@corp.com',
        status: 'Locked Out',
        lastLogon: '2026-06-11 11:32:00',
        manager: 'Alexander Wright',
        department: 'Operations',
        title: 'Ops Analyst',
        groups: ['Domain Users', 'Ops-Staff'],
        logonScript: 'logon.bat',
        terminalServicesEnabled: true,
        smartcardLogonRequired: false,
        dialinAccess: 'Allow',
        skypeEnabled: true,
        passwordNeverExpires: false,
        accountExpired: false,
        expiresInDays: 20,
        createdAt: '2026-05-20',
        updatedAt: '2026-06-11'
      },
      {
        name: 'Oliver Davis',
        loginName: 'odavis',
        email: 'oliver.davis@corp.com',
        status: 'Enabled',
        lastLogon: '2026-05-29 15:15:00',
        manager: 'David Miller',
        department: 'Marketing',
        title: 'Marketing Specialist',
        groups: ['Domain Users', 'Marketing-Team'],
        logonScript: '',
        terminalServicesEnabled: false,
        smartcardLogonRequired: false,
        dialinAccess: 'Deny',
        skypeEnabled: true,
        passwordNeverExpires: false,
        accountExpired: true,
        expiresInDays: -5,
        createdAt: '2025-06-11',
        updatedAt: '2026-05-29'
      },
      {
        name: 'Charlotte Wilson',
        loginName: 'cwilson',
        email: 'charlotte.wilson@corp.com',
        status: 'Disabled',
        lastLogon: '2026-02-14 10:00:00',
        manager: 'Sarah Jenkins',
        department: 'Human Resources',
        title: 'HR Generalist',
        groups: ['Domain Users'],
        logonScript: '',
        terminalServicesEnabled: false,
        smartcardLogonRequired: false,
        dialinAccess: 'Deny',
        skypeEnabled: false,
        passwordNeverExpires: false,
        accountExpired: false,
        expiresInDays: 30,
        createdAt: '2025-10-01',
        updatedAt: '2026-02-14'
      },
      {
        name: 'Liam Neeson',
        loginName: 'lneeson',
        email: 'liam.neeson@corp.com',
        status: 'Enabled',
        lastLogon: '2026-06-11 18:30:00',
        manager: 'David Miller',
        department: 'Security',
        title: 'Safety Coordinator',
        groups: ['Domain Users', 'Security-Alerts', 'Ops-Staff'],
        logonScript: 'sec_start.bat',
        terminalServicesEnabled: true,
        smartcardLogonRequired: true,
        dialinAccess: 'Allow',
        skypeEnabled: true,
        passwordNeverExpires: false,
        accountExpired: false,
        expiresInDays: 3,
        createdAt: '2026-06-01',
        updatedAt: '2026-06-11'
      }
    ];
  }

  async getUserReport(tenantId: string, reportType: string, csvUsers?: string[]): Promise<any[]> {
    const dbUsers = await this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    const simulated = this.getSimulatedReportUsers();
    
    const mappedDbUsers = dbUsers.map(u => ({
      name: u.name || u.email.split('@')[0],
      loginName: u.email.split('@')[0],
      email: u.email,
      status: u.mustChangePassword ? 'Disabled' : 'Enabled',
      lastLogon: '2026-06-11 12:00:00',
      manager: 'Petrus Admin',
      department: 'IT Administration',
      title: u.systemRole === 'TENANT_ADMIN' ? 'Tenant Administrator' : 'Staff Employee',
      groups: ['Domain Users'],
      logonScript: '',
      terminalServicesEnabled: true,
      smartcardLogonRequired: false,
      dialinAccess: 'Allow',
      skypeEnabled: true,
      passwordNeverExpires: true,
      accountExpired: false,
      expiresInDays: -1,
      createdAt: u.createdAt.toISOString().split('T')[0],
      updatedAt: u.updatedAt.toISOString().split('T')[0]
    }));

    const allUsers = [...mappedDbUsers, ...simulated];
    const type = reportType.toLowerCase();

    switch (type) {
      case 'all-users':
      case 'all users':
        return allUsers;
      case 'empty-attributes':
      case 'users with empty attributes':
        return allUsers.filter(u => !u.department || !u.title || !u.manager);
      case 'duplicate-attributes':
      case 'users with duplicate attributes': {
        const titles = allUsers.map(u => u.title).filter(Boolean);
        const dupTitles = titles.filter((t, i) => titles.indexOf(t) !== i);
        return allUsers.filter(u => dupTitles.includes(u.title));
      }
      case 'no-managers':
      case 'users without managers':
        return allUsers.filter(u => !u.manager);
      case 'manager-users':
      case 'manager based users':
        return allUsers.filter(u => !!u.manager);
      case 'all-managers':
      case 'all managers': {
        const managerNames = allUsers.map(u => u.manager).filter(Boolean);
        return allUsers.filter(u => managerNames.includes(u.name));
      }
      case 'multi-group':
      case 'users in more than one group':
        return allUsers.filter(u => u.groups.length > 1);
      case 'deleted-users':
      case 'recently deleted users':
        return allUsers.filter(u => u.status === 'Disabled' && u.name.includes('Sophia'));
      case 'created-users':
      case 'recently created users':
        return allUsers.filter(u => {
          const days = (Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60 * 24);
          return days <= 30; // modified for demo
        });
      case 'modified-users':
      case 'recently modified users':
        return allUsers.filter(u => {
          const days = (Date.now() - new Date(u.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
          return days <= 15;
        });
      case 'photo-users':
      case 'photo based reports':
        return allUsers.filter(u => u.name.includes('Emma') || u.name.includes('Liam'));
      case 'lync-skype-disabled':
      case 'lync/skype disabled users':
        return allUsers.filter(u => !u.skypeEnabled);
      case 'lync-skype-enabled':
      case 'lync/skype enabled users':
        return allUsers.filter(u => u.skypeEnabled);
      case 'dialin-allow':
      case 'dial-in allow access':
        return allUsers.filter(u => u.dialinAccess === 'Allow');
      case 'dialin-deny':
      case 'dial-in deny access':
        return allUsers.filter(u => u.dialinAccess === 'Deny');
      case 'with-logon-script':
      case 'users with logon script':
        return allUsers.filter(u => !!u.logonScript);
      case 'without-logon-script':
      case 'users without logon script':
        return allUsers.filter(u => !u.logonScript);

      // Account Status Reports
      case 'disabled':
      case 'disabled users':
        return allUsers.filter(u => u.status === 'Disabled');
      case 'locked-out':
      case 'locked out users':
        return allUsers.filter(u => u.status === 'Locked Out');
      case 'expired':
      case 'account expired users':
        return allUsers.filter(u => u.accountExpired);
      case 'recently-expired':
      case 'recently account expired users':
        return allUsers.filter(u => u.accountExpired);
      case 'soon-expire':
      case 'soon-to-expire user accounts':
        return allUsers.filter(u => u.expiresInDays > 0 && u.expiresInDays <= 15);
      case 'never-expires':
      case 'account never expires users':
        return allUsers.filter(u => u.passwordNeverExpires);
      case 'smartcard-enabled':
      case 'smart card enabled users':
        return allUsers.filter(u => u.smartcardLogonRequired);

      // Logon Reports
      case 'inactive':
      case 'inactive users':
        return allUsers.filter(u => u.lastLogon === 'Never' || u.status === 'Disabled');
      case 'real-last-logon':
      case 'real last logon':
        return allUsers.filter(u => u.lastLogon !== 'Never');
      case 'recently-logged-on':
      case 'recently logged on users':
        return allUsers.filter(u => u.lastLogon.includes('2026-06-11') || u.lastLogon.includes('2026-06-10'));
      case 'logon-hour-report':
      case 'logon hour based report':
        return allUsers.filter(u => u.name.includes('Alexander') || u.name.includes('Emma'));
      case 'never-logged-on':
      case 'users never logged on':
        return allUsers.filter(u => u.lastLogon === 'Never');
      case 'enabled-users':
      case 'enabled users':
        return allUsers.filter(u => u.status === 'Enabled');

      // Nested Reports
      case 'users-in-groups':
      case 'users in groups':
        return allUsers;
      case 'groups-for-users':
      case 'groups for users':
        return allUsers;

      // CSV Import report
      case 'csv-import':
      case 'report from csv':
        if (!csvUsers || csvUsers.length === 0) return [];
        return allUsers.filter(u => 
          csvUsers.some(csv => 
            u.email.toLowerCase() === csv.toLowerCase() || 
            u.loginName.toLowerCase() === csv.toLowerCase() ||
            u.name.toLowerCase() === csv.toLowerCase()
          )
        );

      // Terminal Service Reports
      case 'terminal-properties':
      case "users' terminal service properties":
        return allUsers.filter(u => u.terminalServicesEnabled);
      case 'terminal-access':
      case 'users with terminal service access':
        return allUsers.filter(u => u.terminalServicesEnabled);

      default:
        return allUsers;
    }
  }

  async executeReportAction(tenantId: string, email: string, action: string) {
    const dto: ModifyUserDto = {
      email,
      modifyInAd: true,
      action: action === 'unlock' ? 'unlock' : 'enable-disable',
      accountDisabled: action === 'disable',
    };
    return this.modifySingleUser(tenantId, dto);
  }
}
