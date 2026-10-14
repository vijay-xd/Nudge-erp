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
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrgId } from '../auth/decorators/org-id.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { VendorsService } from './vendors.service.js';
import { CreateVendorDto } from './dto/create-vendor.dto.js';
import { UpdateVendorDto } from './dto/update-vendor.dto.js';
import { QueryVendorDto } from './dto/query-vendor.dto.js';

@ApiTags('Vendors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @ApiOperation({ summary: 'List all vendors with pagination, search, and region filters' })
  @ApiResponse({ status: 200, description: 'Vendors retrieved successfully' })
  async findAll(
    @OrgId() organizationId: string,
    @Query() query: QueryVendorDto,
  ) {
    return this.vendorsService.findAll(organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor details by ID' })
  @ApiResponse({ status: 200, description: 'Vendor details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async findOne(
    @OrgId() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.vendorsService.findOne(organizationId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new vendor profile' })
  @ApiResponse({ status: 201, description: 'Vendor created successfully' })
  async create(
    @OrgId() organizationId: string,
    @CurrentUser('userId') userId: string,
    @Body() createVendorDto: CreateVendorDto,
  ) {
    return this.vendorsService.create(organizationId, userId, createVendorDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing vendor profile' })
  @ApiResponse({ status: 200, description: 'Vendor updated successfully' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async update(
    @OrgId() organizationId: string,
    @Param('id') id: string,
    @Body() updateVendorDto: UpdateVendorDto,
  ) {
    return this.vendorsService.update(organizationId, id, updateVendorDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive/soft-delete a vendor' })
  @ApiResponse({ status: 200, description: 'Vendor archived successfully' })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async remove(
    @OrgId() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.vendorsService.remove(organizationId, id);
  }
}
