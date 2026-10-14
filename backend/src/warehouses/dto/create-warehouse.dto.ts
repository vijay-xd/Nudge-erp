import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWarehouseDto {
  @ApiProperty({ example: 'Central Distribution Center', description: 'Warehouse facility name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'WH-DEL-01', description: 'Unique warehouse facility code' })
  @IsString()
  @IsNotEmpty()
  code!: string;

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

  @ApiPropertyOptional({ example: true, default: false, description: 'Default fulfillment warehouse' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;
}
