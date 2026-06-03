import { SubscriptionType } from '@prisma/client';
export declare class CreateTenantDto {
    tenantCode: string;
    name: string;
    companyName: string;
    domainName: string;
    subscriptionType?: SubscriptionType;
    timeZone?: string;
    country?: string;
    currency?: string;
    adminEmail: string;
    initialPassword: string;
    contactMobile?: string;
}
