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
            masterTenant ??= await this.prisma.tenant.create({
                data: {
                    name: 'Petrus Platform Admin',
                    companyName: 'Petrus IAM',
                    domainName: 'petrus.io',
                    tenantCode: 'MASTER',
                    m365Settings: {
                        create: [{
                                azureTenantId: 'petrus-master-azure-id',
                                clientId: 'petrus-master-client-id',
                                redirectUrl: 'http://localhost:3000/auth/callback',
                            }],
                    },
                },
                include: { m365Settings: true },
            });
            return {
                tenantId: masterTenant.id,
                tenantCode: masterTenant.tenantCode,
                name: masterTenant.name,
                azureTenantId: masterTenant.m365Settings?.[0]?.azureTenantId,
                clientId: masterTenant.m365Settings?.[0]?.clientId,
                redirectUrl: masterTenant.m365Settings?.[0]?.redirectUrl,
            };
        }
        const tenant = await this.prisma.tenant.findFirst({
            where: { domainName: domain, status: 'ACTIVE' },
            include: { m365Settings: true },
        });
        if (!tenant) {
            throw new common_1.HttpException('Tenant not found or inactive', common_1.HttpStatus.NOT_FOUND);
        }
        if (!tenant.m365Settings?.[0]?.clientId ||
            !tenant.m365Settings?.[0]?.azureTenantId) {
            throw new common_1.HttpException('SSO is not configured for this tenant', common_1.HttpStatus.BAD_REQUEST);
        }
        return {
            tenantId: tenant.id,
            tenantCode: tenant.tenantCode,
            name: tenant.name,
            azureTenantId: tenant.m365Settings[0].azureTenantId,
            clientId: tenant.m365Settings[0].clientId,
            redirectUrl: tenant.m365Settings[0].redirectUrl ||
                'http://localhost:3000/auth/callback',
        };
    }
    async exchangeM365Token(code, domain) {
        const config = await this.getTenantConfigByDomain(domain);
        const mockEmail = `admin@${domain}`;
        let user = await this.prisma.user.findFirst({
            where: { email: mockEmail, tenantId: config.tenantId },
        });
        user ??= await this.prisma.user.create({
            data: {
                email: mockEmail,
                name: config.tenantCode === 'MASTER'
                    ? 'Platform Super Admin'
                    : 'Tenant Administrator',
                tenantId: config.tenantId,
            },
        });
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
            },
        };
    }
    async login(email, password) {
        if (email === 'admin@petrus.io') {
            const config = await this.getTenantConfigByDomain('petrus.io');
            let user = await this.prisma.user.findFirst({
                where: { email, tenantId: config.tenantId },
            });
            user ??= await this.prisma.user.create({
                data: {
                    email,
                    password: 'admin',
                    name: 'Platform Super Admin',
                    tenantId: config.tenantId,
                    systemRole: 'SUPER_ADMIN',
                    mustChangePassword: false,
                },
            });
            return {
                accessToken: `mock-jwt-token-for-${user.id}`,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    tenantCode: config.tenantCode,
                    tenantName: config.name,
                    systemRole: user.systemRole,
                    mustChangePassword: user.mustChangePassword,
                },
            };
        }
        const domain = email.split('@')[1];
        if (!domain)
            throw new common_1.HttpException('Invalid email format', common_1.HttpStatus.BAD_REQUEST);
        const tenant = await this.prisma.tenant.findFirst({
            where: { domainName: domain, status: 'ACTIVE' },
        });
        if (!tenant) {
            throw new common_1.HttpException('Invalid account. Your organisation is not registered on this platform.', common_1.HttpStatus.UNAUTHORIZED);
        }
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (user?.tenantId !== tenant.id) {
            throw new common_1.HttpException('Unauthorized. Only registered users for this organisation can login.', common_1.HttpStatus.UNAUTHORIZED);
        }
        if (!user.password) {
            throw new common_1.HttpException('Account has no password set. Please contact administrator.', common_1.HttpStatus.UNAUTHORIZED);
        }
        if (user.password !== password) {
            throw new common_1.HttpException('Invalid password.', common_1.HttpStatus.UNAUTHORIZED);
        }
        if (user.mfaEnabled) {
            return {
                mfaRequired: true,
                userId: user.id,
            };
        }
        return {
            accessToken: `mock-jwt-token-for-${user.id}`,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                tenantCode: tenant.tenantCode,
                tenantName: tenant.name,
                systemRole: user.systemRole,
                mustChangePassword: user.mustChangePassword,
            },
        };
    }
    async changePassword(email, newPassword) {
        const user = await this.prisma.user.findUnique({
            where: { email },
        });
        if (!user)
            throw new common_1.HttpException('User not found', common_1.HttpStatus.NOT_FOUND);
        return this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: newPassword,
                mustChangePassword: false,
            },
        });
    }
    async adminResetPassword(userId, newPassword) {
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                password: newPassword,
                mustChangePassword: true,
            },
        });
    }
    async completeMfaLogin(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { tenant: true },
        });
        if (!user)
            throw new common_1.HttpException('User not found', common_1.HttpStatus.NOT_FOUND);
        return {
            accessToken: `mock-jwt-token-for-${user.id}`,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                tenantCode: user.tenant.tenantCode,
                tenantName: user.tenant.name,
                systemRole: user.systemRole,
                mustChangePassword: user.mustChangePassword,
            },
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map