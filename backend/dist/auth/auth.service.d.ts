import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private prisma;
    constructor(prisma: PrismaService);
    getTenantConfigByDomain(domain: string): Promise<{
        tenantId: string;
        tenantCode: string;
        name: string;
        azureTenantId: string | null;
        clientId: string | null;
        redirectUrl: string | null;
    }>;
    exchangeM365Token(code: string, domain: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            tenantCode: string;
            tenantName: string;
            isSuperAdmin: boolean;
        };
    }>;
    login(email: string, password?: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            tenantCode: string;
            tenantName: string;
            systemRole: import("@prisma/client").$Enums.SystemRole;
        };
    }>;
}
