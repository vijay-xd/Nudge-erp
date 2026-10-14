import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateWarehouseDto } from './dto/create-warehouse.dto.js';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto.js';

@Injectable()
export class WarehousesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string) {
    const warehouses = await this.prisma.warehouse.findMany({
      where: { organizationId },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      include: {
        stockLocations: {
          where: { isActive: true },
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            inventoryBatches: true,
            goodsReceipts: true,
            shipments: true,
          },
        },
      },
    });

    const mapped = warehouses.map((w: any) => ({
      ...w,
      totalLocations: w.stockLocations?.length || w._count?.stockLocations || 0,
      totalStockItems: w._count?.inventoryBatches || 0,
    }));

    return {
      data: mapped,
      meta: {
        total: mapped.length,
        page: 1,
        limit: mapped.length || 10,
        totalPages: 1,
      },
    };
  }

  async findOne(organizationId: string, id: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, organizationId },
      include: {
        stockLocations: true,
        inventoryBatches: {
          take: 20,
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unitOfMeasure: true,
              },
            },
          },
        },
        _count: {
          select: {
            inventoryBatches: true,
            goodsReceipts: true,
            shipments: true,
          },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID '${id}' not found`);
    }

    return warehouse;
  }

  async create(organizationId: string, dto: CreateWarehouseDto) {
    const existing = await this.prisma.warehouse.findUnique({
      where: {
        organizationId_code: {
          organizationId,
          code: dto.code.trim().toUpperCase(),
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Warehouse with code '${dto.code}' already exists`);
    }

    if (dto.isDefault) {
      await this.prisma.warehouse.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.warehouse.create({
      data: {
        organizationId,
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        address: dto.address?.trim(),
        city: dto.city?.trim(),
        state: dto.state?.trim(),
        pincode: dto.pincode?.trim(),
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async update(organizationId: string, id: string, dto: UpdateWarehouseDto) {
    const existing = await this.prisma.warehouse.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Warehouse with ID '${id}' not found`);
    }

    if (dto.code && dto.code.trim().toUpperCase() !== existing.code) {
      const codeConflict = await this.prisma.warehouse.findUnique({
        where: {
          organizationId_code: {
            organizationId,
            code: dto.code.trim().toUpperCase(),
          },
        },
      });

      if (codeConflict && codeConflict.id !== id) {
        throw new ConflictException(`Warehouse code '${dto.code}' is already assigned`);
      }
    }

    if (dto.isDefault) {
      await this.prisma.warehouse.updateMany({
        where: { organizationId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.warehouse.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.code ? { code: dto.code.trim().toUpperCase() } : {}),
        ...(dto.address !== undefined ? { address: dto.address?.trim() } : {}),
        ...(dto.city !== undefined ? { city: dto.city?.trim() } : {}),
        ...(dto.state !== undefined ? { state: dto.state?.trim() } : {}),
        ...(dto.pincode !== undefined ? { pincode: dto.pincode?.trim() } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async remove(organizationId: string, id: string) {
    const existing = await this.prisma.warehouse.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Warehouse with ID '${id}' not found`);
    }

    return this.prisma.warehouse.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
