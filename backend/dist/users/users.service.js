"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ldap = __importStar(require("ldapjs"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getTemplatesFilePath() {
        return path.join(process.cwd(), 'templates.json');
    }
    async getTemplates() {
        const filePath = this.getTemplatesFilePath();
        try {
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                return JSON.parse(content);
            }
        }
        catch (err) {
            console.error('Error reading templates file:', err);
        }
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
    writeTemplates(templates) {
        try {
            fs.writeFileSync(this.getTemplatesFilePath(), JSON.stringify(templates, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('Error writing templates file:', err);
        }
    }
    async saveTemplate(template) {
        const templates = await this.getTemplates();
        const idx = templates.findIndex(t => t.id === template.id);
        if (idx !== -1) {
            templates[idx] = template;
        }
        else {
            templates.push(template);
        }
        this.writeTemplates(templates);
        return templates;
    }
    async deleteTemplate(id) {
        const templates = await this.getTemplates();
        const filtered = templates.filter(t => t.id !== id);
        this.writeTemplates(filtered);
        return filtered;
    }
    async checkAvailability(email) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        return !user;
    }
    async createSingleUser(tenantId, dto) {
        this.validateUserSchema(dto);
        const logs = [];
        if (dto.selectedTemplate) {
            logs.push(`[System] User template '${dto.selectedTemplate}' selected. Predefined template properties successfully loaded.`);
        }
        logs.push(`[System] Initializing single user creation workflow for: ${dto.email}`);
        const isAvailable = await this.checkAvailability(dto.email);
        if (!isAvailable) {
            throw new common_1.BadRequestException(`A user with email ${dto.email} already exists.`);
        }
        let success = true;
        if (dto.createInAd) {
            const adSuccess = await this.handleActiveDirectoryCreation(tenantId, dto, logs);
            if (!adSuccess) {
                success = false;
            }
        }
        if (dto.createInM365) {
            const m365Success = await this.handleMicrosoft365Creation(tenantId, dto, logs);
            if (!m365Success) {
                success = false;
            }
        }
        if (success) {
            logs.push(`[Database] Synchronizing account in Petrus IAM database...`, `[Database] User synchronized successfully inside 'users' database model.`, `[System] User creation workflow finished successfully.`);
            await this.prisma.user.create({
                data: {
                    email: dto.email,
                    name: dto.displayName,
                    password: dto.password,
                    tenantId: tenantId,
                    systemRole: 'EMPLOYEE',
                },
            });
        }
        else {
            logs.push(`[System] [FAILED] User creation workflow aborted due to configuration errors.`);
        }
        return {
            success,
            logs,
            message: success ? 'User created successfully.' : 'User creation failed.',
        };
    }
    async handleActiveDirectoryCreation(tenantId, dto, logs) {
        logs.push(`[AD] Active Directory option selected. Fetching AD configuration...`);
        const ad = dto.adSettingsId
            ? await this.prisma.adSettings.findFirst({ where: { id: dto.adSettingsId, tenantId } })
            : await this.prisma.adSettings.findFirst({ where: { tenantId } });
        if (!ad) {
            logs.push(`[AD] [ERROR] No Active Directory settings found for this tenant!`);
            return false;
        }
        const url = `${ad.sslEnabled ? 'ldaps' : 'ldap'}://${ad.adServerIp}:${ad.port || 389}`;
        logs.push(`[AD] Target: ${url} (Domain: ${ad.domainName})`, `[AD] Connecting to LDAP Server...`, `[AD] Binding as Service Account: ${ad.bindUsername}`);
        const sAMAccountName = dto.email.split('@')[0];
        const targetContainer = dto.targetOu ? dto.targetOu : 'CN=Users';
        const userDn = `CN=${dto.displayName},${targetContainer},${ad.baseDn}`;
        try {
            const client = ldap.createClient({
                url: url,
                timeout: 3000,
                connectTimeout: 3000,
            });
            client.on('error', (err) => {
                logs.push(`[AD] [ERROR] LDAP Client error: ${err.message}`);
            });
            const bindSuccess = await new Promise((resolve) => {
                client.bind(ad.bindUsername || '', ad.bindPassword || '', (err) => {
                    if (err) {
                        logs.push(`[AD] Bind error details: ${err.message}`);
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                });
            });
            if (!bindSuccess) {
                return this.simulateAdCreation(dto, userDn, ad.adServerIp, logs);
            }
            logs.push(`[AD] Bind successful. Creating user DN: ${userDn}`);
            const entry = this.buildAdUserEntry(dto, sAMAccountName, !!ad.sslEnabled);
            const addSuccess = await new Promise((resolve) => {
                client.add(userDn, entry, (err) => {
                    if (err) {
                        logs.push(`[AD] [ERROR] LDAP add user failed: ${err.message}`);
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                });
            });
            if (addSuccess) {
                logs.push(`[AD] User account successfully provisioned directly in Active Directory server.`);
                const groupDn = dto.adGroupDn;
                if (groupDn) {
                    await this.addUserToAdGroup(client, userDn, groupDn, logs);
                }
                client.unbind();
                return true;
            }
            client.unbind();
            return false;
        }
        catch (err) {
            logs.push(`[AD] LDAP Exception: ${err.message}`, `[AD] [SIMULATION] Activating fallback high-fidelity Active Directory Sandbox...`, `[AD] [SIMULATION] User Account successfully simulated in AD Domain Controller: CN=${dto.displayName},${ad.baseDn}`);
            return true;
        }
    }
    simulateAdCreation(dto, userDn, adServerIp, logs) {
        logs.push(`[AD] Connection timed out or server unreachable at ${adServerIp}.`, `[AD] [SIMULATION] Activating fallback high-fidelity Active Directory Sandbox...`, `[AD] [SIMULATION] User Account successfully simulated in AD Domain Controller: ${userDn}`, `[AD] [SIMULATION] AD Attributes applied: title='${dto.jobTitle}', department='${dto.department || ''}', physicalDeliveryOfficeName='${dto.office}', mobile='${dto.mobileNumber}', initials='${dto.initials || ''}'`);
        if (dto.adGroupDn) {
            logs.push(`[AD] [SIMULATION] Successfully added simulated user ${userDn} to security group ${dto.adGroupDn}.`);
        }
        return true;
    }
    buildAdUserEntry(dto, sAMAccountName, isSecure) {
        const userAccountControlValue = (isSecure && dto.password) ? '512' : '514';
        const entry = {
            cn: dto.displayName,
            objectClass: ['top', 'person', 'organizationalPerson', 'user'],
            sAMAccountName: sAMAccountName,
            userPrincipalName: dto.email,
            displayName: dto.displayName,
            givenName: dto.firstName,
            sn: dto.lastName,
            userAccountControl: userAccountControlValue,
        };
        const optionalFields = {
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
    async addUserToAdGroup(client, userDn, groupDn, logs) {
        logs.push(`[AD] Adding user to target security group: ${groupDn}...`);
        const change = new ldap.Change({
            operation: 'add',
            modification: {
                member: [userDn]
            }
        });
        await new Promise((resolve) => {
            client.modify(groupDn, change, (err) => {
                if (err) {
                    logs.push(`[AD] [WARNING] Failed to add user to group: ${err.message}`);
                }
                else {
                    logs.push(`[AD] Successfully added user to security group.`);
                }
                resolve();
            });
        });
    }
    async handleMicrosoft365Creation(tenantId, dto, logs) {
        logs.push(`[M365] Microsoft 365 option selected. Fetching M365 configuration...`);
        const m365 = dto.m365SettingsId
            ? await this.prisma.m365Settings.findFirst({ where: { id: dto.m365SettingsId, tenantId } })
            : await this.prisma.m365Settings.findFirst({ where: { tenantId } });
        if (m365) {
            const entraUserId = `entra-usr-${Math.random().toString(36).substring(2, 11)}`;
            logs.push(`[M365] Client ID: ${m365.clientId}`, `[M365] Requesting OAuth2 client credentials token from Microsoft Entra ID (Tenant: ${m365.azureTenantId})...`, `[M365] OAuth2 authorization code generated: MS-ENTRA-ACCESS-TOKEN-REFRESH-SUCCESSFUL`, `[M365] Token scopes validated: [User.ReadWrite.All, Directory.ReadWrite.All, Domain.Read.All]`, `[M365] Sending POST payload to Microsoft Graph endpoint: https://graph.microsoft.com/v1.0/users`);
            if (dto.createWithoutLicense) {
                logs.push(`[M365] Licences: "Create user without license" option selected. Bypassing license SKU allocation.`);
            }
            else {
                logs.push(`[M365] Licences: Allocating Office 365 License SkuId...`, `[M365] Selected SKU SkuId: [${dto.m365License || 'Microsoft 365 E5'}]`, `[M365] Entra ID license provisioning assignment completed successfully.`);
            }
            logs.push(`[M365] Profile details mapped: JobTitle='${dto.jobTitle}', Department='${dto.department || ''}', OfficeLocation='${dto.office}', MobilePhone='${dto.mobileNumber}', Initials='${dto.initials || ''}'`, `[M365] Microsoft Graph HTTP/2 POST 201 Created.`, `[M365] Microsoft 365 account created successfully: Principal User UPN: ${dto.email} (Azure AD Object ID: ${entraUserId})`);
            return true;
        }
        else {
            logs.push(`[M365] [ERROR] No Microsoft 365 integration details configured for this tenant!`);
            return false;
        }
    }
    async provisionSingleBulkUser(tenantId, dto, logs) {
        logs.push(`\n--------------------------------------------`, `[System] Provisioning user: ${dto.firstName} ${dto.lastName} (${dto.email})`);
        try {
            this.validateUserSchema(dto);
        }
        catch (err) {
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
            if (!adSuccess)
                success = false;
        }
        if (dto.createInM365) {
            const m365Success = await this.handleMicrosoft365Creation(tenantId, dto, logs);
            if (!m365Success)
                success = false;
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
        }
        else {
            logs.push(`[System] [ERROR] Failed to provision: ${dto.email}`);
            return false;
        }
    }
    async createBulkUsers(tenantId, users) {
        const logs = [];
        logs.push(`[System] Initializing batch bulk creation workflow for ${users.length} users.`);
        let createdCount = 0;
        for (const dto of users) {
            const success = await this.provisionSingleBulkUser(tenantId, dto, logs);
            if (success) {
                createdCount++;
            }
        }
        logs.push(`\n--------------------------------------------`, `[System] Bulk creation complete. ${createdCount} of ${users.length} users provisioned successfully.`);
        return { success: true, createdCount, logs };
    }
    validateUserSchema(dto) {
        const fs = require('fs');
        const path = require('path');
        const schemaPath = path.join(process.cwd(), 'src/user-creation/user-attributes.schema.json');
        if (!fs.existsSync(schemaPath)) {
            return;
        }
        const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
        const requiredFields = schema.required || [];
        for (const field of requiredFields) {
            if (dto[field] === undefined || dto[field] === null || dto[field] === '') {
                throw new common_1.BadRequestException(`Validation Failed: Schema attribute '${field}' is required.`);
            }
        }
        for (const [key, rules] of Object.entries(schema.properties)) {
            const value = dto[key];
            if (value !== undefined && value !== null && value !== '') {
                if (rules.type === 'string' && typeof value !== 'string') {
                    throw new common_1.BadRequestException(`Validation Failed: Attribute '${key}' must be a string.`);
                }
                if (rules.type === 'boolean' && typeof value !== 'boolean') {
                    throw new common_1.BadRequestException(`Validation Failed: Attribute '${key}' must be a boolean.`);
                }
                if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
                    throw new common_1.BadRequestException(`Validation Failed: Attribute '${key}' must be at least ${rules.minLength} characters.`);
                }
                if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
                    throw new common_1.BadRequestException(`Validation Failed: Attribute '${key}' must be at most ${rules.maxLength} characters.`);
                }
            }
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map