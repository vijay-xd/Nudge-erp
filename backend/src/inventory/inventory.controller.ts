import {
  Body,
  Controller,
  Get,
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
import { InventoryService } from './inventory.service.js';
import {
  AdjustStockDto,
  QueryInventoryDto,
  TransferStockDto,
} from './dto/inventory.dto.js';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('stock-summary')
  @ApiOperation({ summary: 'Current on-hand, reserved, and available stock per product' })
  async getStockSummary(
    @OrgId() orgId: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.getStockSummary(orgId, warehouseId, search);
  }

  @Get('batches')
  @ApiOperation({ summary: 'List inventory batches with FEFO sorting and expiry tracking' })
  async getBatches(
    @OrgId() orgId: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('productId') productId?: string,
  ) {
    return this.inventoryService.getBatches(orgId, warehouseId, productId);
  }

  @Get('ledger')
  @ApiOperation({ summary: 'Append-only inventory transaction ledger history' })
  async getLedger(@OrgId() orgId: string, @Query() query: QueryInventoryDto) {
    return this.inventoryService.getLedger(orgId, query);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export inventory stock summary to CSV' })
  async exportCsv(@OrgId() orgId: string, @Res() res: Response) {
    const csv = await this.inventoryService.exportCsv(orgId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventory_stock.csv"');
    return res.send(csv);
  }

  @Post('adjust')
  @Roles(UserRole.ORG_ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Record manual stock adjustment (damage, count reconciliation)' })
  async adjustStock(
    @OrgId() orgId: string,
    @Body() dto: AdjustStockDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventoryService.adjustStock(orgId, dto, user.userId);
  }

  @Post('transfer')
  @Roles(UserRole.ORG_ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Transfer stock between warehouses' })
  async transferStock(
    @OrgId() orgId: string,
    @Body() dto: TransferStockDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.inventoryService.transferStock(orgId, dto, user.userId);
  }
}
