import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AdSettingsDto {
  @IsString()
  @IsNotEmpty()
  adServerIp: string;

  @IsString()
  @IsNotEmpty()
  domainName: string;

  @IsString()
  @IsNotEmpty()
  ldapPath: string;

  @IsString()
  @IsNotEmpty()
  baseDn: string;

  @IsString()
  @IsNotEmpty()
  bindUsername: string;

  @IsString()
  @IsNotEmpty()
  bindPassword: string;

  @IsBoolean()
  @IsOptional()
  sslEnabled?: boolean;

  @IsInt()
  @IsOptional()
  port?: number;
}
