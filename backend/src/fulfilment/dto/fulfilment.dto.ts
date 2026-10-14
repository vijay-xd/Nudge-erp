import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateShipmentStatusDto {
  @ApiProperty({ example: 'DELIVERED' })
  @IsString()
  status: string;

  @ApiPropertyOptional({ example: 'DEL123456789' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @ApiPropertyOptional({ example: 'Delhivery' })
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryShipmentDto {
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
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
