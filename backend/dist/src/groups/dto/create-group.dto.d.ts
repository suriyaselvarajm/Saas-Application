export declare class CreateGroupDto {
    groupName: string;
    description?: string;
    groupType?: string;
    groupScope?: string;
    notes?: string;
    targetOu?: string;
    createInAd?: boolean;
    adSettingsId?: string;
    mailEnabled?: boolean;
    mail?: string;
    isDynamic?: boolean;
    dynamicQuery?: string;
}
