import { PrismaService } from '../prisma/prisma.service';
import { SmtpSettingsDto, TestSmtpDto } from './dto/smtp-settings.dto';
export declare class SmtpService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    upsert(tenantId: string, data: SmtpSettingsDto): Promise<{
        id: string;
        tenantId: string;
        host: string | null;
        port: number;
        senderEmail: string | null;
        senderName: string | null;
        username: string | null;
        password: string | null;
        sslEnabled: boolean;
        updatedAt: Date;
    }>;
    get(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        host: string | null;
        port: number;
        senderEmail: string | null;
        senderName: string | null;
        username: string | null;
        password: string | null;
        sslEnabled: boolean;
        updatedAt: Date;
    }>;
    testConnection(dto: TestSmtpDto): {
        success: boolean;
        message: string;
    };
}
