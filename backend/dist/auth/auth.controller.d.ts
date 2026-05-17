import { AuthService } from './auth.service';
import { MfaService } from './mfa.service';
export declare class AuthController {
    private readonly authService;
    private readonly mfaService;
    constructor(authService: AuthService, mfaService: MfaService);
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
        mfaRequired?: undefined;
        userId?: undefined;
    } | {
        mfaRequired: boolean;
        userId: string;
        accessToken?: undefined;
        user?: undefined;
    }>;
    changePassword(body: {
        email: string;
        newPassword: string;
    }): Promise<{
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string | null;
        mustChangePassword: boolean;
        systemRole: import("@prisma/client").$Enums.SystemRole;
        mfaEnabled: boolean;
        mfaSecret: string | null;
        roleId: string | null;
        tenantId: string;
    }>;
    adminResetPassword(body: {
        userId: string;
        newPassword: string;
    }): Promise<{
        name: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        email: string;
        password: string | null;
        mustChangePassword: boolean;
        systemRole: import("@prisma/client").$Enums.SystemRole;
        mfaEnabled: boolean;
        mfaSecret: string | null;
        roleId: string | null;
        tenantId: string;
    }>;
    setupMfa(body: {
        userId: string;
    }): Promise<any>;
    enableMfa(body: {
        userId: string;
        token: string;
    }): Promise<any>;
    verifyMfaLogin(body: {
        userId: string;
        token: string;
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
    disableMfa(body: {
        userId: string;
        token: string;
    }): Promise<any>;
}
