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
import { CustomersService } from './customers.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';
import { QueryCustomerDto } from './dto/query-customer.dto.js';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'List all customers with pagination, channel type filter, and search' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  async findAll(
    @OrgId() organizationId: string,
    @Query() query: QueryCustomerDto,
  ) {
    return this.customersService.findAll(organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer details by ID' })
  @ApiResponse({ status: 200, description: 'Customer details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(
    @OrgId() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.customersService.findOne(organizationId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new customer profile' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 409, description: 'Customer with external ID already exists' })
  async create(
    @OrgId() organizationId: string,
    @CurrentUser('userId') userId: string,
    @Body() createCustomerDto: CreateCustomerDto,
  ) {
    return this.customersService.create(organizationId, userId, createCustomerDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing customer profile' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async update(
    @OrgId() organizationId: string,
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(organizationId, id, updateCustomerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive/soft-delete a customer' })
  @ApiResponse({ status: 200, description: 'Customer archived successfully' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async remove(
    @OrgId() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.customersService.remove(organizationId, id);
  }
}
