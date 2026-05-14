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
exports.EmailTemplateController = void 0;
const common_1 = require("@nestjs/common");
const email_template_service_1 = require("./email-template.service");
const email_template_dto_1 = require("./dto/email-template.dto");
const tenant_id_decorator_1 = require("../common/decorators/tenant-id.decorator");
let EmailTemplateController = class EmailTemplateController {
    emailTemplateService;
    constructor(emailTemplateService) {
        this.emailTemplateService = emailTemplateService;
    }
    create(tenantId, dto) {
        return this.emailTemplateService.create(tenantId, dto);
    }
    findAll(tenantId) {
        return this.emailTemplateService.findAll(tenantId);
    }
    findOne(tenantId, id) {
        return this.emailTemplateService.findOne(tenantId, id);
    }
    update(tenantId, id, dto) {
        return this.emailTemplateService.update(tenantId, id, dto);
    }
    remove(tenantId, id) {
        return this.emailTemplateService.remove(tenantId, id);
    }
};
exports.EmailTemplateController = EmailTemplateController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, email_template_dto_1.CreateEmailTemplateDto]),
    __metadata("design:returntype", void 0)
], EmailTemplateController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmailTemplateController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EmailTemplateController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, email_template_dto_1.UpdateEmailTemplateDto]),
    __metadata("design:returntype", void 0)
], EmailTemplateController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, tenant_id_decorator_1.TenantId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EmailTemplateController.prototype, "remove", null);
exports.EmailTemplateController = EmailTemplateController = __decorate([
    (0, common_1.Controller)('settings/email-templates'),
    __metadata("design:paramtypes", [email_template_service_1.EmailTemplateService])
], EmailTemplateController);
//# sourceMappingURL=email-template.controller.js.map