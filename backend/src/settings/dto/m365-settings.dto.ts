import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class M365SettingsDto {
  @IsString()
  @IsNotEmpty()
  azureTenantId: string;

  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsNotEmpty()
  clientSecret: string;

  @IsUrl()
  @IsNotEmpty()
  redirectUrl: string;

  @IsString()
  @IsOptional()
  microsoftDomain?: string;
}
