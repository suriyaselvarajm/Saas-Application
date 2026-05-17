import { PrismaService } from '../prisma/prisma.service';
import { SmtpSettingsDto, TestSmtpDto } from './dto/smtp-settings.dto';
export declare class SmtpService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    upsert(tenantId: string, data: SmtpSettingsDto): Promise<{
        id: string;
        updatedAt: Date;
        password: string | null;
        tenantId: string;
        sslEnabled: boolean;
        port: number;
        host: string | null;
        senderEmail: string | null;
        senderName: string | null;
        username: string | null;
    }>;
    get(tenantId: string): Promise<{
        id: string;
        updatedAt: Date;
        password: string | null;
        tenantId: string;
        sslEnabled: boolean;
        port: number;
        host: string | null;
        senderEmail: string | null;
        senderName: string | null;
        username: string | null;
    }>;
    testConnection(dto: TestSmtpDto): {
        success: boolean;
        message: string;
    };
}
