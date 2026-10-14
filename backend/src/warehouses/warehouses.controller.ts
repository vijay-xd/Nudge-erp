import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrgId } from '../auth/decorators/org-id.decorator.js';
import { WarehousesService } from './warehouses.service.js';
import { CreateWarehouseDto } from './dto/create-warehouse.dto.js';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto.js';

@ApiTags('Warehouses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('warehouses')
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Get()
  @ApiOperation({ summary: 'List all warehouses for the organization' })
  @ApiResponse({ status: 200, description: 'Warehouses retrieved successfully' })
  async findAll(@OrgId() organizationId: string) {
    return this.warehousesService.findAll(organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get warehouse details by ID' })
  @ApiResponse({ status: 200, description: 'Warehouse details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  async findOne(
    @OrgId() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.warehousesService.findOne(organizationId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new warehouse facility' })
  @ApiResponse({ status: 201, description: 'Warehouse created successfully' })
  @ApiResponse({ status: 409, description: 'Warehouse code already exists' })
  async create(
    @OrgId() organizationId: string,
    @Body() createWarehouseDto: CreateWarehouseDto,
  ) {
    return this.warehousesService.create(organizationId, createWarehouseDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing warehouse facility' })
  @ApiResponse({ status: 200, description: 'Warehouse updated successfully' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  async update(
    @OrgId() organizationId: string,
    @Param('id') id: string,
    @Body() updateWarehouseDto: UpdateWarehouseDto,
  ) {
    return this.warehousesService.update(organizationId, id, updateWarehouseDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive/soft-delete a warehouse' })
  @ApiResponse({ status: 200, description: 'Warehouse archived successfully' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  async remove(
    @OrgId() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.warehousesService.remove(organizationId, id);
  }
}
