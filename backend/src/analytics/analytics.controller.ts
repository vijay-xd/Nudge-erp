import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { OrgId } from '../auth/decorators/org-id.decorator.js';
import { AnalyticsService } from './analytics.service.js';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'High-level business analytics overview with real calculated metrics' })
  async getOverview(
    @OrgId() orgId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getOverview(orgId, startDate, endDate);
  }

  @Get('product-performance')
  @ApiOperation({ summary: 'Product level profitability and gross margin analysis' })
  async getProductPerformance(@OrgId() orgId: string) {
    return this.analyticsService.getProductPerformance(orgId);
  }

  @Get('reorder-recommendations')
  @ApiOperation({ summary: 'Transparent baseline inventory reorder recommendations' })
  async getReorderRecommendations(@OrgId() orgId: string) {
    return this.analyticsService.getReorderRecommendations(orgId);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export product performance analytics to CSV' })
  async exportCsv(@OrgId() orgId: string, @Res() res: Response) {
    const csv = await this.analyticsService.exportCsv(orgId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="analytics_performance.csv"');
    return res.send(csv);
  }
}
