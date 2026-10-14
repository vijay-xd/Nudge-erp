import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { PurchaseOrdersService } from './purchase-orders.service.js';
import {
  CreatePurchaseOrderDto,
  QueryPurchaseOrderDto,
  ReceiveGoodsDto,
  UpdatePurchaseOrderStatusDto,
} from './dto/purchase-order.dto.js';

@ApiTags('Purchase Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly poService: PurchaseOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List purchase orders with pagination and filters' })
  async findAll(@OrgId() orgId: string, @Query() query: QueryPurchaseOrderDto) {
    return this.poService.findAll(orgId, query);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export purchase orders to CSV' })
  async exportCsv(@OrgId() orgId: string, @Res() res: Response) {
    const csv = await this.poService.exportCsv(orgId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="purchase_orders.csv"');
    return res.send(csv);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase order details with receipts and supplier bills' })
  async findOne(@OrgId() orgId: string, @Param('id') id: string) {
    return this.poService.findOne(orgId, id);
  }

  @Post()
  @Roles(UserRole.ORG_ADMIN, UserRole.PROCUREMENT)
  @ApiOperation({ summary: 'Create new supplier purchase order' })
  async create(
    @OrgId() orgId: string,
    @Body() dto: CreatePurchaseOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.poService.create(orgId, dto, user.userId);
  }

  @Patch(':id/status')
  @Roles(UserRole.ORG_ADMIN, UserRole.PROCUREMENT)
  @ApiOperation({ summary: 'Update PO status (APPROVE, SENT, CANCELLED)' })
  async updateStatus(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.poService.updateStatus(orgId, id, dto, user.userId);
  }

  @Post(':id/receipts')
  @Roles(UserRole.ORG_ADMIN, UserRole.WAREHOUSE, UserRole.PROCUREMENT)
  @ApiOperation({ summary: 'Record goods receipt against purchase order (GRN)' })
  async recordReceipt(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: ReceiveGoodsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.poService.recordGoodsReceipt(orgId, id, dto, user.userId);
  }

  @Post(':id/bill')
  @Roles(UserRole.ORG_ADMIN, UserRole.FINANCE, UserRole.PROCUREMENT)
  @ApiOperation({ summary: 'Generate supplier bill from purchase order' })
  async generateBill(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.poService.generateVendorBill(orgId, id, user.userId);
  }
}
