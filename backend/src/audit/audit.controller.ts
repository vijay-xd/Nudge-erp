import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrgId } from '../auth/decorators/org-id.decorator.js';
import { AuditService } from './audit.service.js';
import { QueryAuditDto } from './dto/query-audit.dto.js';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'List organization audit activity logs with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Audit trail records retrieved successfully' })
  async findAll(
    @OrgId() organizationId: string,
    @Query() query: QueryAuditDto,
  ) {
    return this.auditService.findAll(organizationId, query);
  }
}
