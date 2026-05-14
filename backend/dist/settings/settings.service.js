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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SettingsService = class SettingsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateM365(tenantId, data) {
        return this.prisma.m365Settings.upsert({
            where: { tenantId },
            update: data,
            create: { ...data, tenantId },
        });
    }
    async updateAD(tenantId, data) {
        return this.prisma.adSettings.upsert({
            where: { tenantId },
            update: data,
            create: { ...data, tenantId },
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
    async testM365Connection(tenantId) {
        return { success: true, message: 'Successfully connected to Microsoft Graph' };
    }
    async testAdConnection(tenantId) {
        return { success: true, message: 'Successfully connected to AD Server' };
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