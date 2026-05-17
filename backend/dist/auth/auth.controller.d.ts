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
        mfaEnabled: boolean;
        mfaSecret: string | null;
    }>;
    setupMfa(body: {
        userId: string;
    }): Promise<{
        otpauthUrl: string;
        qrCodeDataUrl: string;
        secret: string;
    }>;
    enableMfa(body: {
        userId: string;
        token: string;
    }): Promise<{
        success: boolean;
    }>;
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
    }): Promise<{
        success: boolean;
    }>;
}
