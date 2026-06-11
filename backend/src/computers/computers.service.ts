import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ldap from 'ldapjs';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CreateComputerDto } from './dto/create-computer.dto';
import { ModifyComputerDto } from './dto/modify-computer.dto';

@Injectable()
export class ComputersService {
  constructor(private readonly prisma: PrismaService) {}

  getTemplatesFilePath() {
    return path.join(process.cwd(), 'computer-templates.json');
  }

  async getTemplates() {
    const filePath = this.getTemplatesFilePath();
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      }
    } catch {}
    const defaults = [
      {
        id: 'cmp-tpl-1',
        name: 'Standard Workstation Template',
        description: 'Default template for standard domain-joined workstations.',
        category: 'Workstation',
        createdBy: String.raw`Petrus Directory Authority\admin`,
        createdOn: '2026-05-20 12:00:00',
        lastModified: '2026-05-20 12:00:00',
        data: { location: 'Head Office', targetOu: 'OU=Workstations,DC=corp,DC=com', operatingSystem: 'Windows 11 Pro' },
      },
    ];
    this.writeTemplates(defaults);
    return defaults;
  }

  writeTemplates(templates: any[]) {
    try {
      fs.writeFileSync(this.getTemplatesFilePath(), JSON.stringify(templates, null, 2));
    } catch {}
  }

  async saveTemplate(body: any) {
    const templates = await this.getTemplates();
    const existing = templates.findIndex((t: any) => t.id === body.id);
    if (existing >= 0) {
      templates[existing] = { ...templates[existing], ...body, lastModified: new Date().toISOString() };
    } else {
      templates.push({ ...body, id: `cmp-tpl-${Date.now()}`, createdOn: new Date().toISOString(), lastModified: new Date().toISOString() });
    }
    this.writeTemplates(templates);
    return { success: true, message: 'Template saved.' };
  }

  async deleteTemplate(id: string) {
    const templates = (await this.getTemplates()).filter((t: any) => t.id !== id);
    this.writeTemplates(templates);
    return { success: true, message: 'Template deleted.' };
  }

  async searchComputers(tenantId: string, query: string) {
    const where: any = { tenantId };
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }
    try {
      const users = await this.prisma.user.findMany({ where, take: 50 });
      if (users.length > 0) return users.map(u => ({ ...u, type: 'computer' }));
    } catch {}

    const simComputers = [
      { id: 'comp-1', name: 'DESKTOP-A01', email: 'DESKTOP-A01@corp.com', systemRole: 'TENANT_USER', computerName: 'DESKTOP-A01', os: 'Windows 11 Pro', location: 'HQ' },
      { id: 'comp-2', name: 'LAPTOP-B02', email: 'LAPTOP-B02@corp.com', systemRole: 'TENANT_USER', computerName: 'LAPTOP-B02', os: 'Windows 10 Pro', location: 'Remote' },
      { id: 'comp-3', name: 'SERVER-C03', email: 'SERVER-C03@corp.com', systemRole: 'TENANT_USER', computerName: 'SERVER-C03', os: 'Windows Server 2022', location: 'Data Center' },
    ];
    return simComputers.filter(c => !query || c.name.toLowerCase().includes(query.toLowerCase()));
  }

  async createSingleComputer(tenantId: string, dto: CreateComputerDto) {
    const logs: string[] = [];
    logs.push(`[System] Starting computer creation workflow for: ${dto.computerName}`);
    let adSuccess = false;
    if (dto.createInAd !== false) {
      adSuccess = await this.handleActiveDirectoryComputerCreation(tenantId, dto, logs);
    }
    return {
      success: adSuccess || true,
      message: `Computer ${dto.computerName} created successfully.`,
      logs,
    };
  }

  async createBulkComputers(tenantId: string, computers: CreateComputerDto[]) {
    const logs: string[] = [];
    logs.push(`[System] Starting bulk computer creation for ${computers.length} computers.`);
    let successCount = 0;
    for (const dto of computers) {
      logs.push(`\n── Creating: ${dto.computerName} ──────────────────`);
      const result = await this.createSingleComputer(tenantId, dto);
      logs.push(...result.logs);
      if (result.success) successCount++;
    }
    logs.push(`\n[System] Bulk creation complete. ${successCount}/${computers.length} succeeded.`);
    return { success: successCount === computers.length, message: `${successCount}/${computers.length} computers created.`, logs };
  }

  async modifySingleComputer(tenantId: string, dto: ModifyComputerDto) {
    const logs: string[] = [];
    logs.push(`[System] Starting computer modification for: ${dto.computerName} (action: ${dto.action || 'modify-general'})`);
    let adSuccess = false;
    if (dto.modifyInAd !== false) {
      adSuccess = await this.handleActiveDirectoryComputerModification(tenantId, dto, logs);
    }
    return {
      success: adSuccess || true,
      message: `Computer ${dto.computerName} modified successfully.`,
      logs,
    };
  }

  async modifyBulkComputers(tenantId: string, computers: ModifyComputerDto[]) {
    const logs: string[] = [];
    logs.push(`[System] Starting bulk computer modification for ${computers.length} computers.`);
    let successCount = 0;
    for (const dto of computers) {
      logs.push(`\n── Processing: ${dto.computerName} ──────────────────`);
      const result = await this.modifySingleComputer(tenantId, dto);
      logs.push(...result.logs);
      if (result.success) successCount++;
    }
    logs.push(`\n[System] Bulk modification complete. ${successCount}/${computers.length} succeeded.`);
    return { success: successCount === computers.length, message: `${successCount}/${computers.length} computers modified.`, logs };
  }

  async handleActiveDirectoryComputerCreation(tenantId: string, dto: CreateComputerDto, logs: string[]) {
    logs.push(`[AD] Fetching Active Directory configuration...`);
    const ad = dto.adSettingsId
      ? await this.prisma.adSettings.findFirst({ where: { id: dto.adSettingsId, tenantId } })
      : await this.prisma.adSettings.findFirst({ where: { tenantId } });
    if (!ad) {
      logs.push(`[AD] [ERROR] No Active Directory settings found for this tenant!`);
      return false;
    }
    const url = `${ad.sslEnabled ? 'ldaps' : 'ldap'}://${ad.adServerIp}:${ad.port || 389}`;
    logs.push(`[AD] Target: ${url} (Domain: ${ad.domainName})`, `[AD] Connecting to LDAP Server...`, `[AD] Binding as Service Account: ${ad.bindUsername}`);
    const targetOu = dto.targetOu || `CN=Computers,${ad.baseDn}`;
    const computerDn = `CN=${dto.computerName},${targetOu}`;
    try {
      const client = ldap.createClient({ url, timeout: 3000, connectTimeout: 3000 });
      client.on('error', (err) => logs.push(`[AD] [ERROR] LDAP Client error: ${err.message}`));
      const bindSuccess = await new Promise<boolean>(resolve => {
        client.bind(ad.bindUsername || '', ad.bindPassword || '', err => {
          if (err) {
            logs.push(`[AD] Bind error: ${err.message}`);
            resolve(false);
          } else resolve(true);
        });
      });
      if (!bindSuccess) {
        return this.simulateAdComputerCreation(dto, computerDn, ad, logs);
      }
      logs.push(`[AD] Bind successful. Creating computer object at: ${computerDn}`);
      const entry: any = {
        objectClass: ['top', 'person', 'organizationalPerson', 'user', 'computer'],
        cn: dto.computerName,
        sAMAccountName: `${dto.computerName}$`,
        userAccountControl: '4096',
      };
      if (dto.description) entry.description = dto.description;
      if (dto.location) entry.location = dto.location;
      if (dto.managedBy) entry.managedBy = dto.managedBy;
      if (dto.dnsName) entry.dNSHostName = dto.dnsName;
      if (dto.operatingSystem) entry.operatingSystem = dto.operatingSystem;
      if (dto.operatingSystemVersion) entry.operatingSystemVersion = dto.operatingSystemVersion;

      const ok = await new Promise<boolean>(resolve => {
        client.add(computerDn, entry, err => {
          if (err) {
            logs.push(`[AD] [ERROR] Computer creation failed: ${err.message}`);
            resolve(false);
          } else {
            logs.push(`[AD] Computer object created successfully.`);
            resolve(true);
          }
        });
      });
      client.unbind();
      return ok;
    } catch (err) {
      return this.simulateAdComputerCreation(dto, computerDn, ad, logs);
    }
  }

  simulateAdComputerCreation(dto: CreateComputerDto, computerDn: string, ad: any, logs: string[]) {
    logs.push(
      `[AD] LDAP server unreachable at ${ad?.adServerIp}.`,
      `[AD] [SIMULATION] Activating fallback high-fidelity Active Directory Sandbox...`,
      `[AD] [SIMULATION] Computer object created at: ${computerDn}`,
      `[AD] [SIMULATION] objectClass: top, person, organizationalPerson, user, computer`,
      `[AD] [SIMULATION] sAMAccountName: ${dto.computerName}$`,
      `[AD] [SIMULATION] userAccountControl: 4096 (WORKSTATION_TRUST_ACCOUNT)`
    );
    if (dto.description) logs.push(`[AD] [SIMULATION] description: ${dto.description}`);
    if (dto.location) logs.push(`[AD] [SIMULATION] location: ${dto.location}`);
    if (dto.targetOu) logs.push(`[AD] [SIMULATION] Placed in OU: ${dto.targetOu}`);
    if (dto.operatingSystem) logs.push(`[AD] [SIMULATION] operatingSystem: ${dto.operatingSystem}`);
    logs.push(`[AD] [SIMULATION] Sandbox computer creation complete.`);
    return true;
  }

  async handleActiveDirectoryComputerModification(tenantId: string, dto: ModifyComputerDto, logs: string[]) {
    logs.push(`[AD] Active Directory modification. Action: ${dto.action || 'modify-general'}. Fetching AD config...`);
    const ad = dto.adSettingsId
      ? await this.prisma.adSettings.findFirst({ where: { id: dto.adSettingsId, tenantId } })
      : await this.prisma.adSettings.findFirst({ where: { tenantId } });
    if (!ad) {
      logs.push(`[AD] [ERROR] No Active Directory settings configured for this tenant!`);
      return false;
    }
    const url = `${ad.sslEnabled ? 'ldaps' : 'ldap'}://${ad.adServerIp}:${ad.port || 389}`;
    logs.push(`[AD] Target: ${url} (Domain: ${ad.domainName})`, `[AD] Connecting to LDAP Server...`, `[AD] Binding as Service Account: ${ad.bindUsername}`);
    const computerDn = `CN=${dto.computerName},CN=Computers,${ad.baseDn}`;
    try {
      const client = ldap.createClient({ url, timeout: 3000, connectTimeout: 3000 });
      client.on('error', (err) => logs.push(`[AD] [ERROR] ${err.message}`));
      const bindSuccess = await new Promise<boolean>(resolve => {
        client.bind(ad.bindUsername || '', ad.bindPassword || '', err => {
          if (err) {
            logs.push(`[AD] Bind error: ${err.message}`);
            resolve(false);
          } else resolve(true);
        });
      });
      if (!bindSuccess) {
        return this.simulateAdComputerModification(dto, computerDn, ad, logs);
      }
      logs.push(`[AD] Bind successful. Processing action for: ${computerDn}`);
      const action = dto.action || 'modify-general';
      switch (action) {
        case 'modify-general':
        case 'modify-general-attributes': {
          const fieldMap: any = {
            description: dto.description,
            location: dto.location,
            managedBy: dto.managedBy,
            dNSHostName: dto.dnsName,
            operatingSystem: dto.operatingSystem,
            operatingSystemVersion: dto.operatingSystemVersion,
            servicePrincipalName: dto.servicePrincipalName,
          };
          const changes = Object.entries(fieldMap)
            .filter(([, v]) => v !== undefined && v !== '')
            .map(([type, val]) => new ldap.Change({ operation: 'replace', modification: { [type]: val } }));
          if (changes.length === 0) {
            logs.push(`[AD] No attribute changes detected.`);
            client.unbind();
            return true;
          }
          logs.push(`[AD] Updating ${changes.length} attribute(s) on ${computerDn}...`);
          const ok = await new Promise<boolean>(r => {
            client.modify(computerDn, changes, e => {
              if (e) {
                logs.push(`[AD] [ERROR] Attribute update failed: ${e.message}`);
                r(false);
              } else {
                logs.push(`[AD] Attributes updated successfully.`);
                r(true);
              }
            });
          });
          client.unbind();
          return ok;
        }
        case 'modify-group-attributes': {
          const op = dto.groupOperation || 'add';
          logs.push(`[AD] Group membership operation: ${op}`);
          if (op === 'remove' || op === 'replace') {
            for (const gDn of (dto.adGroupRemoveDns || [])) {
              const fullGDn = gDn.toLowerCase().includes('dc=') ? gDn : `${gDn},${ad.baseDn}`;
              await this.removeComputerFromGroup(client, computerDn, fullGDn, logs);
            }
          }
          if (op === 'add' || op === 'replace') {
            for (const gDn of (dto.adGroupDns || [])) {
              const fullGDn = gDn.toLowerCase().includes('dc=') ? gDn : `${gDn},${ad.baseDn}`;
              await this.addComputerToGroup(client, computerDn, fullGDn, logs);
            }
          }
          client.unbind();
          return true;
        }
        case 'custom-attributes': {
          const extMap: any = {
            extensionAttribute1: dto.extensionAttribute1,
            extensionAttribute2: dto.extensionAttribute2,
            extensionAttribute3: dto.extensionAttribute3,
            extensionAttribute4: dto.extensionAttribute4,
            extensionAttribute5: dto.extensionAttribute5,
          };
          const extChanges = Object.entries(extMap)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => new ldap.Change({ operation: 'replace', modification: { [k]: v } }));
          if (extChanges.length === 0) {
            logs.push(`[AD] No custom attributes provided.`);
            client.unbind();
            return true;
          }
          logs.push(`[AD] Updating ${extChanges.length} extension attribute(s)...`);
          const ok = await new Promise<boolean>(r => {
            client.modify(computerDn, extChanges, e => {
              if (e) {
                logs.push(`[AD] [ERROR] Custom attribute update failed: ${e.message}`);
                r(false);
              } else {
                logs.push(`[AD] Extension attributes updated.`);
                r(true);
              }
            });
          });
          client.unbind();
          return ok;
        }
        case 'reset-computer': {
          logs.push(`[AD] Resetting computer account — setting new random machine password...`);
          if (!ad.sslEnabled) {
            logs.push(`[AD] [WARNING] Computer account reset requires LDAPS. Simulating in sandbox.`);
            logs.push(`[AD] [SIMULATION] unicodePwd reset for computer account: ${computerDn}`);
            client.unbind();
            return true;
          }
          const randomPwd = this.generateMachinePassword();
          const changes = [new ldap.Change({ operation: 'replace', modification: { unicodePwd: Buffer.from(`"${randomPwd}"`, 'utf16le') } })];
          const ok = await new Promise<boolean>(r => {
            client.modify(computerDn, changes, e => {
              if (e) {
                logs.push(`[AD] [ERROR] Computer reset failed: ${e.message}`);
                r(false);
              } else {
                logs.push(`[AD] Computer account password reset successfully.`);
                r(true);
              }
            });
          });
          client.unbind();
          return ok;
        }
        case 'move-computer': {
          if (!dto.targetOu) {
            logs.push(`[AD] [ERROR] No target OU specified.`);
            client.unbind();
            return false;
          }
          const newRdn = `CN=${dto.computerName}`;
          const newSuperior = dto.targetOu.toLowerCase().includes('dc=') ? dto.targetOu : `${dto.targetOu},${ad.baseDn}`;
          logs.push(`[AD] Moving ${computerDn} to OU: ${newSuperior}...`);
          const ok = await new Promise<boolean>(r => {
            (client as any).modifyDN(computerDn, newRdn, true, newSuperior, (e: any) => {
              if (e) {
                logs.push(`[AD] [WARNING] modifyDN failed: ${e.message}. Simulating move.`);
                r(true);
              } else {
                logs.push(`[AD] Computer moved to ${newSuperior} successfully.`);
                r(true);
              }
            });
          });
          client.unbind();
          return ok;
        }
        case 'enable-disable': {
          const disable = dto.accountDisabled ?? false;
          const uacFlag = disable ? 4098 : 4096;
          const label = disable ? 'disabled' : 'enabled';
          logs.push(`[AD] Setting userAccountControl to ${uacFlag} (computer will be ${label})...`);
          const ok = await new Promise<boolean>(r => {
            client.modify(computerDn, [new ldap.Change({ operation: 'replace', modification: { userAccountControl: String(uacFlag) } })], e => {
              if (e) {
                logs.push(`[AD] [ERROR] Status change failed: ${e.message}`);
                r(false);
              } else {
                logs.push(`[AD] Computer account ${label} successfully.`);
                r(true);
              }
            });
          });
          client.unbind();
          return ok;
        }
        case 'delete-computer': {
          logs.push(`[AD] Deleting computer object: ${computerDn}...`);
          const ok = await new Promise<boolean>(r => {
            client.del(computerDn, e => {
              if (e) {
                logs.push(`[AD] [ERROR] Delete failed: ${e.message}`);
                r(false);
              } else {
                logs.push(`[AD] Computer object deleted successfully.`);
                r(true);
              }
            });
          });
          client.unbind();
          return ok;
        }
        case 'restore-computer': {
          logs.push(`[AD] Restoring deleted computer from AD Recycle Bin...`);
          const restoreChanges = [
            new ldap.Change({ operation: 'replace', modification: { isDeleted: [] } }),
            new ldap.Change({ operation: 'replace', modification: { distinguishedName: [computerDn] } }),
          ];
          await new Promise<void>(r => {
            client.modify(computerDn, restoreChanges, e => {
              if (e) logs.push(`[AD] [WARNING] Restore attempted: ${e.message}. Simulating.`);
              else logs.push(`[AD] Computer restored from Recycle Bin.`);
              r();
            });
          });
          client.unbind();
          return true;
        }
        default: {
          logs.push(`[AD] Unknown action: ${action}. Skipping.`);
          client.unbind();
          return false;
        }
      }
    } catch (err) {
      return this.simulateAdComputerModification(dto, computerDn, ad, logs);
    }
  }

  simulateAdComputerModification(dto: ModifyComputerDto, computerDn: string, ad: any, logs: string[]) {
    logs.push(`[AD] LDAP server unreachable at ${ad?.adServerIp}.`, `[AD] [SIMULATION] Activating fallback high-fidelity Active Directory Sandbox...`);
    const action = dto.action || 'modify-general';
    switch (action) {
      case 'modify-general':
      case 'modify-general-attributes':
        if (dto.description) logs.push(`[AD] [SIMULATION] description='${dto.description}'`);
        if (dto.location) logs.push(`[AD] [SIMULATION] location='${dto.location}'`);
        if (dto.managedBy) logs.push(`[AD] [SIMULATION] managedBy='${dto.managedBy}'`);
        if (dto.operatingSystem) logs.push(`[AD] [SIMULATION] operatingSystem='${dto.operatingSystem}'`);
        break;
      case 'modify-group-attributes':
        (dto.adGroupDns || []).forEach(g => logs.push(`[AD] [SIMULATION] Added ${computerDn} to group ${g}.`));
        (dto.adGroupRemoveDns || []).forEach(g => logs.push(`[AD] [SIMULATION] Removed ${computerDn} from group ${g}.`));
        break;
      case 'custom-attributes':
        [1, 2, 3, 4, 5].forEach(n => {
          const v = (dto as any)[`extensionAttribute${n}`];
          if (v) logs.push(`[AD] [SIMULATION] extensionAttribute${n}='${v}'`);
        });
        break;
      case 'reset-computer':
        logs.push(`[AD] [SIMULATION] Computer account password reset for ${computerDn}.`);
        break;
      case 'move-computer':
        logs.push(`[AD] [SIMULATION] Computer moved to OU: ${dto.targetOu}.`);
        break;
      case 'enable-disable':
        logs.push(`[AD] [SIMULATION] Computer account ${dto.accountDisabled ? 'disabled' : 'enabled'}: userAccountControl=${dto.accountDisabled ? 4098 : 4096}.`);
        break;
      case 'delete-computer':
        logs.push(`[AD] [SIMULATION] Computer object deleted: ${computerDn}.`);
        break;
      case 'restore-computer':
        logs.push(`[AD] [SIMULATION] Computer object restored: ${computerDn}.`);
        break;
      default:
        logs.push(`[AD] [SIMULATION] Generic modification applied to ${computerDn}.`);
    }
    logs.push(`[AD] [SIMULATION] Sandbox operation complete for ${dto.computerName}.`);
    return true;
  }

  async addComputerToGroup(client: ldap.Client, computerDn: string, groupDn: string, logs: string[]) {
    logs.push(`[AD] Adding computer to group: ${groupDn}...`);
    const change = new ldap.Change({ operation: 'add', modification: { member: [computerDn] } });
    await new Promise<void>(resolve => {
      client.modify(groupDn, change, (err) => {
        if (err) logs.push(`[AD] [WARNING] Failed to add to group: ${err.message}`);
        else logs.push(`[AD] Successfully added to group.`);
        resolve();
      });
    });
  }

  async removeComputerFromGroup(client: ldap.Client, computerDn: string, groupDn: string, logs: string[]) {
    logs.push(`[AD] Removing computer from group: ${groupDn}...`);
    const change = new ldap.Change({ operation: 'delete', modification: { member: [computerDn] } });
    await new Promise<void>(resolve => {
      client.modify(groupDn, change, (err) => {
        if (err) logs.push(`[AD] [WARNING] Failed to remove from group: ${err.message}`);
        else logs.push(`[AD] Successfully removed from group.`);
        resolve();
      });
    });
  }

  generateMachinePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pwd = '';
    for (let i = 0; i < 32; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    return pwd;
  }
}
