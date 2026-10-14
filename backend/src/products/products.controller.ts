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
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { QueryProductDto } from './dto/query-product.dto.js';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List all products with pagination, search, and stock status' })
  @ApiResponse({ status: 200, description: 'Products retrieved successfully' })
  async findAll(
    @OrgId() organizationId: string,
    @Query() query: QueryProductDto,
  ) {
    return this.productsService.findAll(organizationId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product details by ID' })
  @ApiResponse({ status: 200, description: 'Product details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async findOne(
    @OrgId() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.productsService.findOne(organizationId, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product catalog entry' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 409, description: 'Product SKU already exists' })
  async create(
    @OrgId() organizationId: string,
    @CurrentUser('userId') userId: string,
    @Body() createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(organizationId, userId, createProductDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async update(
    @OrgId() organizationId: string,
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(organizationId, id, updateProductDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive/soft-delete a product' })
  @ApiResponse({ status: 200, description: 'Product archived successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async remove(
    @OrgId() organizationId: string,
    @Param('id') id: string,
  ) {
    return this.productsService.remove(organizationId, id);
  }
}
