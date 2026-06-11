import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class ModifyGroupDto {
  @IsString()
  @IsNotEmpty()
  groupName: string;

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
  notes?: string;

  @IsString()
  @IsOptional()
  targetOu?: string;

  @IsString()
  @IsOptional()
  mail?: string;

  @IsBoolean()
  @IsOptional()
  mailEnabled?: boolean;

  @IsString()
  @IsOptional()
  groupType?: string;

  @IsString()
  @IsOptional()
  groupScope?: string;

  @IsBoolean()
  @IsOptional()
  hideFromAddressLists?: boolean;

  @IsBoolean()
  @IsOptional()
  isDynamic?: boolean;

  @IsString()
  @IsOptional()
  dynamicQuery?: string;
}
