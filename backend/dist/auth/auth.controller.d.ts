import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getTenantConfig(domain: string): Promise<{
        tenantId: string;
        tenantCode: string;
        name: string;
        azureTenantId: string | null;
        clientId: string | null;
        redirectUrl: string | null;
    }>;
    handleM365Callback(body: {
        code: string;
        domain: string;
    }): Promise<{
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
    login(body: {
        email: string;
        password?: string;
    }): Promise<{
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
    changePassword(body: {
        email: string;
        newPassword: string;
    }): Promise<{
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
    }>;
    adminResetPassword(body: {
        userId: string;
        newPassword: string;
    }): Promise<{
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
    }>;
}
