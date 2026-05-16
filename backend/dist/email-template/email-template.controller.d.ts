import { EmailTemplateService } from './email-template.service';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto } from './dto/email-template.dto';
export declare class EmailTemplateController {
    private readonly emailTemplateService;
    constructor(emailTemplateService: EmailTemplateService);
    create(tenantId: string, dto: CreateEmailTemplateDto): Promise<{
        id: string;
        name: string;
        subject: string | null;
        body: string | null;
        variables: string[];
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
    }>;
    findAll(tenantId: string): Promise<{
        id: string;
        name: string;
        subject: string | null;
        body: string | null;
        variables: string[];
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
    }[]>;
    findOne(tenantId: string, id: string): Promise<{
        id: string;
        name: string;
        subject: string | null;
        body: string | null;
        variables: string[];
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
    }>;
    update(tenantId: string, id: string, dto: UpdateEmailTemplateDto): Promise<{
        id: string;
        name: string;
        subject: string | null;
        body: string | null;
        variables: string[];
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
    }>;
    remove(tenantId: string, id: string): Promise<{
        id: string;
        name: string;
        subject: string | null;
        body: string | null;
        variables: string[];
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
    }>;
}
