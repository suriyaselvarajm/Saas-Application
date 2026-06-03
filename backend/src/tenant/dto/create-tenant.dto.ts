import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { SubscriptionType } from '@prisma/client';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  tenantCode: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  companyName: string;

  @IsString()
  @IsNotEmpty()
  domainName: string;

  @IsEnum(SubscriptionType)
  @IsOptional()
  subscriptionType?: SubscriptionType;

  @IsString()
  @IsOptional()
  timeZone?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @IsString()
  @IsNotEmpty()
  initialPassword: string;

  @IsString()
  @IsOptional()
  contactMobile?: string;
}
