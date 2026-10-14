import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { OrgId } from '../auth/decorators/org-id.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/interfaces/auth-user.interface.js';
import { FulfilmentService } from './fulfilment.service.js';
import { QueryShipmentDto, UpdateShipmentStatusDto } from './dto/fulfilment.dto.js';

@ApiTags('Fulfilment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fulfilment')
export class FulfilmentController {
  constructor(private readonly fulfilmentService: FulfilmentService) {}

  @Get('ready-orders')
  @Roles(UserRole.ORG_ADMIN, UserRole.WAREHOUSE, UserRole.SALES)
  @ApiOperation({ summary: 'Get sales orders approved/allocated and ready for dispatch' })
  async getReadyOrders(@OrgId() orgId: string) {
    return this.fulfilmentService.getReadyOrders(orgId);
  }

  @Get('shipments')
  @ApiOperation({ summary: 'List all dispatch shipments with carrier & tracking' })
  async getShipments(@OrgId() orgId: string, @Query() query: QueryShipmentDto) {
    return this.fulfilmentService.getShipments(orgId, query);
  }

  @Get('shipments/:id')
  @ApiOperation({ summary: 'Get shipment details by ID' })
  async getShipment(@OrgId() orgId: string, @Param('id') id: string) {
    return this.fulfilmentService.getShipment(orgId, id);
  }

  @Patch('shipments/:id/status')
  @Roles(UserRole.ORG_ADMIN, UserRole.WAREHOUSE)
  @ApiOperation({ summary: 'Update shipment status (DELIVERED, RETURNED, etc.)' })
  async updateShipmentStatus(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateShipmentStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.fulfilmentService.updateShipmentStatus(orgId, id, dto, user.userId);
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get fulfilment fill rate metrics' })
  async getFillRateMetrics(@OrgId() orgId: string) {
    return this.fulfilmentService.getFillRateMetrics(orgId);
  }
}
