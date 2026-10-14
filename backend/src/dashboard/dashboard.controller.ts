import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrgId } from '../auth/decorators/org-id.decorator.js';
import { DashboardService } from './dashboard.service.js';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get executive KPI statistics, fill-rate, stock alerts, and top products' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics calculated successfully' })
  async getStats(@OrgId() organizationId: string) {
    return this.dashboardService.getStats(organizationId);
  }

  @Get('trends')
  @ApiOperation({ summary: 'Get 6-month historical trends for revenue, collections, and orders' })
  @ApiResponse({ status: 200, description: 'Revenue trends aggregated successfully' })
  async getTrends(@OrgId() organizationId: string) {
    return this.dashboardService.getTrends(organizationId);
  }
}
