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
exports.UserCreationController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const userCreation_service_1 = require("./userCreation.service");
let UserCreationController = class UserCreationController {
    userCreationService;
    constructor(userCreationService) {
        this.userCreationService = userCreationService;
    }
    createSingleUser(userData) {
        return this.userCreationService.createSingleUser(userData);
    }
    createBulkUsers(file) {
        return this.userCreationService.createBulkUsers(file);
    }
};
exports.UserCreationController = UserCreationController;
__decorate([
    (0, common_1.Post)('single'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserCreationController.prototype, "createSingleUser", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UserCreationController.prototype, "createBulkUsers", null);
exports.UserCreationController = UserCreationController = __decorate([
    (0, common_1.Controller)('user-creation'),
    __metadata("design:paramtypes", [userCreation_service_1.UserCreationService])
], UserCreationController);
//# sourceMappingURL=userCreation.controller.js.map