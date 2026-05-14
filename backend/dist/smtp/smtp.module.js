"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmtpModule = void 0;
const common_1 = require("@nestjs/common");
const smtp_service_1 = require("./smtp.service");
const smtp_controller_1 = require("./smtp.controller");
let SmtpModule = class SmtpModule {
};
exports.SmtpModule = SmtpModule;
exports.SmtpModule = SmtpModule = __decorate([
    (0, common_1.Module)({
        providers: [smtp_service_1.SmtpService],
        controllers: [smtp_controller_1.SmtpController],
        exports: [smtp_service_1.SmtpService],
    })
], SmtpModule);
//# sourceMappingURL=smtp.module.js.map