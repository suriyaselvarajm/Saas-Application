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
exports.TenantService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let TenantService = class TenantService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createTenantDto) {
        const { adminEmail, initialPassword, ...tenantData } = createTenantDto;
        const existing = await this.prisma.tenant.findUnique({
            where: { tenantCode: tenantData.tenantCode },
        });
        if (existing) {
            throw new common_1.ConflictException('Tenant code already exists');
        }
        return this.prisma.tenant.create({
            data: {
                ...tenantData,
                status: client_1.TenantStatus.ACTIVE,
                m365Settings: {
                    create: {
                        azureTenantId: `mock-azure-id-${tenantData.tenantCode}`,
                        clientId: `mock-client-id-${tenantData.tenantCode}`,
                        redirectUrl: 'http://localhost:3000/auth/callback',
                    },
                },
                users: {
                    create: {
                        email: adminEmail,
                        password: initialPassword,
                        mustChangePassword: true,
                        name: 'Tenant Administrator',
                        systemRole: 'TENANT_ADMIN',
                    },
                },
            },
            include: { users: true },
        });
    }
    async findAll() {
        return this.prisma.tenant.findMany({
            where: { deletedAt: null },
            include: { users: true },
        });
    }
    async findOne(id) {
        const tenant = await this.prisma.tenant.findFirst({
            where: { id, deletedAt: null },
        });
        if (!tenant) {
            throw new common_1.NotFoundException(`Tenant with ID ${id} not found`);
        }
        return tenant;
    }
    async update(id, updateTenantDto) {
        const { adminEmail, ...tenantData } = updateTenantDto;
        await this.findOne(id);
        if (adminEmail) {
            const adminUser = await this.prisma.user.findFirst({
                where: { tenantId: id, systemRole: 'TENANT_ADMIN' },
            });
            if (adminUser) {
                await this.prisma.user.update({
                    where: { id: adminUser.id },
                    data: { email: adminEmail },
                });
            }
        }
        return this.prisma.tenant.update({
            where: { id },
            data: tenantData,
        });
    }
    async remove(id) {
        await this.findOne(id);
        return this.prisma.tenant.update({
            where: { id },
            data: { deletedAt: new Date(), status: client_1.TenantStatus.DISABLED },
        });
    }
};
exports.TenantService = TenantService;
exports.TenantService = TenantService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenantService);
//# sourceMappingURL=tenant.service.js.map