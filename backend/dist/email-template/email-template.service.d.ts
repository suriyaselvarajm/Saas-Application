import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto } from './dto/email-template.dto';
export declare class EmailTemplateService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, data: CreateEmailTemplateDto): Promise<{
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
    update(tenantId: string, id: string, data: UpdateEmailTemplateDto): Promise<{
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
