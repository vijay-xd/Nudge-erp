import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateWarehouseDto {
  @ApiPropertyOptional({ example: 'Central Distribution Center', description: 'Warehouse facility name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'WH-DEL-01', description: 'Unique warehouse facility code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: 'Plot 12, Kundli Industrial Area', description: 'Physical address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Sonipat', description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Haryana', description: 'State' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '131028', description: 'PIN code' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ example: true, description: 'Default fulfillment warehouse' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ example: true, description: 'Active facility status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
