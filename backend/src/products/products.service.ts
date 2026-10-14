import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { QueryProductDto } from './dto/query-product.dto.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, query: QueryProductDto) {
    const { page = 1, limit = 20, search, categoryId, brand, isActive, lowStockOnly } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      organizationId,
      ...(isActive !== undefined ? { isActive } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(brand ? { brand: { equals: brand, mode: 'insensitive' } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
              { brand: { contains: search, mode: 'insensitive' } },
              { barcode: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          category: {
            select: { id: true, name: true },
          },
          inventoryBatches: {
            select: {
              quantity: true,
              reservedQty: true,
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const formatted = products.map((product) => {
      const currentStock = product.inventoryBatches.reduce(
        (sum, batch) => sum + Number(batch.quantity),
        0,
      );
      const reservedStock = product.inventoryBatches.reduce(
        (sum, batch) => sum + Number(batch.reservedQty),
        0,
      );
      const availableStock = currentStock - reservedStock;

      const { inventoryBatches, ...rest } = product;
      return {
        ...rest,
        currentStock,
        reservedStock,
        availableStock,
        isLowStock: currentStock <= product.reorderLevel,
      };
    });

    const results = lowStockOnly ? formatted.filter((p) => p.isLowStock) : formatted;

    return {
      data: results,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(organizationId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, organizationId },
      include: {
        category: true,
        productVendors: {
          include: {
            vendor: {
              select: {
                id: true,
                legalName: true,
                tradingName: true,
              },
            },
          },
        },
        inventoryBatches: {
          include: {
            warehouse: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    const currentStock = product.inventoryBatches.reduce(
      (sum, batch) => sum + Number(batch.quantity),
      0,
    );
    const reservedStock = product.inventoryBatches.reduce(
      (sum, batch) => sum + Number(batch.reservedQty),
      0,
    );

    return {
      ...product,
      currentStock,
      reservedStock,
      availableStock: currentStock - reservedStock,
      isLowStock: currentStock <= product.reorderLevel,
    };
  }

  async create(organizationId: string, userId: string, dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: {
        organizationId_sku: {
          organizationId,
          sku: dto.sku.trim(),
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Product with SKU '${dto.sku}' already exists in your organization`);
    }

    return this.prisma.product.create({
      data: {
        organizationId,
        sku: dto.sku.trim(),
        name: dto.name.trim(),
        description: dto.description?.trim(),
        brand: dto.brand?.trim(),
        categoryId: dto.categoryId,
        unitOfMeasure: dto.unitOfMeasure?.trim() || 'PCS',
        barcode: dto.barcode?.trim(),
        hsnCode: dto.hsnCode?.trim(),
        gstRate: dto.gstRate !== undefined ? new Prisma.Decimal(dto.gstRate) : new Prisma.Decimal(18),
        purchaseCost: dto.purchaseCost !== undefined ? new Prisma.Decimal(dto.purchaseCost) : null,
        sellingPrice: dto.sellingPrice !== undefined ? new Prisma.Decimal(dto.sellingPrice) : null,
        mrp: dto.mrp !== undefined ? new Prisma.Decimal(dto.mrp) : null,
        reorderLevel: dto.reorderLevel ?? 0,
        batchTracking: dto.batchTracking ?? false,
        expiryTracking: dto.expiryTracking ?? false,
        imageUrl: dto.imageUrl?.trim(),
        createdBy: userId,
      },
      include: {
        category: true,
      },
    });
  }

  async update(organizationId: string, id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    if (dto.sku && dto.sku.trim() !== existing.sku) {
      const skuConflict = await this.prisma.product.findUnique({
        where: {
          organizationId_sku: {
            organizationId,
            sku: dto.sku.trim(),
          },
        },
      });

      if (skuConflict && skuConflict.id !== id) {
        throw new ConflictException(`SKU '${dto.sku}' is already in use by another product`);
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.sku ? { sku: dto.sku.trim() } : {}),
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() } : {}),
        ...(dto.brand !== undefined ? { brand: dto.brand?.trim() } : {}),
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.unitOfMeasure ? { unitOfMeasure: dto.unitOfMeasure.trim() } : {}),
        ...(dto.barcode !== undefined ? { barcode: dto.barcode?.trim() } : {}),
        ...(dto.hsnCode !== undefined ? { hsnCode: dto.hsnCode?.trim() } : {}),
        ...(dto.gstRate !== undefined ? { gstRate: new Prisma.Decimal(dto.gstRate) } : {}),
        ...(dto.purchaseCost !== undefined ? { purchaseCost: dto.purchaseCost !== null ? new Prisma.Decimal(dto.purchaseCost) : null } : {}),
        ...(dto.sellingPrice !== undefined ? { sellingPrice: dto.sellingPrice !== null ? new Prisma.Decimal(dto.sellingPrice) : null } : {}),
        ...(dto.mrp !== undefined ? { mrp: dto.mrp !== null ? new Prisma.Decimal(dto.mrp) : null } : {}),
        ...(dto.reorderLevel !== undefined ? { reorderLevel: dto.reorderLevel } : {}),
        ...(dto.batchTracking !== undefined ? { batchTracking: dto.batchTracking } : {}),
        ...(dto.expiryTracking !== undefined ? { expiryTracking: dto.expiryTracking } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl?.trim() } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
      include: {
        category: true,
      },
    });
  }

  async remove(organizationId: string, id: string) {
    const existing = await this.prisma.product.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Product with ID '${id}' not found`);
    }

    // Soft delete / archive product
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
