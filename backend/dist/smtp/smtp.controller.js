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
exports.SmtpController = void 0;
const common_1 = require("@nestjs/common");
const smtp_service_1 = require("./smtp.service");
const smtp_settings_dto_1 = require("./dto/smtp-settings.dto");
const tenant_id_decorator_1 = require("../common/decorators/tenant-id.decorator");
let SmtpController = class SmtpController {
    smtpService;
    constructor(smtpService) {
        this.smtpService = smtpService;
    }
    get(tenantId) {
        return this.smtpService.get(tenantId);
    }
    upsert(tenantId, dto) {
        return this.smtpService.upsert(tenantId, dto);
    }
    test(dto) {
        return this.smtpService.testConnection(dto);
    }
};
exports.SmtpController = SmtpController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SmtpController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, smtp_settings_dto_1.SmtpSettingsDto]),
    __metadata("design:returntype", void 0)
], SmtpController.prototype, "upsert", null);
__decorate([
    (0, common_1.Post)('test'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [smtp_settings_dto_1.TestSmtpDto]),
    __metadata("design:returntype", void 0)
], SmtpController.prototype, "test", null);
exports.SmtpController = SmtpController = __decorate([
    (0, common_1.Controller)('settings/smtp'),
    __metadata("design:paramtypes", [smtp_service_1.SmtpService])
], SmtpController);
//# sourceMappingURL=smtp.controller.js.map