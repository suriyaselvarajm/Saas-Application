export declare class ModifyGroupDto {
    groupName: string;
    action?: string;
    modifyInAd?: boolean;
    adSettingsId?: string;
    description?: string;
    notes?: string;
    targetOu?: string;
    mail?: string;
    mailEnabled?: boolean;
    groupType?: string;
    groupScope?: string;
    hideFromAddressLists?: boolean;
    isDynamic?: boolean;
    dynamicQuery?: string;
}
