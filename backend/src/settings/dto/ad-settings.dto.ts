import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class AdSettingsDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  adServerIp: string;

  @IsString()
  @IsNotEmpty()
  domainName: string;

  @IsString()
  @IsOptional()
  ldapPath?: string;

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

  @IsString()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsOptional()
  createdAt?: string;

  @IsString()
  @IsOptional()
  updatedAt?: string;
}
