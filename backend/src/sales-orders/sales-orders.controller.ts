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
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { OrgId } from '../auth/decorators/org-id.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/interfaces/auth-user.interface.js';
import { SalesOrdersService } from './sales-orders.service.js';
import {
  CreateSalesOrderDto,
  FulfillOrderDto,
  QuerySalesOrderDto,
  UpdateSalesOrderStatusDto,
} from './dto/sales-order.dto.js';

@ApiTags('Sales Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sales-orders')
export class SalesOrdersController {
  constructor(private readonly salesOrdersService: SalesOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'List sales orders with filters and pagination' })
  async findAll(@OrgId() orgId: string, @Query() query: QuerySalesOrderDto) {
    return this.salesOrdersService.findAll(orgId, query);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export sales orders to CSV' })
  async exportCsv(@OrgId() orgId: string, @Res() res: Response) {
    const csv = await this.salesOrdersService.exportCsv(orgId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_orders.csv"');
    return res.send(csv);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales order details with lines, shipments, and invoices' })
  async findOne(@OrgId() orgId: string, @Param('id') id: string) {
    return this.salesOrdersService.findOne(orgId, id);
  }

  @Post()
  @Roles(UserRole.ORG_ADMIN, UserRole.SALES)
  @ApiOperation({ summary: 'Create a new sales order manually' })
  async create(
    @OrgId() orgId: string,
    @Body() dto: CreateSalesOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salesOrdersService.create(orgId, dto, user.userId);
  }

  @Patch(':id/status')
  @Roles(UserRole.ORG_ADMIN, UserRole.SALES)
  @ApiOperation({ summary: 'Transition order status (APPROVE, CANCEL, etc.)' })
  async updateStatus(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSalesOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salesOrdersService.updateStatus(orgId, id, dto, user.userId);
  }

  @Post(':id/reserve')
  @Roles(UserRole.ORG_ADMIN, UserRole.SALES, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Reserve available stock for order lines in warehouse' })
  async reserveStock(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body('warehouseId') warehouseId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salesOrdersService.reserveStock(orgId, id, warehouseId, user.userId);
  }

  @Post(':id/fulfill')
  @Roles(UserRole.ORG_ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Fulfill/Dispatch shipment against sales order' })
  async fulfill(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: FulfillOrderDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salesOrdersService.fulfillOrder(orgId, id, dto, user.userId);
  }

  @Post(':id/invoice')
  @Roles(UserRole.ORG_ADMIN, UserRole.FINANCE, UserRole.SALES)
  @ApiOperation({ summary: 'Generate customer invoice from sales order' })
  async generateInvoice(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.salesOrdersService.generateInvoice(orgId, id, user.userId);
  }
}
