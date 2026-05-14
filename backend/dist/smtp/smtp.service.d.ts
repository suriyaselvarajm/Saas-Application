import { PrismaService } from '../prisma/prisma.service';
import { SmtpSettingsDto, TestSmtpDto } from './dto/smtp-settings.dto';
export declare class SmtpService {
    private prisma;
    constructor(prisma: PrismaService);
    upsert(tenantId: string, data: SmtpSettingsDto): Promise<{
        id: string;
        updatedAt: Date;
        tenantId: string;
        sslEnabled: boolean;
        port: number;
        host: string | null;
        senderEmail: string | null;
        senderName: string | null;
        username: string | null;
        password: string | null;
    }>;
    get(tenantId: string): Promise<{
        id: string;
        updatedAt: Date;
        tenantId: string;
        sslEnabled: boolean;
        port: number;
        host: string | null;
        senderEmail: string | null;
        senderName: string | null;
        username: string | null;
        password: string | null;
    }>;
    testConnection(tenantId: string, dto: TestSmtpDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
