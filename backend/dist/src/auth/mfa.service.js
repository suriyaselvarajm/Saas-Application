"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MfaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const speakeasy = __importStar(require("speakeasy"));
const QRCode = __importStar(require("qrcode"));
let MfaService = class MfaService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateSetup(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.HttpException('User not found', common_1.HttpStatus.NOT_FOUND);
        const secret = speakeasy.generateSecret({
            name: `Petrus IAM (${user.email})`,
            length: 20,
        });
        await this.prisma.user.update({
            where: { id: userId },
            data: { mfaSecret: secret.base32 },
        });
        const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url ?? '');
        return {
            otpauthUrl: secret.otpauth_url ?? '',
            qrCodeDataUrl,
            secret: secret.base32,
        };
    }
    async enableMfa(userId, token) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.mfaSecret) {
            throw new common_1.HttpException('MFA setup not initiated', common_1.HttpStatus.BAD_REQUEST);
        }
        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token,
            window: 1,
        });
        if (!verified) {
            throw new common_1.HttpException('Invalid verification code', common_1.HttpStatus.UNAUTHORIZED);
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { mfaEnabled: true },
        });
        return { success: true };
    }
    async verifyLoginOtp(userId, token) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.mfaSecret || !user?.mfaEnabled)
            return false;
        return speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token,
            window: 1,
        });
    }
    async disableMfa(userId, token) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user?.mfaSecret) {
            throw new common_1.HttpException('MFA is not enabled', common_1.HttpStatus.BAD_REQUEST);
        }
        const verified = speakeasy.totp.verify({
            secret: user.mfaSecret,
            encoding: 'base32',
            token,
            window: 1,
        });
        if (!verified) {
            throw new common_1.HttpException('Invalid verification code', common_1.HttpStatus.UNAUTHORIZED);
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { mfaEnabled: false, mfaSecret: null },
        });
        return { success: true };
    }
};
exports.MfaService = MfaService;
exports.MfaService = MfaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MfaService);
//# sourceMappingURL=mfa.service.js.map