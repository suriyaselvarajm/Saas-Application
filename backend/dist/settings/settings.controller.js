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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const settings_service_1 = require("./settings.service");
const m365_settings_dto_1 = require("./dto/m365-settings.dto");
const ad_settings_dto_1 = require("./dto/ad-settings.dto");
const auth_settings_dto_1 = require("./dto/auth-settings.dto");
const office_dto_1 = require("./dto/office.dto");
const department_dto_1 = require("./dto/department.dto");
const tenant_id_decorator_1 = require("../common/decorators/tenant-id.decorator");
const audit_interceptor_1 = require("../audit/audit.interceptor");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let SettingsController = class SettingsController {
    settingsService;
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    getSettings(tenantId) {
        return this.settingsService.getSettings(tenantId);
    }
    updateM365(tenantId, data) {
        return this.settingsService.updateM365(tenantId, data);
    }
    async updateAD(tenantId, data) {
        try {
            return await this.settingsService.updateAD(tenantId, data);
        }
        catch (error) {
            console.error('Error updating AD settings:', error);
            throw error;
        }
    }
    updateAuth(tenantId, data) {
        return this.settingsService.updateAuth(tenantId, data);
    }
    testM365() {
        return this.settingsService.testM365Connection();
    }
    testAD(data) {
        return this.settingsService.testAdConnection(data);
    }
    deleteAD(tenantId, id) {
        return this.settingsService.deleteAD(id, tenantId);
    }
    fetchAdOUs(tenantId, id) {
        return this.settingsService.fetchAdOUs(tenantId, id);
    }
    deleteM365(tenantId, id) {
        return this.settingsService.deleteM365(id, tenantId);
    }
    getOffices(tenantId) {
        return this.settingsService.getOffices(tenantId);
    }
    createOffice(tenantId, data) {
        return this.settingsService.createOffice(tenantId, data);
    }
    updateOffice(tenantId, id, data) {
        return this.settingsService.updateOffice(id, tenantId, data);
    }
    deleteOffice(tenantId, id) {
        return this.settingsService.deleteOffice(id, tenantId);
    }
    getDepartments(tenantId) {
        return this.settingsService.getDepartments(tenantId);
    }
    createDepartment(tenantId, data) {
        return this.settingsService.createDepartment(tenantId, data);
    }
    updateDepartment(tenantId, id, data) {
        return this.settingsService.updateDepartment(id, tenantId, data);
    }
    deleteDepartment(tenantId, id) {
        return this.settingsService.deleteDepartment(id, tenantId);
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Post)('m365'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, m365_settings_dto_1.M365SettingsDto]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "updateM365", null);
__decorate([
    (0, common_1.Post)('ad'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, ad_settings_dto_1.AdSettingsDto]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateAD", null);
__decorate([
    (0, common_1.Post)('auth'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, auth_settings_dto_1.AuthSettingsDto]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "updateAuth", null);
__decorate([
    (0, common_1.Post)('m365/test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "testM365", null);
__decorate([
    (0, common_1.Post)('ad/test'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [ad_settings_dto_1.AdSettingsDto]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "testAD", null);
__decorate([
    (0, common_1.Delete)('ad/:id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "deleteAD", null);
__decorate([
    (0, common_1.Get)('ad/:id/ou'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "fetchAdOUs", null);
__decorate([
    (0, common_1.Delete)('m365/:id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "deleteM365", null);
__decorate([
    (0, common_1.Get)('offices'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "getOffices", null);
__decorate([
    (0, common_1.Post)('offices'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, office_dto_1.CreateOfficeDto]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "createOffice", null);
__decorate([
    (0, common_1.Patch)('offices/:id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, office_dto_1.UpdateOfficeDto]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "updateOffice", null);
__decorate([
    (0, common_1.Delete)('offices/:id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "deleteOffice", null);
__decorate([
    (0, common_1.Get)('departments'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "getDepartments", null);
__decorate([
    (0, common_1.Post)('departments'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, department_dto_1.CreateDepartmentDto]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "createDepartment", null);
__decorate([
    (0, common_1.Patch)('departments/:id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, department_dto_1.UpdateDepartmentDto]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "updateDepartment", null);
__decorate([
    (0, common_1.Delete)('departments/:id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "deleteDepartment", null);
exports.SettingsController = SettingsController = __decorate([
    (0, common_1.Controller)('settings'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.SystemRole.TENANT_ADMIN),
    (0, common_1.UseInterceptors)(audit_interceptor_1.AuditInterceptor),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map