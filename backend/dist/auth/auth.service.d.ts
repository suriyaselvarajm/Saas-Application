import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private readonly prisma;
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
            mustChangePassword: boolean;
        };
        mfaRequired?: undefined;
        userId?: undefined;
    } | {
        mfaRequired: boolean;
        userId: string;
        accessToken?: undefined;
        user?: undefined;
    }>;
    changePassword(email: string, newPassword: string): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string;
        password: string | null;
        mustChangePassword: boolean;
        roleId: string | null;
        systemRole: import("@prisma/client").$Enums.SystemRole;
        mfaEnabled: boolean;
        mfaSecret: string | null;
    }>;
    adminResetPassword(userId: string, newPassword: string): Promise<{
        id: string;
        name: string | null;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        email: string;
        password: string | null;
        mustChangePassword: boolean;
        roleId: string | null;
        systemRole: import("@prisma/client").$Enums.SystemRole;
        mfaEnabled: boolean;
        mfaSecret: string | null;
    }>;
    completeMfaLogin(userId: string): Promise<{
        accessToken: string;
        user: {
            id: string;
            email: string;
            name: string | null;
            tenantCode: string;
            tenantName: string;
            systemRole: import("@prisma/client").$Enums.SystemRole;
            mustChangePassword: boolean;
        };
    }>;
}
