import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateComputerDto {
  @IsString()
  @IsNotEmpty()
  computerName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  targetOu?: string;

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

  @IsBoolean()
  @IsOptional()
  createInAd?: boolean;

  @IsString()
  @IsOptional()
  adSettingsId?: string;
}
