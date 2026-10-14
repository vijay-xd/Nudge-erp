import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { InventoryTransactionType } from '@prisma/client';

export class AdjustStockDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Warehouse ID' })
  @IsUUID()
  warehouseId: string;

  @ApiProperty({
    enum: [
      InventoryTransactionType.ADJUSTMENT_POSITIVE,
      InventoryTransactionType.ADJUSTMENT_NEGATIVE,
      InventoryTransactionType.DAMAGE,
      InventoryTransactionType.EXPIRY_WRITE_OFF,
    ],
    example: InventoryTransactionType.ADJUSTMENT_POSITIVE,
  })
  @IsEnum(InventoryTransactionType)
  adjustmentType: InventoryTransactionType;

  @ApiProperty({ description: 'Quantity to adjust (positive number)', example: 10 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional({ description: 'Batch number' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Expiry date if new batch' })
  @IsOptional()
  @IsString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Unit cost' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiProperty({ description: 'Reason for adjustment', example: 'Physical stock count discrepancy' })
  @IsString()
  reason: string;
}

export class TransferStockDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Origin Warehouse ID' })
  @IsUUID()
  fromWarehouseId: string;

  @ApiProperty({ description: 'Destination Warehouse ID' })
  @IsUUID()
  toWarehouseId: string;

  @ApiProperty({ description: 'Quantity to transfer', example: 25 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional({ description: 'Specific batch number to transfer' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Transfer notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryInventoryDto {
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
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: InventoryTransactionType })
  @IsOptional()
  @IsEnum(InventoryTransactionType)
  transactionType?: InventoryTransactionType;
}
