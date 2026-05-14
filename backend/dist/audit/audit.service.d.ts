import { PrismaService } from '../prisma/prisma.service';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(data: {
        tenantId: string;
        userId?: string;
        module: string;
        action: string;
        details?: any;
        ipAddress?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        userId: string | null;
        module: string;
        action: string;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
    }>;
    findAll(tenantId: string): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        userId: string | null;
        module: string;
        action: string;
        details: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
    }[]>;
}
