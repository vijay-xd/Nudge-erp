import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { ImportStatus } from '@prisma/client';

export class ApproveImportLineDto {
  @ApiProperty({ description: 'Internal product ID to map to' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Approved ordered quantity' })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ description: 'Approved unit selling price (INR)' })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Tax rate percentage', default: 18 })
  @IsOptional()
  @IsNumber()
  taxRate?: number = 18;
}

export class ApproveImportDto {
  @ApiProperty({ description: 'Customer ID for this order' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ description: 'Sales Channel ID' })
  @IsOptional()
  @IsUUID()
  channelId?: string;

  @ApiPropertyOptional({ description: 'External order ID' })
  @IsOptional()
  @IsString()
  externalOrderId?: string;

  @ApiPropertyOptional({ description: 'Order date' })
  @IsOptional()
  @IsString()
  orderDate?: string;

  @ApiPropertyOptional({ description: 'Expected delivery date' })
  @IsOptional()
  @IsString()
  expectedDelivery?: string;

  @ApiPropertyOptional({ description: 'Warehouse ID to immediately reserve stock from' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiProperty({ type: [ApproveImportLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApproveImportLineDto)
  lines: ApproveImportLineDto[];
}

export class QueryImportDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ImportStatus })
  @IsOptional()
  @IsEnum(ImportStatus)
  status?: ImportStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
