import { PrismaService } from '../prisma/prisma.service';
import { CreateEmailTemplateDto, UpdateEmailTemplateDto } from './dto/email-template.dto';
export declare class EmailTemplateService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, data: CreateEmailTemplateDto): Promise<{
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
    update(tenantId: string, id: string, data: UpdateEmailTemplateDto): Promise<{
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
