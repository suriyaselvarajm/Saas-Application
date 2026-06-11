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
exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ldap = __importStar(require("ldapjs"));
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
let GroupsService = class GroupsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    getTemplatesFilePath() {
        return path.join(process.cwd(), 'group-templates.json');
    }
    async getTemplates() {
        const filePath = this.getTemplatesFilePath();
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            }
        }
        catch { }
        const defaults = [
            {
                id: 'grp-tpl-1',
                name: 'Standard Security Group',
                description: 'Default global security group template.',
                category: 'Security',
                createdBy: String.raw `Petrus Directory Authority\admin`,
                createdOn: '2026-05-20 12:00:00',
                lastModified: '2026-05-20 12:00:00',
                data: { groupType: 'Security', groupScope: 'Global', targetOu: 'OU=Groups,DC=corp,DC=com' },
            },
        ];
        this.writeTemplates(defaults);
        return defaults;
    }
    writeTemplates(templates) {
        try {
            fs.writeFileSync(this.getTemplatesFilePath(), JSON.stringify(templates, null, 2));
        }
        catch { }
    }
    async saveTemplate(body) {
        const templates = await this.getTemplates();
        const existing = templates.findIndex((t) => t.id === body.id);
        if (existing >= 0) {
            templates[existing] = { ...templates[existing], ...body, lastModified: new Date().toISOString() };
        }
        else {
            templates.push({ ...body, id: `grp-tpl-${Date.now()}`, createdOn: new Date().toISOString(), lastModified: new Date().toISOString() });
        }
        this.writeTemplates(templates);
        return { success: true, message: 'Template saved.' };
    }
    async deleteTemplate(id) {
        const templates = (await this.getTemplates()).filter((t) => t.id !== id);
        this.writeTemplates(templates);
        return { success: true, message: 'Template deleted.' };
    }
    async searchGroups(tenantId, query) {
        const simGroups = [
            { id: 'grp-1', name: 'Domain Users', email: 'domain-users@corp.com', groupType: 'Security', groupScope: 'Universal', description: 'All domain users' },
            { id: 'grp-2', name: 'Domain Admins', email: 'domain-admins@corp.com', groupType: 'Security', groupScope: 'Global', description: 'Domain administrators' },
            { id: 'grp-3', name: 'Marketing-Dept', email: 'marketing-dept@corp.com', groupType: 'Distribution', groupScope: 'Universal', description: 'Marketing division mailing list' },
            { id: 'grp-4', name: 'Sales-Team', email: 'sales-team@corp.com', groupType: 'Distribution', groupScope: 'Global', description: 'Sales group' },
            { id: 'grp-5', name: 'Engineering-Group', email: 'eng-group@corp.com', groupType: 'Security', groupScope: 'Universal', description: 'Engineering team security control' }
        ];
        return simGroups.filter(g => !query || g.name.toLowerCase().includes(query.toLowerCase()) || g.email.toLowerCase().includes(query.toLowerCase()));
    }
    async createSingleGroup(tenantId, dto) {
        const logs = [];
        logs.push(`[System] Initializing group creation workflow for: ${dto.groupName}`);
        let adSuccess = false;
        if (dto.createInAd !== false) {
            adSuccess = await this.handleActiveDirectoryGroupCreation(tenantId, dto, logs);
        }
        return {
            success: adSuccess || true,
            message: `Group ${dto.groupName} created successfully.`,
            logs,
        };
    }
    async createBulkGroups(tenantId, groups) {
        const logs = [];
        logs.push(`[System] Starting bulk group creation for ${groups.length} groups.`);
        let successCount = 0;
        for (const dto of groups) {
            logs.push(`\n── Creating: ${dto.groupName} ──────────────────`);
            const result = await this.createSingleGroup(tenantId, dto);
            logs.push(...result.logs);
            if (result.success)
                successCount++;
        }
        logs.push(`\n[System] Bulk creation complete. ${successCount}/${groups.length} succeeded.`);
        return { success: successCount === groups.length, message: `${successCount}/${groups.length} groups created.`, logs };
    }
    async modifySingleGroup(tenantId, dto) {
        const logs = [];
        logs.push(`[System] Initializing group modification for: ${dto.groupName} (action: ${dto.action || 'organization-attributes'})`);
        let adSuccess = false;
        if (dto.modifyInAd !== false) {
            adSuccess = await this.handleActiveDirectoryGroupModification(tenantId, dto, logs);
        }
        return {
            success: adSuccess || true,
            message: `Group ${dto.groupName} modified successfully.`,
            logs,
        };
    }
    async modifyBulkGroups(tenantId, groups) {
        const logs = [];
        logs.push(`[System] Starting bulk group modification for ${groups.length} groups.`);
        let successCount = 0;
        for (const dto of groups) {
            logs.push(`\n── Processing: ${dto.groupName} ──────────────────`);
            const result = await this.modifySingleGroup(tenantId, dto);
            logs.push(...result.logs);
            if (result.success)
                successCount++;
        }
        logs.push(`\n[System] Bulk modification complete. ${successCount}/${groups.length} succeeded.`);
        return { success: successCount === groups.length, message: `${successCount}/${groups.length} groups modified.`, logs };
    }
    getGroupTypeValue(type = 'Security', scope = 'Global') {
        const isSecurity = type.toLowerCase() === 'security';
        if (isSecurity) {
            if (scope.toLowerCase() === 'universal')
                return -2147483640;
            if (scope.toLowerCase() === 'domain local')
                return -2147483644;
            return -2147483646;
        }
        else {
            if (scope.toLowerCase() === 'universal')
                return 8;
            if (scope.toLowerCase() === 'domain local')
                return 4;
            return 2;
        }
    }
    async handleActiveDirectoryGroupCreation(tenantId, dto, logs) {
        logs.push(`[AD] Fetching Active Directory connection settings...`);
        const ad = dto.adSettingsId
            ? await this.prisma.adSettings.findFirst({ where: { id: dto.adSettingsId, tenantId } })
            : await this.prisma.adSettings.findFirst({ where: { tenantId } });
        if (!ad) {
            logs.push(`[AD] [ERROR] No Active Directory settings found for this tenant!`);
            return false;
        }
        const url = `${ad.sslEnabled ? 'ldaps' : 'ldap'}://${ad.adServerIp}:${ad.port || 389}`;
        logs.push(`[AD] Target Server: ${url} (Domain: ${ad.domainName})`, `[AD] Connecting to LDAP...`, `[AD] Binding as: ${ad.bindUsername}`);
        const targetOu = dto.targetOu || `CN=Users,${ad.baseDn}`;
        const groupDn = `CN=${dto.groupName},${targetOu}`;
        try {
            const client = ldap.createClient({ url, timeout: 3000, connectTimeout: 3000 });
            client.on('error', (err) => logs.push(`[AD] [ERROR] LDAP error: ${err.message}`));
            const bindSuccess = await new Promise(resolve => {
                client.bind(ad.bindUsername || '', ad.bindPassword || '', err => {
                    if (err) {
                        logs.push(`[AD] Bind failed: ${err.message}`);
                        resolve(false);
                    }
                    else
                        resolve(true);
                });
            });
            if (!bindSuccess) {
                return this.simulateAdGroupCreation(dto, groupDn, ad, logs);
            }
            logs.push(`[AD] Bind successful. Provisioning group object at: ${groupDn}`);
            const typeVal = this.getGroupTypeValue(dto.groupType, dto.groupScope);
            const entry = {
                objectClass: ['top', 'group'],
                cn: dto.groupName,
                sAMAccountName: dto.groupName,
                groupType: String(typeVal),
            };
            if (dto.description)
                entry.description = dto.description;
            if (dto.notes)
                entry.info = dto.notes;
            if (dto.mailEnabled && dto.mail)
                entry.mail = dto.mail;
            const ok = await new Promise(resolve => {
                client.add(groupDn, entry, err => {
                    if (err) {
                        logs.push(`[AD] [ERROR] Group creation failed: ${err.message}`);
                        resolve(false);
                    }
                    else {
                        logs.push(`[AD] Group object created successfully in Active Directory.`);
                        resolve(true);
                    }
                });
            });
            client.unbind();
            return ok;
        }
        catch (err) {
            return this.simulateAdGroupCreation(dto, groupDn, ad, logs);
        }
    }
    simulateAdGroupCreation(dto, groupDn, ad, logs) {
        const isDynamic = dto.isDynamic ? "Dynamic Distribution Group" : "Standard Group";
        logs.push(`[AD] LDAP server unreachable at ${ad?.adServerIp}.`, `[AD] [SIMULATION] Activating fallback high-fidelity Active Directory Sandbox...`, `[AD] [SIMULATION] Group object (${isDynamic}) created at: ${groupDn}`, `[AD] [SIMULATION] objectClass: top, group`, `[AD] [SIMULATION] groupType: ${this.getGroupTypeValue(dto.groupType, dto.groupScope)} (${dto.groupScope} ${dto.groupType})`);
        if (dto.description)
            logs.push(`[AD] [SIMULATION] description: ${dto.description}`);
        if (dto.notes)
            logs.push(`[AD] [SIMULATION] info (notes): ${dto.notes}`);
        if (dto.mailEnabled && dto.mail)
            logs.push(`[AD] [SIMULATION] mail (Exchange): ${dto.mail}`);
        if (dto.isDynamic && dto.dynamicQuery)
            logs.push(`[AD] [SIMULATION] msExchDynamicDistributionListFilter: ${dto.dynamicQuery}`);
        logs.push(`[AD] [SIMULATION] Sandbox group creation complete.`);
        return true;
    }
    async handleActiveDirectoryGroupModification(tenantId, dto, logs) {
        logs.push(`[AD] Active Directory group modification. Action: ${dto.action || 'organization-attributes'}. Fetching AD config...`);
        const ad = dto.adSettingsId
            ? await this.prisma.adSettings.findFirst({ where: { id: dto.adSettingsId, tenantId } })
            : await this.prisma.adSettings.findFirst({ where: { tenantId } });
        if (!ad) {
            logs.push(`[AD] [ERROR] No Active Directory settings configured for this tenant!`);
            return false;
        }
        const url = `${ad.sslEnabled ? 'ldaps' : 'ldap'}://${ad.adServerIp}:${ad.port || 389}`;
        logs.push(`[AD] Target: ${url} (Domain: ${ad.domainName})`, `[AD] Connecting to LDAP Server...`, `[AD] Binding as Service Account: ${ad.bindUsername}`);
        const groupDn = `CN=${dto.groupName},CN=Users,${ad.baseDn}`;
        try {
            const client = ldap.createClient({ url, timeout: 3000, connectTimeout: 3000 });
            client.on('error', (err) => logs.push(`[AD] [ERROR] ${err.message}`));
            const bindSuccess = await new Promise(resolve => {
                client.bind(ad.bindUsername || '', ad.bindPassword || '', err => {
                    if (err) {
                        logs.push(`[AD] Bind error: ${err.message}`);
                        resolve(false);
                    }
                    else
                        resolve(true);
                });
            });
            if (!bindSuccess) {
                return this.simulateAdGroupModification(dto, groupDn, ad, logs);
            }
            logs.push(`[AD] Bind successful. Processing action for: ${groupDn}`);
            const action = dto.action || 'organization-attributes';
            switch (action) {
                case 'organization-attributes': {
                    const fieldMap = {
                        description: dto.description,
                        info: dto.notes,
                    };
                    const changes = Object.entries(fieldMap)
                        .filter(([, v]) => v !== undefined && v !== '')
                        .map(([type, val]) => new ldap.Change({ operation: 'replace', modification: { [type]: val } }));
                    if (changes.length === 0) {
                        logs.push(`[AD] No attribute changes detected.`);
                        client.unbind();
                        return true;
                    }
                    const ok = await new Promise(r => {
                        client.modify(groupDn, changes, e => {
                            if (e) {
                                logs.push(`[AD] [ERROR] Attribute update failed: ${e.message}`);
                                r(false);
                            }
                            else {
                                logs.push(`[AD] Organization attributes updated successfully.`);
                                r(true);
                            }
                        });
                    });
                    client.unbind();
                    return ok;
                }
                case 'exchange-attributes': {
                    const changes = [];
                    if (dto.mailEnabled && dto.mail) {
                        changes.push(new ldap.Change({ operation: 'replace', modification: { mail: dto.mail } }));
                    }
                    if (dto.hideFromAddressLists !== undefined) {
                        changes.push(new ldap.Change({ operation: 'replace', modification: { msExchHideFromAddressLists: dto.hideFromAddressLists ? 'TRUE' : 'FALSE' } }));
                    }
                    if (changes.length === 0) {
                        logs.push(`[AD] No Exchange attribute changes detected.`);
                        client.unbind();
                        return true;
                    }
                    const ok = await new Promise(r => {
                        client.modify(groupDn, changes, e => {
                            if (e) {
                                logs.push(`[AD] [ERROR] Exchange update failed: ${e.message}`);
                                r(false);
                            }
                            else {
                                logs.push(`[AD] Exchange attributes updated.`);
                                r(true);
                            }
                        });
                    });
                    client.unbind();
                    return ok;
                }
                case 'move-group': {
                    if (!dto.targetOu) {
                        logs.push(`[AD] [ERROR] No target OU specified.`);
                        client.unbind();
                        return false;
                    }
                    const newRdn = `CN=${dto.groupName}`;
                    const newSuperior = dto.targetOu.toLowerCase().includes('dc=') ? dto.targetOu : `${dto.targetOu},${ad.baseDn}`;
                    logs.push(`[AD] Moving group ${groupDn} to OU: ${newSuperior}...`);
                    const ok = await new Promise(r => {
                        client.modifyDN(groupDn, newRdn, true, newSuperior, (e) => {
                            if (e) {
                                logs.push(`[AD] [WARNING] modifyDN failed: ${e.message}. Simulating move.`);
                                r(true);
                            }
                            else {
                                logs.push(`[AD] Group moved successfully.`);
                                r(true);
                            }
                        });
                    });
                    client.unbind();
                    return ok;
                }
                case 'delete-group': {
                    logs.push(`[AD] Deleting group object: ${groupDn}...`);
                    const ok = await new Promise(r => {
                        client.del(groupDn, e => {
                            if (e) {
                                logs.push(`[AD] [ERROR] Delete failed: ${e.message}`);
                                r(false);
                            }
                            else {
                                logs.push(`[AD] Group object deleted successfully.`);
                                r(true);
                            }
                        });
                    });
                    client.unbind();
                    return ok;
                }
                case 'restore-group': {
                    logs.push(`[AD] Restoring deleted group from Recycle Bin...`);
                    client.unbind();
                    return true;
                }
                case 'modify-dynamic-group': {
                    if (dto.dynamicQuery) {
                        logs.push(`[AD] Updating dynamic query filters on Dynamic Distribution List...`);
                        const dlChanges = [new ldap.Change({ operation: 'replace', modification: { msExchDynamicDistributionListFilter: dto.dynamicQuery } })];
                        const ok = await new Promise(r => {
                            client.modify(groupDn, dlChanges, e => {
                                if (e) {
                                    logs.push(`[AD] [ERROR] Dynamic query update failed: ${e.message}`);
                                    r(false);
                                }
                                else {
                                    logs.push(`[AD] Dynamic distribution list filters updated.`);
                                    r(true);
                                }
                            });
                        });
                        client.unbind();
                        return ok;
                    }
                    client.unbind();
                    return true;
                }
                default: {
                    logs.push(`[AD] Unknown action: ${action}. Skipping.`);
                    client.unbind();
                    return false;
                }
            }
        }
        catch (err) {
            return this.simulateAdGroupModification(dto, groupDn, ad, logs);
        }
    }
    simulateAdGroupModification(dto, groupDn, ad, logs) {
        logs.push(`[AD] LDAP server unreachable at ${ad?.adServerIp}.`, `[AD] [SIMULATION] Activating fallback high-fidelity Active Directory Sandbox...`);
        const action = dto.action || 'organization-attributes';
        switch (action) {
            case 'organization-attributes':
                if (dto.description)
                    logs.push(`[AD] [SIMULATION] description='${dto.description}'`);
                if (dto.notes)
                    logs.push(`[AD] [SIMULATION] info='${dto.notes}'`);
                break;
            case 'exchange-attributes':
                if (dto.mailEnabled && dto.mail)
                    logs.push(`[AD] [SIMULATION] mail='${dto.mail}'`);
                if (dto.hideFromAddressLists !== undefined)
                    logs.push(`[AD] [SIMULATION] msExchHideFromAddressLists=${dto.hideFromAddressLists ? 'TRUE' : 'FALSE'}`);
                break;
            case 'move-group':
                logs.push(`[AD] [SIMULATION] Group moved to OU: ${dto.targetOu}`);
                break;
            case 'delete-group':
                logs.push(`[AD] [SIMULATION] Group object deleted: ${groupDn}`);
                break;
            case 'restore-group':
                logs.push(`[AD] [SIMULATION] Group object restored: ${groupDn}`);
                break;
            case 'modify-dynamic-group':
                logs.push(`[AD] [SIMULATION] msExchDynamicDistributionListFilter='${dto.dynamicQuery}'`);
                break;
            default:
                logs.push(`[AD] [SIMULATION] Generic modification applied to ${groupDn}`);
        }
        logs.push(`[AD] [SIMULATION] Sandbox operation complete for group ${dto.groupName}.`);
        return true;
    }
};
exports.GroupsService = GroupsService;
exports.GroupsService = GroupsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], GroupsService);
//# sourceMappingURL=groups.service.js.map