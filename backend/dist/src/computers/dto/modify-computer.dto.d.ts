export declare class ModifyComputerDto {
    computerName: string;
    action?: string;
    modifyInAd?: boolean;
    adSettingsId?: string;
    description?: string;
    location?: string;
    managedBy?: string;
    dnsName?: string;
    operatingSystem?: string;
    operatingSystemVersion?: string;
    servicePrincipalName?: string;
    targetOu?: string;
    adGroupDns?: string[];
    adGroupRemoveDns?: string[];
    groupOperation?: string;
    accountDisabled?: boolean;
    extensionAttribute1?: string;
    extensionAttribute2?: string;
    extensionAttribute3?: string;
    extensionAttribute4?: string;
    extensionAttribute5?: string;
}
