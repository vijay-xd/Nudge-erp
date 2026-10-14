import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto.js';

export class QueryAuditDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by entity type (e.g. Product, SalesOrder, Customer)' })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: 'Filter by specific entity ID' })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: 'Filter by actor ID' })
  @IsOptional()
  @IsString()
  actorId?: string;
}
