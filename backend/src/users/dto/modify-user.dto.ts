import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ModifyUserDto {
  /** Identifier — must always be provided so we know which user to modify */
  @IsEmail()
  @IsNotEmpty()
  email: string;

  /** Action routing key — determines which LDAP operation to perform */
  @IsString()
  @IsOptional()
  action?: string;
  // Possible values: 'reset-password' | 'unlock' | 'enable-disable' | 'delete-users'
  // | 'restore-users' | 'move-ou' | 'group-membership' | 'profile-attributes'
  // | 'contact-attributes' | 'address-attributes' | 'naming-attributes'
  // | 'custom-attributes' | 'workstations' | 'permissions' | 'logon-hours'
  // | 'home-folders' | 'skype-actions' | 'skype-policies' | 'manage-photos'

  // Integration targets
  @IsBoolean()
  @IsOptional()
  modifyInAd?: boolean;

  @IsBoolean()
  @IsOptional()
  modifyInM365?: boolean;

  @IsString()
  @IsOptional()
  adSettingsId?: string;

  @IsString()
  @IsOptional()
  m365SettingsId?: string;

  // Identity / Naming
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  initials?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  displayName?: string;

  // Profile
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsOptional()
  office?: string;

  @IsString()
  @IsOptional()
  officePhone?: string;

  @IsString()
  @IsOptional()
  faxNumber?: string;

  @IsString()
  @IsOptional()
  mobileNumber?: string;

  @IsString()
  @IsOptional()
  employeeId?: string;

  @IsString()
  @IsOptional()
  descriptionGeneral?: string;

  @IsString()
  @IsOptional()
  webPage?: string;

  @IsString()
  @IsOptional()
  company?: string;

  @IsString()
  @IsOptional()
  manager?: string;

  // Address
  @IsString()
  @IsOptional()
  streetAddress?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  stateProvince?: string;

  @IsString()
  @IsOptional()
  zipPostalCode?: string;

  @IsString()
  @IsOptional()
  countryRegion?: string;

  @IsString()
  @IsOptional()
  poBox?: string;

  // Contact
  @IsString()
  @IsOptional()
  homePhone?: string;

  @IsString()
  @IsOptional()
  pager?: string;

  @IsString()
  @IsOptional()
  ipPhone?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  // AD placement
  @IsString()
  @IsOptional()
  targetOu?: string;

  /** Groups to ADD the user to */
  @IsOptional()
  adGroupDns?: string[];

  /** Groups to REMOVE the user from */
  @IsOptional()
  adGroupRemoveDns?: string[];

  /** 'add' | 'remove' — controls group membership operation */
  @IsString()
  @IsOptional()
  groupOperation?: string;

  // Account flags
  @IsBoolean()
  @IsOptional()
  accountDisabled?: boolean;

  @IsBoolean()
  @IsOptional()
  passwordNeverExpires?: boolean;

  @IsBoolean()
  @IsOptional()
  userMustChangePassword?: boolean;

  // Password reset
  @IsString()
  @IsOptional()
  newPassword?: string;

  @IsBoolean()
  @IsOptional()
  generatePassword?: boolean;

  // Custom / Extension attributes (AD extensionAttributeN)
  @IsString() @IsOptional() extensionAttribute1?: string;
  @IsString() @IsOptional() extensionAttribute2?: string;
  @IsString() @IsOptional() extensionAttribute3?: string;
  @IsString() @IsOptional() extensionAttribute4?: string;
  @IsString() @IsOptional() extensionAttribute5?: string;

  // User workstations (comma-separated computer names)
  @IsString()
  @IsOptional()
  workstations?: string;

  // Logon hours profile name
  @IsString()
  @IsOptional()
  logonHoursProfile?: string;

  // Home folder
  @IsString()
  @IsOptional()
  homeDirectory?: string;

  @IsString()
  @IsOptional()
  homeFolderOperation?: string; // 'move' | 'delete'

  // Skype / Teams
  @IsString()
  @IsOptional()
  skypeAction?: string; // 'enable' | 'disable' | 'delete'

  @IsString()
  @IsOptional()
  skypePolicy?: string;

  // M365 Licensing
  @IsString()
  @IsOptional()
  m365License?: string;

  @IsBoolean()
  @IsOptional()
  createWithoutLicense?: boolean;

  // Inheritable permissions
  @IsBoolean()
  @IsOptional()
  inheritPermissions?: boolean;

  // Template (optional, for tracking)
  @IsString()
  @IsOptional()
  selectedTemplate?: string;
}
