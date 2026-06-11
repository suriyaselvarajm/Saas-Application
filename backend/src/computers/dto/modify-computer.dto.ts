import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class ModifyComputerDto {
  @IsString()
  @IsNotEmpty()
  computerName: string;

  @IsString()
  @IsOptional()
  action?: string;

  @IsBoolean()
  @IsOptional()
  modifyInAd?: boolean;

  @IsString()
  @IsOptional()
  adSettingsId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  managedBy?: string;

  @IsString()
  @IsOptional()
  dnsName?: string;

  @IsString()
  @IsOptional()
  operatingSystem?: string;

  @IsString()
  @IsOptional()
  operatingSystemVersion?: string;

  @IsString()
  @IsOptional()
  servicePrincipalName?: string;

  @IsString()
  @IsOptional()
  targetOu?: string;

  @IsOptional()
  adGroupDns?: string[];

  @IsOptional()
  adGroupRemoveDns?: string[];

  @IsString()
  @IsOptional()
  groupOperation?: string;

  @IsBoolean()
  @IsOptional()
  accountDisabled?: boolean;

  @IsString()
  @IsOptional()
  extensionAttribute1?: string;

  @IsString()
  @IsOptional()
  extensionAttribute2?: string;

  @IsString()
  @IsOptional()
  extensionAttribute3?: string;

  @IsString()
  @IsOptional()
  extensionAttribute4?: string;

  @IsString()
  @IsOptional()
  extensionAttribute5?: string;
}
