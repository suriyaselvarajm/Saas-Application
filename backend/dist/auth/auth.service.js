"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTenantConfigByDomain(domain) {
        if (domain === 'petrus.io') {
            let masterTenant = await this.prisma.tenant.findFirst({
                where: { domainName: 'petrus.io' },
                include: { m365Settings: true },
            });
            if (!masterTenant) {
                masterTenant = await this.prisma.tenant.create({
                    data: {
                        name: 'Petrus Platform Admin',
                        companyName: 'Petrus IAM',
                        domainName: 'petrus.io',
                        tenantCode: 'MASTER',
                        m365Settings: {
                            create: {
                                azureTenantId: 'petrus-master-azure-id',
                                clientId: 'petrus-master-client-id',
                                redirectUrl: 'http://localhost:3000/auth/callback',
                            }
                        }
                    },
                    include: { m365Settings: true },
                });
            }
            return {
                tenantId: masterTenant.id,
                tenantCode: masterTenant.tenantCode,
                name: masterTenant.name,
                azureTenantId: masterTenant.m365Settings.azureTenantId,
                clientId: masterTenant.m365Settings.clientId,
                redirectUrl: masterTenant.m365Settings.redirectUrl,
            };
        }
        const tenant = await this.prisma.tenant.findFirst({
            where: { domainName: domain, status: 'ACTIVE' },
            include: { m365Settings: true },
        });
        if (!tenant) {
            throw new common_1.HttpException('Tenant not found or inactive', common_1.HttpStatus.NOT_FOUND);
        }
        if (!tenant.m365Settings || !tenant.m365Settings.clientId || !tenant.m365Settings.azureTenantId) {
            throw new common_1.HttpException('SSO is not configured for this tenant', common_1.HttpStatus.BAD_REQUEST);
        }
        return {
            tenantId: tenant.id,
            tenantCode: tenant.tenantCode,
            name: tenant.name,
            azureTenantId: tenant.m365Settings.azureTenantId,
            clientId: tenant.m365Settings.clientId,
            redirectUrl: tenant.m365Settings.redirectUrl || 'http://localhost:3000/auth/callback',
        };
    }
    async exchangeM365Token(code, domain) {
        const config = await this.getTenantConfigByDomain(domain);
        const mockEmail = `admin@${domain}`;
        let user = await this.prisma.user.findFirst({
            where: { email: mockEmail, tenantId: config.tenantId }
        });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: mockEmail,
                    name: config.tenantCode === 'MASTER' ? 'Platform Super Admin' : 'Tenant Administrator',
                    tenantId: config.tenantId,
                }
            });
        }
        const platformToken = `mock-jwt-token-for-${user.id}`;
        return {
            accessToken: platformToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                tenantCode: config.tenantCode,
                tenantName: config.name,
                isSuperAdmin: config.tenantCode === 'MASTER',
            }
        };
    }
    async login(email, password) {
        if (email === 'admin@petrus.io') {
            const config = await this.getTenantConfigByDomain('petrus.io');
            let user = await this.prisma.user.findFirst({
                where: { email, tenantId: config.tenantId }
            });
            if (!user) {
                user = await this.prisma.user.create({
                    data: {
                        email,
                        name: 'Platform Super Admin',
                        tenantId: config.tenantId,
                        systemRole: 'SUPER_ADMIN',
                    }
                });
            }
            else if (user.systemRole !== 'SUPER_ADMIN') {
                user = await this.prisma.user.update({
                    where: { id: user.id },
                    data: { systemRole: 'SUPER_ADMIN' }
                });
            }
            return {
                accessToken: `mock-jwt-token-for-${user.id}`,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    tenantCode: config.tenantCode,
                    tenantName: config.name,
                    systemRole: user.systemRole,
                }
            };
        }
        const domain = email.split('@')[1];
        if (!domain)
            throw new common_1.HttpException('Invalid email format', common_1.HttpStatus.BAD_REQUEST);
        const config = await this.getTenantConfigByDomain(domain);
        let user = await this.prisma.user.findFirst({
            where: { email, tenantId: config.tenantId }
        });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email,
                    name: 'Tenant Administrator',
                    tenantId: config.tenantId,
                    systemRole: 'TENANT_ADMIN',
                }
            });
        }
        else if (email.startsWith('admin@') && user.systemRole !== 'TENANT_ADMIN') {
            user = await this.prisma.user.update({
                where: { id: user.id },
                data: { systemRole: 'TENANT_ADMIN' }
            });
        }
        return {
            accessToken: `mock-jwt-token-for-${user.id}`,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                tenantCode: config.tenantCode,
                tenantName: config.name,
                systemRole: user.systemRole,
            }
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map