export declare class CreateSingleUserDto {
    email: string;
    firstName: string;
    initials?: string;
    lastName: string;
    displayName: string;
    password: string;
    createInAd: boolean;
    createInM365: boolean;
    adSettingsId?: string;
    m365SettingsId?: string;
    jobTitle: string;
    department?: string;
    office: string;
    officePhone?: string;
    faxNumber?: string;
    mobileNumber: string;
    streetAddress?: string;
    city?: string;
    stateProvince?: string;
    zipPostalCode?: string;
    countryRegion?: string;
    m365License?: string;
    createWithoutLicense?: boolean;
    targetOu?: string;
    adGroupDn?: string;
}
