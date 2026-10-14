import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Reliance Retail Limited', description: 'Registered business legal name' })
  @IsString()
  @IsNotEmpty()
  legalName!: string;

  @ApiPropertyOptional({ example: 'Smart Bazaar - Connaught Place', description: 'Store or trading name' })
  @IsOptional()
  @IsString()
  tradingName?: string;

  @ApiPropertyOptional({ example: 'Vikas Gupta', description: 'Primary contact person' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({ example: 'procurement@relianceretail.com', description: 'Customer email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+91 98200 54321', description: 'Contact phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'B-Block, Connaught Place', description: 'Billing address' })
  @IsOptional()
  @IsString()
  billingAddress?: string;

  @ApiPropertyOptional({ example: 'Warehouse 3, Okhla Phase 1', description: 'Delivery/shipping address' })
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @ApiPropertyOptional({ example: 'New Delhi', description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Delhi', description: 'State' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '110001', description: 'PIN code' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ example: '07AABCR2418M1ZT', description: 'GSTIN' })
  @IsOptional()
  @IsString()
  gstin?: string;

  @ApiPropertyOptional({ enum: ChannelType, default: ChannelType.DIRECT, description: 'Sales channel type' })
  @IsOptional()
  @IsEnum(ChannelType)
  channelType?: ChannelType = ChannelType.DIRECT;

  @ApiPropertyOptional({ example: 'REL-DEL-001', description: 'External marketplace or ERP customer identifier' })
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional({ example: 30, default: 30, description: 'Payment terms in days' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  paymentTermDays?: number = 30;

  @ApiPropertyOptional({ example: 'Tier 1 modern retail chain customer', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
