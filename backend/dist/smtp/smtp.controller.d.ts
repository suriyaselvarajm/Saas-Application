import { SmtpService } from './smtp.service';
import { SmtpSettingsDto, TestSmtpDto } from './dto/smtp-settings.dto';
export declare class SmtpController {
    private readonly smtpService;
    constructor(smtpService: SmtpService);
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
    upsert(tenantId: string, dto: SmtpSettingsDto): Promise<{
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
    test(dto: TestSmtpDto): {
        success: boolean;
        message: string;
    };
}
