import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { OrgId } from '../auth/decorators/org-id.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/interfaces/auth-user.interface.js';
import { FinanceService } from './finance.service.js';
import {
  CreatePaymentDto,
  QueryBillDto,
  QueryInvoiceDto,
} from './dto/finance.dto.js';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('invoices')
  @ApiOperation({ summary: 'List customer sales invoices' })
  async getInvoices(@OrgId() orgId: string, @Query() query: QueryInvoiceDto) {
    return this.financeService.getInvoices(orgId, query);
  }

  @Get('invoices/:id')
  @ApiOperation({ summary: 'Get invoice details with line items and payment history' })
  async getInvoice(@OrgId() orgId: string, @Param('id') id: string) {
    return this.financeService.getInvoice(orgId, id);
  }

  @Get('bills')
  @ApiOperation({ summary: 'List vendor procurement bills' })
  async getBills(@OrgId() orgId: string, @Query() query: QueryBillDto) {
    return this.financeService.getBills(orgId, query);
  }

  @Get('payments')
  @ApiOperation({ summary: 'List payment receipts and disbursements' })
  async getPayments(
    @OrgId() orgId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.financeService.getPayments(orgId, page ? Number(page) : 1, limit ? Number(limit) : 20);
  }

  @Post('payments')
  @Roles(UserRole.ORG_ADMIN, UserRole.FINANCE)
  @ApiOperation({ summary: 'Record customer payment or vendor disbursement with allocation' })
  async recordPayment(
    @OrgId() orgId: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.financeService.recordPayment(orgId, dto, user.userId);
  }

  @Get('ar-ageing')
  @ApiOperation({ summary: 'Accounts Receivable (AR) ageing breakdown by buckets' })
  async getArAgeing(@OrgId() orgId: string) {
    return this.financeService.getArAgeing(orgId);
  }

  @Get('ap-ageing')
  @ApiOperation({ summary: 'Accounts Payable (AP) ageing breakdown by buckets' })
  async getApAgeing(@OrgId() orgId: string) {
    return this.financeService.getApAgeing(orgId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'High-level financial metrics summary' })
  async getSummary(@OrgId() orgId: string) {
    return this.financeService.getFinanceSummary(orgId);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export customer invoices to CSV' })
  async exportCsv(@OrgId() orgId: string, @Res() res: Response) {
    const csv = await this.financeService.exportCsv(orgId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices.csv"');
    return res.send(csv);
  }
}
