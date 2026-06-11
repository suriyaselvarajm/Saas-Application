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
        updatedAt: Date;
        azureTenantId: string | null;
        clientId: string | null;
        clientSecret: string | null;
        redirectUrl: string | null;
        microsoftDomain: string | null;
        graphApiStatus: string | null;
    }>;
    updateAD(tenantId: string, data: AdSettingsDto & {
        id?: string;
    }): Promise<{
        id: string;
        tenantId: string;
        updatedAt: Date;
        domainName: string | null;
        adServerIp: string | null;
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
            updatedAt: Date;
            azureTenantId: string | null;
            clientId: string | null;
            clientSecret: string | null;
            redirectUrl: string | null;
            microsoftDomain: string | null;
            graphApiStatus: string | null;
        }[];
        adSettings: {
            id: string;
            tenantId: string;
            updatedAt: Date;
            domainName: string | null;
            adServerIp: string | null;
            ldapPath: string | null;
            baseDn: string | null;
            userCreationBaseOu: string | null;
            bindUsername: string | null;
            bindPassword: string | null;
            sslEnabled: boolean;
            port: number;
        }[];
        smtpSettings: {
            id: string;
            password: string | null;
            tenantId: string;
            updatedAt: Date;
            sslEnabled: boolean;
            port: number;
            host: string | null;
            senderEmail: string | null;
            senderName: string | null;
            username: string | null;
        } | null;
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
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        tenantCode: string;
        companyName: string;
        domainName: string;
        subscriptionType: import("@prisma/client").$Enums.SubscriptionType;
        timeZone: string | null;
        country: string | null;
        currency: string | null;
        contactMobile: string | null;
        status: import("@prisma/client").$Enums.TenantStatus;
        contactEmail: string | null;
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
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        country: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        isDefault: boolean;
        latitude: number | null;
        longitude: number | null;
    }[]>;
    createOffice(tenantId: string, data: CreateOfficeDto): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        country: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        isDefault: boolean;
        latitude: number | null;
        longitude: number | null;
    }>;
    updateOffice(id: string, tenantId: string, data: UpdateOfficeDto): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        country: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        isDefault: boolean;
        latitude: number | null;
        longitude: number | null;
    }>;
    deleteOffice(id: string, tenantId: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        country: string | null;
        address: string | null;
        city: string | null;
        state: string | null;
        zipCode: string | null;
        isDefault: boolean;
        latitude: number | null;
        longitude: number | null;
    }>;
    getDepartments(tenantId: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
    }[]>;
    createDepartment(tenantId: string, data: CreateDepartmentDto): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
    }>;
    updateDepartment(id: string, tenantId: string, data: UpdateDepartmentDto): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
    }>;
    deleteDepartment(id: string, tenantId: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
    }>;
}
