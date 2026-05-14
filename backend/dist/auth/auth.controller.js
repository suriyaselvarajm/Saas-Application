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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    async getTenantConfig(domain) {
        if (!domain) {
            throw new common_1.HttpException('Domain is required', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.authService.getTenantConfigByDomain(domain);
    }
    async handleM365Callback(body) {
        if (!body.code || !body.domain) {
            throw new common_1.HttpException('Code and domain are required', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.authService.exchangeM365Token(body.code, body.domain);
    }
    async login(body) {
        if (!body.email) {
            throw new common_1.HttpException('Email is required', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.authService.login(body.email, body.password);
    }
    async changePassword(body) {
        if (!body.email || !body.newPassword) {
            throw new common_1.HttpException('Email and new password are required', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.authService.changePassword(body.email, body.newPassword);
    }
    async adminResetPassword(body) {
        if (!body.userId || !body.newPassword) {
            throw new common_1.HttpException('User ID and new password are required', common_1.HttpStatus.BAD_REQUEST);
        }
        return this.authService.adminResetPassword(body.userId, body.newPassword);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('tenant-config'),
    __param(0, (0, common_1.Query)('domain')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getTenantConfig", null);
__decorate([
    (0, common_1.Post)('m365/callback'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "handleM365Callback", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('change-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "adminResetPassword", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map