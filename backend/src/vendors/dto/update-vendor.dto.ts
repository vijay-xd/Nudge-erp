import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEmail, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateVendorDto {
  @ApiPropertyOptional({ example: 'Nestle India Limited', description: 'Registered legal business name' })
  @IsOptional()
  @IsString()
  legalName?: string;

  @ApiPropertyOptional({ example: 'Nestle', description: 'Trade or brand name' })
  @IsOptional()
  @IsString()
  tradingName?: string;

  @ApiPropertyOptional({ example: 'Rajesh Mehra', description: 'Primary contact representative' })
  @IsOptional()
  @IsString()
  contactPerson?: string;

  @ApiPropertyOptional({ example: 'b2borders@nestle.in', description: 'Vendor email' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+91 98110 12345', description: 'Vendor phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Plot 4, DLF Cyber City', description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'Gurugram', description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'Haryana', description: 'State' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '122002', description: 'Postal PIN code' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ example: '06AAACN0142A1ZG', description: 'GSTIN identification number' })
  @IsOptional()
  @IsString()
  gstin?: string;

  @ApiPropertyOptional({ example: 'AAACN0142A', description: 'PAN card number' })
  @IsOptional()
  @IsString()
  panNumber?: string;

  @ApiPropertyOptional({ example: 30, description: 'Agreed payment terms in days' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  paymentTermDays?: number;

  @ApiPropertyOptional({ example: 5, description: 'Standard order lead time in days' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  leadTimeDays?: number;

  @ApiPropertyOptional({ example: 'HDFC Bank', description: 'Bank name' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: '50200012345678', description: 'Bank account number' })
  @IsOptional()
  @IsString()
  bankAccount?: string;

  @ApiPropertyOptional({ example: 'HDFC0000001', description: 'Bank IFSC code' })
  @IsOptional()
  @IsString()
  bankIfsc?: string;

  @ApiPropertyOptional({ example: 'Updated notes', description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: true, description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
