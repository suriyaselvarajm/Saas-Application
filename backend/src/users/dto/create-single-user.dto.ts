import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateSingleUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsOptional()
  initials?: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  displayName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsBoolean()
  createInAd: boolean;

  @IsBoolean()
  createInM365: boolean;

  @IsString()
  @IsOptional()
  adSettingsId?: string;

  @IsString()
  @IsOptional()
  m365SettingsId?: string;

  // Profile Info Fields
  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsNotEmpty()
  office: string;

  @IsString()
  @IsOptional()
  officePhone?: string;

  @IsString()
  @IsOptional()
  faxNumber?: string;

  @IsString()
  @IsNotEmpty()
  mobileNumber: string;

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

  // M365 Licensing Fields
  @IsString()
  @IsOptional()
  m365License?: string;

  @IsBoolean()
  @IsOptional()
  createWithoutLicense?: boolean;

  @IsString()
  @IsOptional()
  targetOu?: string;

  @IsString()
  @IsOptional()
  adGroupDn?: string;
}
