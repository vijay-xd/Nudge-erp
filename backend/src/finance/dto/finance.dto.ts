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
import { InvoiceStatus, PaymentMethod, PaymentType } from '@prisma/client';

export class PaymentAllocationItemDto {
  @ApiPropertyOptional({ description: 'Customer Invoice ID if customer payment' })
  @IsOptional()
  @IsUUID()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'Vendor Bill ID if vendor payment' })
  @IsOptional()
  @IsUUID()
  vendorBillId?: string;

  @ApiProperty({ description: 'Amount allocated to this invoice or bill', example: 10000 })
  @IsNumber()
  @Min(0.01)
  amount: number;
}

export class CreatePaymentDto {
  @ApiProperty({ enum: PaymentType, example: PaymentType.RECEIVED })
  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.BANK_TRANSFER })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Total payment amount (INR)', example: 10000 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiPropertyOptional({ description: 'Payment date', example: '2026-10-14T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  paymentDate?: string;

  @ApiPropertyOptional({ description: 'Bank UTR / UPI Ref / Cheque number', example: 'UTR89237482' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Payment notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [PaymentAllocationItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentAllocationItemDto)
  allocations: PaymentAllocationItemDto[];
}

export class QueryInvoiceDto {
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

  @ApiPropertyOptional({ enum: InvoiceStatus })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class QueryBillDto {
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

  @ApiPropertyOptional({ enum: InvoiceStatus })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
