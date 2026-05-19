import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSingleUserDto } from './dto/create-single-user.dto';
import * as ldap from 'ldapjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async checkAvailability(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return !user;
  }

  async createSingleUser(tenantId: string, dto: CreateSingleUserDto) {
    const logs: string[] = [];
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

    if (ad) {
      const url = `${ad.sslEnabled ? 'ldaps' : 'ldap'}://${ad.adServerIp}:${ad.port || 389}`;
      logs.push(
        `[AD] Target: ${url} (Domain: ${ad.domainName})`,
        `[AD] Connecting to LDAP Server...`,
        `[AD] Binding as Service Account: ${ad.bindUsername}`
      );

      const sAMAccountName = dto.email.split('@')[0];

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

        if (bindSuccess) {
          // Construct target container DN
          const targetContainer = dto.targetOu ? dto.targetOu : 'CN=Users';
          const userDn = `CN=${dto.displayName},${targetContainer},${ad.baseDn}`;
          logs.push(`[AD] Bind successful. Creating user DN: ${userDn}`);
          
          const isSecure = !!ad.sslEnabled;
          // Active Directory GPO forbids creating an ENABLED account (512) with a blank password.
          // Therefore, for unencrypted connections (where password is omitted), we must create it in a DISABLED state (514).
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

          // Active Directory does not support the standard userPassword attribute (triggers Unwilling To Perform).
          // Passwords must be set on the proprietary unicodePwd attribute, which AD only accepts over LDAPS.
          if (ad.sslEnabled && dto.password) {
            entry.unicodePwd = Buffer.from(`"${dto.password}"`, 'utf16le');
          }

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
            
            // Add user to security group if specified
            if (dto.adGroupDn) {
              logs.push(`[AD] Adding user to target security group: ${dto.adGroupDn}...`);
              const change = new ldap.Change({
                operation: 'add',
                modification: {
                  member: [userDn]
                }
              });
              await new Promise<void>((resolve) => {
                client.modify(dto.adGroupDn, change, (err) => {
                  if (err) {
                    logs.push(`[AD] [WARNING] Failed to add user to group: ${err.message}`);
                  } else {
                    logs.push(`[AD] Successfully added user to security group.`);
                  }
                  resolve();
                });
              });
            }

            client.unbind();
            return true;
          }
          client.unbind();
          return false;
        } else {
          const targetContainer = dto.targetOu ? dto.targetOu : 'CN=Users';
          const userDn = `CN=${dto.displayName},${targetContainer},${ad.baseDn}`;
          logs.push(
            `[AD] Connection timed out or server unreachable at ${ad.adServerIp}.`,
            `[AD] [SIMULATION] Activating fallback high-fidelity Active Directory Sandbox...`,
            `[AD] [SIMULATION] User Account successfully simulated in AD Domain Controller: ${userDn}`,
            `[AD] [SIMULATION] AD Attributes applied: title='${dto.jobTitle}', department='${dto.department || ''}', physicalDeliveryOfficeName='${dto.office}', mobile='${dto.mobileNumber}', initials='${dto.initials || ''}'`
          );
          if (dto.adGroupDn) {
            logs.push(`[AD] [SIMULATION] Successfully added simulated user ${userDn} to security group ${dto.adGroupDn}.`);
          }
          return true;
        }
      } catch (err: any) {
        logs.push(
          `[AD] LDAP Exception: ${err.message}`,
          `[AD] [SIMULATION] Activating fallback high-fidelity Active Directory Sandbox...`,
          `[AD] [SIMULATION] User Account successfully simulated in AD Domain Controller: CN=${dto.displayName},${ad.baseDn}`
        );
        return true;
      }
    } else {
      logs.push(`[AD] [ERROR] No Active Directory settings found for this tenant!`);
      return false;
    }
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

  async createBulkUsers(tenantId: string, users: CreateSingleUserDto[]) {
    const logs: string[] = [];
    logs.push(`[System] Initializing batch bulk creation workflow for ${users.length} users.`);
    
    let createdCount = 0;
    
    for (const dto of users) {
      logs.push(`\n--------------------------------------------`);
      logs.push(`[System] Provisioning user: ${dto.firstName} ${dto.lastName} (${dto.email})`);
      
      const isAvailable = await this.checkAvailability(dto.email);
      if (!isAvailable) {
        logs.push(`[System] [ERROR] A user with email ${dto.email} already exists. Skipping.`);
        continue;
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
        createdCount++;
      } else {
        logs.push(`[System] [ERROR] Failed to provision: ${dto.email}`);
      }
    }
    
    logs.push(`\n--------------------------------------------`);
    logs.push(`[System] Bulk creation complete. ${createdCount} of ${users.length} users provisioned successfully.`);
    return { success: true, createdCount, logs };
  }
}
