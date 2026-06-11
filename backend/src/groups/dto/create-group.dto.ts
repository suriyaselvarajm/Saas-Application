import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  groupName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  groupType?: string; // "Security" or "Distribution"

  @IsString()
  @IsOptional()
  groupScope?: string; // "Global", "Domain Local", "Universal"

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  targetOu?: string;

  @IsBoolean()
  @IsOptional()
  createInAd?: boolean;

  @IsString()
  @IsOptional()
  adSettingsId?: string;

  @IsBoolean()
  @IsOptional()
  mailEnabled?: boolean;

  @IsString()
  @IsOptional()
  mail?: string;

  @IsBoolean()
  @IsOptional()
  isDynamic?: boolean;

  @IsString()
  @IsOptional()
  dynamicQuery?: string;
}
