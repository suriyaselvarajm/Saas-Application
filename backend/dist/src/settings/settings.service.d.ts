import { PrismaService } from '../prisma/prisma.service';
import { M365SettingsDto } from './dto/m365-settings.dto';
import { AdSettingsDto } from './dto/ad-settings.dto';
import { AuthSettingsDto } from './dto/auth-settings.dto';
import { CreateOfficeDto, UpdateOfficeDto } from './dto/office.dto';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
export declare class SettingsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    updateM365(tenantId: string, data: M365SettingsDto & {
        id?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        azureTenantId: string | null;
        clientId: string | null;
        clientSecret: string | null;
        redirectUrl: string | null;
        microsoftDomain: string | null;
        graphApiStatus: string | null;
        updatedAt: Date;
    }>;
    updateAD(tenantId: string, data: AdSettingsDto & {
        id?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        updatedAt: Date;
        adServerIp: string | null;
        domainName: string | null;
        ldapPath: string | null;
        baseDn: string | null;
        userCreationBaseOu: string | null;
        bindUsername: string | null;
        bindPassword: string | null;
        sslEnabled: boolean;
        port: number;
    }>;
    deleteAD(id: string, tenantId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    deleteM365(id: string, tenantId: string): Promise<import("@prisma/client").Prisma.BatchPayload>;
    updateAuth(tenantId: string, data: AuthSettingsDto): Promise<{
        id: string;
        tenantId: string;
        updatedAt: Date;
        ssoEnabled: boolean;
        enforceM365Login: boolean;
        sessionTimeout: number;
        mfaEnforced: boolean;
        allowedDomains: string[];
        minCharacters: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSymbols: boolean;
        expiryDays: number;
    }>;
    getSettings(tenantId: string): Promise<{
        m365Settings: {
            id: string;
            tenantId: string;
            azureTenantId: string | null;
            clientId: string | null;
            clientSecret: string | null;
            redirectUrl: string | null;
            microsoftDomain: string | null;
            graphApiStatus: string | null;
            updatedAt: Date;
        }[];
        adSettings: {
            id: string;
            tenantId: string;
            updatedAt: Date;
            adServerIp: string | null;
            domainName: string | null;
            ldapPath: string | null;
            baseDn: string | null;
            userCreationBaseOu: string | null;
            bindUsername: string | null;
            bindPassword: string | null;
            sslEnabled: boolean;
            port: number;
        }[];
        authSettings: {
            id: string;
            tenantId: string;
            updatedAt: Date;
            ssoEnabled: boolean;
            enforceM365Login: boolean;
            sessionTimeout: number;
            mfaEnforced: boolean;
            allowedDomains: string[];
            minCharacters: number;
            requireUppercase: boolean;
            requireLowercase: boolean;
            requireNumbers: boolean;
            requireSymbols: boolean;
            expiryDays: number;
        } | null;
        smtpSettings: {
            id: string;
            tenantId: string;
            updatedAt: Date;
            sslEnabled: boolean;
            port: number;
            host: string | null;
            senderEmail: string | null;
            senderName: string | null;
            username: string | null;
            password: string | null;
        } | null;
    } & {
        id: string;
        updatedAt: Date;
        createdAt: Date;
        name: string;
        domainName: string;
        tenantCode: string;
        companyName: string;
        status: import("@prisma/client").$Enums.TenantStatus;
        subscriptionType: import("@prisma/client").$Enums.SubscriptionType;
        timeZone: string | null;
        country: string | null;
        currency: string | null;
        contactEmail: string | null;
        contactMobile: string | null;
        logoUrl: string | null;
        faviconUrl: string | null;
        createdBy: string | null;
        updatedBy: string | null;
        deletedAt: Date | null;
    }>;
    testM365Connection(): {
        success: boolean;
        message: string;
    };
    testAdConnection(data: AdSettingsDto): Promise<{
        success: boolean;
        message: string;
    }>;
    fetchAdOUs(tenantId: string, adSettingsId: string): Promise<{
        name: string;
        dn: string;
        path: string;
    }[]>;
    fetchAdGroups(tenantId: string, adSettingsId: string): Promise<{
        name: string;
        dn: string;
        path: string;
    }[]>;
    fetchAdUsers(tenantId: string, adSettingsId: string): Promise<{
        name: string;
        dn: string;
        path: string;
        email?: string;
    }[]>;
    getOffices(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        updatedAt: Date;
        createdAt: Date;
        name: string;
        country: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        latitude: number | null;
        longitude: number | null;
        isDefault: boolean;
    }[]>;
    createOffice(tenantId: string, data: CreateOfficeDto): Promise<{
        id: string;
        tenantId: string;
        updatedAt: Date;
        createdAt: Date;
        name: string;
        country: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        latitude: number | null;
        longitude: number | null;
        isDefault: boolean;
    }>;
    updateOffice(id: string, tenantId: string, data: UpdateOfficeDto): Promise<{
        id: string;
        tenantId: string;
        updatedAt: Date;
        createdAt: Date;
        name: string;
        country: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        latitude: number | null;
        longitude: number | null;
        isDefault: boolean;
    }>;
    deleteOffice(id: string, tenantId: string): Promise<{
        id: string;
        tenantId: string;
        updatedAt: Date;
        createdAt: Date;
        name: string;
        country: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        latitude: number | null;
        longitude: number | null;
        isDefault: boolean;
    }>;
    getDepartments(tenantId: string): Promise<{
        id: string;
        tenantId: string;
        updatedAt: Date;
        createdAt: Date;
        name: string;
        status: string;
    }[]>;
    createDepartment(tenantId: string, data: CreateDepartmentDto): Promise<{
        id: string;
        tenantId: string;
        updatedAt: Date;
        createdAt: Date;
        name: string;
        status: string;
    }>;
    updateDepartment(id: string, tenantId: string, data: UpdateDepartmentDto): Promise<{
        id: string;
        tenantId: string;
        updatedAt: Date;
        createdAt: Date;
        name: string;
        status: string;
    }>;
    deleteDepartment(id: string, tenantId: string): Promise<{
        id: string;
        tenantId: string;
        updatedAt: Date;
        createdAt: Date;
        name: string;
        status: string;
    }>;
}
