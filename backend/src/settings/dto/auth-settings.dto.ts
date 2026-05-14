import { IsArray, IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class AuthSettingsDto {
  @IsBoolean()
  @IsOptional()
  ssoEnabled?: boolean;

  @IsBoolean()
  @IsOptional()
  enforceM365Login?: boolean;

  @IsInt()
  @IsOptional()
  sessionTimeout?: number;

  @IsBoolean()
  @IsOptional()
  mfaEnforced?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allowedDomains?: string[];

  // Password Policy
  @IsInt()
  @IsOptional()
  minCharacters?: number;

  @IsBoolean()
  @IsOptional()
  requireUppercase?: boolean;

  @IsBoolean()
  @IsOptional()
  requireLowercase?: boolean;

  @IsBoolean()
  @IsOptional()
  requireNumbers?: boolean;

  @IsBoolean()
  @IsOptional()
  requireSymbols?: boolean;

  @IsInt()
  @IsOptional()
  expiryDays?: number;
}
