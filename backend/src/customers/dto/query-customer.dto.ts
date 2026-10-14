import { ApiPropertyOptional } from '@nestjs/swagger';
import { ChannelType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';

export class QueryCustomerDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ChannelType, description: 'Filter by sales channel type' })
  @IsOptional()
  @IsEnum(ChannelType)
  channelType?: ChannelType;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by state' })
  @IsOptional()
  @IsString()
  state?: string;
}
