import { PrismaService } from '../prisma/prisma.service';
export declare class MfaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    generateSetup(userId: string): Promise<{
        otpauthUrl: string;
        qrCodeDataUrl: string;
        secret: string;
    }>;
    enableMfa(userId: string, token: string): Promise<{
        success: boolean;
    }>;
    verifyLoginOtp(userId: string, token: string): Promise<boolean>;
    disableMfa(userId: string, token: string): Promise<{
        success: boolean;
    }>;
}
