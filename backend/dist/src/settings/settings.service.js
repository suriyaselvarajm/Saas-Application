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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const ldap = __importStar(require("ldapjs"));
const prisma_service_1 = require("../prisma/prisma.service");
function parseLdapPath(dn, baseDn) {
    const dnStr = typeof dn === 'string' ? dn : (dn?.toString() || '');
    const suffix = `,${baseDn}`;
    return dnStr.endsWith(suffix) ? dnStr.slice(0, dnStr.length - suffix.length) : dnStr;
}
let SettingsService = class SettingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateM365(tenantId, data) {
        const { id, ...updateData } = data;
        if (id) {
            return this.prisma.m365Settings.update({
                where: { id },
                data: { ...updateData, tenantId },
            });
        }
        return this.prisma.m365Settings.create({
            data: { ...updateData, tenantId },
        });
    }
    async updateAD(tenantId, data) {
        const { id, ...updateData } = data;
        if (id) {
            return this.prisma.adSettings.update({
                where: { id },
                data: { ...updateData, tenantId },
            });
        }
        return this.prisma.adSettings.create({
            data: { ...updateData, tenantId },
        });
    }
    async deleteAD(id, tenantId) {
        return this.prisma.adSettings.deleteMany({
            where: { id, tenantId },
        });
    }
    async deleteM365(id, tenantId) {
        return this.prisma.m365Settings.deleteMany({
            where: { id, tenantId },
        });
    }
    async updateAuth(tenantId, data) {
        return this.prisma.authSettings.upsert({
            where: { tenantId },
            update: data,
            create: { ...data, tenantId },
        });
    }
    async getSettings(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
            include: {
                m365Settings: true,
                adSettings: true,
                smtpSettings: true,
                authSettings: true,
            },
        });
        if (!tenant)
            throw new common_1.NotFoundException('Tenant not found');
        return tenant;
    }
    testM365Connection() {
        return {
            success: true,
            message: 'Successfully connected to Microsoft Graph',
        };
    }
    async testAdConnection(data) {
        const url = `${data.sslEnabled ? 'ldaps' : 'ldap'}://${data.adServerIp}:${data.port || 389}`;
        console.log(`Testing full LDAP bind to ${url} with user ${data.bindUsername}`);
        const client = ldap.createClient({
            url: url,
            timeout: 10000,
            connectTimeout: 10000,
            tlsOptions: data.sslEnabled ? { rejectUnauthorized: false } : undefined,
        });
        client.on('error', (err) => {
            console.error('LDAP Client global connection test error:', err.message);
        });
        try {
            await new Promise((resolve, reject) => {
                client.on('error', (err) => reject(new Error(`Connection failed: ${err.message}`)));
                client.bind(data.bindUsername, data.bindPassword, (err) => {
                    if (err)
                        reject(new Error(`Authentication failed: ${err.message}`));
                    else
                        resolve();
                });
            });
            console.log('LDAP Bind Successful, now validating Base DN...');
            const searchOptions = {
                scope: 'base',
                attributes: ['dn'],
            };
            const found = await new Promise((resolve, reject) => {
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
            }
            else {
                return { success: false, message: `Base DN "${data.baseDn}" was not found on the server.` };
            }
        }
        catch (err) {
            console.error('LDAP Error:', err.message);
            return { success: false, message: err.message };
        }
        finally {
            client.unbind();
        }
    }
    async fetchAdOUs(tenantId, adSettingsId) {
        const adSettings = await this.prisma.adSettings.findFirst({
            where: { id: adSettingsId, tenantId },
        });
        if (!adSettings?.bindUsername || !adSettings?.baseDn)
            return [];
        const { bindUsername, bindPassword, baseDn, adServerIp, port, sslEnabled } = adSettings;
        const url = `${sslEnabled ? 'ldaps' : 'ldap'}://${adServerIp}:${port || 389}`;
        const client = ldap.createClient({
            url,
            timeout: 8000,
            connectTimeout: 8000,
            tlsOptions: sslEnabled ? { rejectUnauthorized: false } : undefined,
        });
        client.on('error', (err) => console.error('OU Browse LDAP error:', err.message));
        const parseName = (entry) => {
            const ouVal = entry.attributes.find(a => a.type === 'ou')?.values?.[0];
            const cnVal = entry.attributes.find(a => a.type === 'cn')?.values?.[0];
            const dn = entry.objectName;
            return ouVal ?? cnVal ?? dn.split(',')[0].replace(/^(ou|cn)=/i, '');
        };
        try {
            await new Promise((resolve, reject) => {
                client.bind(bindUsername, bindPassword ?? '', (err) => {
                    if (err)
                        reject(new Error(`LDAP bind failed: ${err.message}`));
                    else
                        resolve();
                });
            });
            const results = [];
            const filter = '(|(objectClass=organizationalUnit)(objectClass=container))';
            const searchBase = adSettings.userCreationBaseOu || baseDn;
            await new Promise((resolve, reject) => {
                client.search(searchBase, { scope: 'sub', filter, attributes: ['ou', 'cn'] }, (err, res) => {
                    if (err) {
                        reject(new Error(`LDAP search failed: ${err.message}`));
                        return;
                    }
                    res.on('searchEntry', (entry) => {
                        const dn = typeof entry.objectName === 'string' ? entry.objectName : (entry.objectName?.toString() || entry.dn || '');
                        results.push({ name: parseName(entry), dn, path: parseLdapPath(dn, baseDn) });
                    });
                    res.on('error', (e) => reject(new Error(`LDAP search error: ${e.message}`)));
                    res.on('end', () => resolve());
                });
            });
            results.sort((a, b) => a.dn.split(',').length - b.dn.split(',').length);
            return results;
        }
        catch (err) {
            console.error('OU fetch error:', err.message);
            return [];
        }
        finally {
            client.unbind();
        }
    }
    async fetchAdGroups(tenantId, adSettingsId) {
        const adSettings = await this.prisma.adSettings.findFirst({
            where: { id: adSettingsId, tenantId },
        });
        if (!adSettings?.bindUsername || !adSettings?.baseDn)
            return [];
        const { bindUsername, bindPassword, baseDn, adServerIp, port, sslEnabled } = adSettings;
        const url = `${sslEnabled ? 'ldaps' : 'ldap'}://${adServerIp}:${port || 389}`;
        const client = ldap.createClient({
            url,
            timeout: 8000,
            connectTimeout: 8000,
            tlsOptions: sslEnabled ? { rejectUnauthorized: false } : undefined,
        });
        client.on('error', (err) => console.error('Group Browse LDAP error:', err.message));
        const parseName = (entry) => {
            const cnVal = entry.attributes.find(a => a.type === 'cn')?.values?.[0];
            const dn = entry.objectName;
            return cnVal ?? dn.split(',')[0].replace(/^(ou|cn)=/i, '');
        };
        try {
            await new Promise((resolve, reject) => {
                client.bind(bindUsername, bindPassword ?? '', (err) => {
                    if (err)
                        reject(new Error(`LDAP bind failed: ${err.message}`));
                    else
                        resolve();
                });
            });
            const results = [];
            const filter = '(objectClass=group)';
            const searchBase = baseDn;
            await new Promise((resolve, reject) => {
                client.search(searchBase, { scope: 'sub', filter, attributes: ['cn'] }, (err, res) => {
                    if (err) {
                        reject(new Error(`LDAP search failed: ${err.message}`));
                        return;
                    }
                    res.on('searchEntry', (entry) => {
                        const dn = typeof entry.objectName === 'string' ? entry.objectName : (entry.objectName?.toString() || entry.dn || '');
                        results.push({ name: parseName(entry), dn, path: parseLdapPath(dn, baseDn) });
                    });
                    res.on('error', (e) => reject(new Error(`LDAP search error: ${e.message}`)));
                    res.on('end', () => resolve());
                });
            });
            results.sort((a, b) => a.name.localeCompare(b.name));
            return results;
        }
        catch (err) {
            console.error('Group fetch error:', err.message);
            return [];
        }
        finally {
            client.unbind();
        }
    }
    async fetchAdUsers(tenantId, adSettingsId) {
        const adSettings = await this.prisma.adSettings.findFirst({
            where: { id: adSettingsId, tenantId },
        });
        if (!adSettings?.bindUsername || !adSettings?.baseDn)
            return [];
        const { bindUsername, bindPassword, baseDn, adServerIp, port, sslEnabled } = adSettings;
        const url = `${sslEnabled ? 'ldaps' : 'ldap'}://${adServerIp}:${port || 389}`;
        const client = ldap.createClient({
            url,
            timeout: 8000,
            connectTimeout: 8000,
            tlsOptions: sslEnabled ? { rejectUnauthorized: false } : undefined,
        });
        client.on('error', (err) => console.error('User Browse LDAP error:', err.message));
        const parseName = (entry) => {
            const cnVal = entry.attributes.find(a => a.type === 'cn')?.values?.[0];
            const dn = entry.objectName;
            return cnVal ?? dn.split(',')[0].replace(/^(ou|cn)=/i, '');
        };
        try {
            await new Promise((resolve, reject) => {
                client.bind(bindUsername, bindPassword ?? '', (err) => {
                    if (err)
                        reject(new Error(`LDAP bind failed: ${err.message}`));
                    else
                        resolve();
                });
            });
            const results = [];
            const filter = '(&(objectCategory=person)(objectClass=user))';
            const searchBase = baseDn;
            await new Promise((resolve, reject) => {
                client.search(searchBase, { scope: 'sub', filter, attributes: ['cn', 'mail'] }, (err, res) => {
                    if (err) {
                        reject(new Error(`LDAP search failed: ${err.message}`));
                        return;
                    }
                    res.on('searchEntry', (entry) => {
                        const dn = typeof entry.objectName === 'string' ? entry.objectName : (entry.objectName?.toString() || entry.dn || '');
                        const email = entry.attributes.find(a => a.type === 'mail')?.values?.[0];
                        results.push({ name: parseName(entry), dn, path: parseLdapPath(dn, baseDn), email });
                    });
                    res.on('error', (e) => reject(new Error(`LDAP search error: ${e.message}`)));
                    res.on('end', () => resolve());
                });
            });
            results.sort((a, b) => a.name.localeCompare(b.name));
            return results;
        }
        catch (err) {
            console.error('User fetch error:', err.message);
            return [];
        }
        finally {
            client.unbind();
        }
    }
    async getOffices(tenantId) {
        return this.prisma.office.findMany({ where: { tenantId } });
    }
    async createOffice(tenantId, data) {
        return this.prisma.office.create({ data: { ...data, tenantId } });
    }
    async updateOffice(id, tenantId, data) {
        return this.prisma.office.update({ where: { id, tenantId }, data });
    }
    async deleteOffice(id, tenantId) {
        return this.prisma.office.delete({ where: { id, tenantId } });
    }
    async getDepartments(tenantId) {
        return this.prisma.department.findMany({ where: { tenantId } });
    }
    async createDepartment(tenantId, data) {
        return this.prisma.department.create({ data: { ...data, tenantId } });
    }
    async updateDepartment(id, tenantId, data) {
        return this.prisma.department.update({ where: { id, tenantId }, data });
    }
    async deleteDepartment(id, tenantId) {
        return this.prisma.department.delete({ where: { id, tenantId } });
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map