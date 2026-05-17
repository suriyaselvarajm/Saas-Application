import { EmailTemplateService } from './email-template.service';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto } from './dto/email-template.dto';
export declare class EmailTemplateController {
    private readonly emailTemplateService;
    constructor(emailTemplateService: EmailTemplateService);
    create(tenantId: string, dto: CreateEmailTemplateDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        subject: string | null;
        body: string | null;
        variables: string[];
    }>;
    findAll(tenantId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        subject: string | null;
        body: string | null;
        variables: string[];
    }[]>;
    findOne(tenantId: string, id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        subject: string | null;
        body: string | null;
        variables: string[];
    }>;
    update(tenantId: string, id: string, dto: UpdateEmailTemplateDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        subject: string | null;
        body: string | null;
        variables: string[];
    }>;
    remove(tenantId: string, id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        subject: string | null;
        body: string | null;
        variables: string[];
    }>;
}
