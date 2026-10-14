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
import { PurchaseOrderStatus } from '@prisma/client';

export class CreatePurchaseOrderLineDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Ordered quantity', example: 50 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ description: 'Unit cost expected from supplier', example: 100.0 })
  @IsNumber()
  @Min(0)
  unitCost: number;

  @ApiPropertyOptional({ description: 'GST rate percentage', example: 18 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number = 18;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ description: 'Vendor ID' })
  @IsUUID()
  vendorId: string;

  @ApiPropertyOptional({ description: 'Expected delivery date', example: '2026-10-20T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  expectedDelivery?: string;

  @ApiPropertyOptional({ description: 'Purchase order notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreatePurchaseOrderLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderLineDto)
  lines: CreatePurchaseOrderLineDto[];
}

export class UpdatePurchaseOrderStatusDto {
  @ApiProperty({ enum: PurchaseOrderStatus, example: PurchaseOrderStatus.APPROVED })
  @IsEnum(PurchaseOrderStatus)
  status: PurchaseOrderStatus;

  @ApiPropertyOptional({ description: 'Reason for cancellation if cancelled' })
  @IsOptional()
  @IsString()
  cancelReason?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReceiveGoodsLineDto {
  @ApiProperty({ description: 'Purchase order line ID' })
  @IsUUID()
  purchaseOrderLineId: string;

  @ApiProperty({ description: 'Total quantity received at gate', example: 50 })
  @IsNumber()
  @Min(0)
  receivedQty: number;

  @ApiProperty({ description: 'Quantity accepted into stock after inspection', example: 48 })
  @IsNumber()
  @Min(0)
  acceptedQty: number;

  @ApiPropertyOptional({ description: 'Quantity rejected/damaged', example: 2 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rejectedQty?: number = 0;

  @ApiPropertyOptional({ description: 'Batch / Lot number', example: 'BATCH-2026-10A' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Expiry date if batch tracked', example: '2027-10-14T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Actual billed unit cost if different from PO' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;
}

export class ReceiveGoodsDto {
  @ApiProperty({ description: 'Warehouse receiving goods' })
  @IsUUID()
  warehouseId: string;

  @ApiPropertyOptional({ description: 'Delivery challan / invoice reference' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [ReceiveGoodsLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveGoodsLineDto)
  lines: ReceiveGoodsLineDto[];
}

export class QueryPurchaseOrderDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PurchaseOrderStatus })
  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  vendorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;
}
