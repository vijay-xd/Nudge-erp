import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'PRD-MAGGI-70G', description: 'Unique SKU for the product' })
  @IsOptional()
  @IsString()
  sku?: string;

  @ApiPropertyOptional({ example: 'Maggi 2-Minute Masala Noodles 70g', description: 'Product name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description', description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Nestle', description: 'Product brand' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'PCS', description: 'Unit of measure' })
  @IsOptional()
  @IsString()
  unitOfMeasure?: string;

  @ApiPropertyOptional({ example: '8901058852391', description: 'Barcode / EAN' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: '19023010', description: 'HSN code for GST' })
  @IsOptional()
  @IsString()
  hsnCode?: string;

  @ApiPropertyOptional({ example: 12.0, description: 'GST rate percentage' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  gstRate?: number;

  @ApiPropertyOptional({ example: 11.5, description: 'Purchase cost in INR' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchaseCost?: number;

  @ApiPropertyOptional({ example: 13.5, description: 'Selling price in INR' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sellingPrice?: number;

  @ApiPropertyOptional({ example: 14.0, description: 'Maximum Retail Price in INR' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  mrp?: number;

  @ApiPropertyOptional({ example: 100, description: 'Reorder alert threshold level' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reorderLevel?: number;

  @ApiPropertyOptional({ example: false, description: 'Enable batch tracking' })
  @IsOptional()
  @IsBoolean()
  batchTracking?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Enable expiry tracking' })
  @IsOptional()
  @IsBoolean()
  expiryTracking?: boolean;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/products/maggi70g.png', description: 'Image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: true, description: 'Product active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
