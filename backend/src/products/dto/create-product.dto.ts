import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'PRD-MAGGI-70G', description: 'Unique SKU for the product' })
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @ApiProperty({ example: 'Maggi 2-Minute Masala Noodles 70g', description: 'Product name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'Classic 2-minute instant noodles pack', description: 'Description' })
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

  @ApiPropertyOptional({ example: 'PCS', default: 'PCS', description: 'Unit of measure (e.g. PCS, BOX, KG)' })
  @IsOptional()
  @IsString()
  unitOfMeasure?: string = 'PCS';

  @ApiPropertyOptional({ example: '8901058852391', description: 'Barcode / EAN' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: '19023010', description: 'HSN code for GST' })
  @IsOptional()
  @IsString()
  hsnCode?: string;

  @ApiPropertyOptional({ example: 12.0, default: 18.0, description: 'GST rate percentage' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  gstRate?: number = 18;

  @ApiPropertyOptional({ example: 11.5, description: 'Purchase cost in INR' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  purchaseCost?: number;

  @ApiPropertyOptional({ example: 13.5, description: 'B2B Wholesale selling price in INR' })
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

  @ApiPropertyOptional({ example: 100, default: 0, description: 'Reorder alert threshold level' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reorderLevel?: number = 0;

  @ApiPropertyOptional({ example: false, default: false, description: 'Enable batch tracking' })
  @IsOptional()
  @IsBoolean()
  batchTracking?: boolean = false;

  @ApiPropertyOptional({ example: false, default: false, description: 'Enable expiry tracking' })
  @IsOptional()
  @IsBoolean()
  expiryTracking?: boolean = false;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/products/maggi70g.png', description: 'Image URL' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
