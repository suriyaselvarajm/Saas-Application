export declare class AuthSettingsDto {
    ssoEnabled?: boolean;
    enforceM365Login?: boolean;
    sessionTimeout?: number;
    mfaEnforced?: boolean;
    allowedDomains?: string[];
    minCharacters?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSymbols?: boolean;
    expiryDays?: number;
    tenantId?: string;
    createdAt?: string;
    updatedAt?: string;
}
