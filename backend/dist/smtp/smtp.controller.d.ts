import { SmtpService } from './smtp.service';
import { SmtpSettingsDto, TestSmtpDto } from './dto/smtp-settings.dto';
export declare class SmtpController {
    private readonly smtpService;
    constructor(smtpService: SmtpService);
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
    upsert(tenantId: string, dto: SmtpSettingsDto): Promise<{
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
    test(tenantId: string, dto: TestSmtpDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
