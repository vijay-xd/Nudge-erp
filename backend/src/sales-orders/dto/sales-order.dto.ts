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
import { OrderStatus } from '@prisma/client';

export class CreateSalesOrderLineDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Ordered quantity', example: 10 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty({ description: 'Unit selling price (excl. tax)', example: 150.0 })
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiPropertyOptional({ description: 'Discount amount on line', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number = 0;

  @ApiPropertyOptional({ description: 'GST rate percentage', example: 18 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number = 18;
}

export class CreateSalesOrderDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ description: 'Sales Channel ID' })
  @IsOptional()
  @IsUUID()
  channelId?: string;

  @ApiPropertyOptional({ description: 'External order identifier (e.g. from Blinkit / Zepto / PO)' })
  @IsOptional()
  @IsString()
  externalOrderId?: string;

  @ApiPropertyOptional({ description: 'Order date', example: '2026-10-14T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  orderDate?: string;

  @ApiPropertyOptional({ description: 'Expected delivery date', example: '2026-10-16T00:00:00.000Z' })
  @IsOptional()
  @IsString()
  expectedDelivery?: string;

  @ApiPropertyOptional({ description: 'Order notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [CreateSalesOrderLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderLineDto)
  lines: CreateSalesOrderLineDto[];
}

export class UpdateSalesOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.APPROVED })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({ description: 'Cancellation reason if status is CANCELLED' })
  @IsOptional()
  @IsString()
  cancelReason?: string;

  @ApiPropertyOptional({ description: 'Review/action notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class FulfillItemDto {
  @ApiProperty({ description: 'Sales order line ID' })
  @IsUUID()
  salesOrderLineId: string;

  @ApiProperty({ description: 'Quantity dispatched in this shipment', example: 5 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional({ description: 'Specific batch number if tracking batches' })
  @IsOptional()
  @IsString()
  batchNumber?: string;
}

export class FulfillOrderDto {
  @ApiProperty({ description: 'Warehouse ID dispatched from' })
  @IsUUID()
  warehouseId: string;

  @ApiPropertyOptional({ description: 'Logistics / Carrier name', example: 'Delhivery' })
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiPropertyOptional({ description: 'AWB / Tracking number', example: 'DEL123456789' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ description: 'Shipment notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ type: [FulfillItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FulfillItemDto)
  items: FulfillItemDto[];
}

export class QuerySalesOrderDto {
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

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  channelId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;
}
