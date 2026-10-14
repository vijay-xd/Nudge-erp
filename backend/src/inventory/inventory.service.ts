import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryTransactionType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  AdjustStockDto,
  QueryInventoryDto,
  TransferStockDto,
} from './dto/inventory.dto.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getStockSummary(
    organizationId: string,
    warehouseId?: string,
    search?: string,
  ) {
    const whereProduct: Prisma.ProductWhereInput = {
      organizationId,
      isActive: true,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
              { brand: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const products = await this.prisma.product.findMany({
      where: whereProduct,
      include: {
        category: { select: { id: true, name: true } },
        inventoryBatches: {
          where: warehouseId ? { warehouseId } : undefined,
          include: {
            warehouse: { select: { id: true, name: true, code: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return products.map((p) => {
      const onHand = p.inventoryBatches.reduce(
        (sum, b) => sum + Number(b.quantity),
        0,
      );
      const reserved = p.inventoryBatches.reduce(
        (sum, b) => sum + Number(b.reservedQty),
        0,
      );
      const available = Math.max(0, onHand - reserved);
      const unitCost = Number(p.purchaseCost || 0);
      const totalValue = onHand * unitCost;

      let status = 'IN_STOCK';
      if (onHand <= 0) {
        status = 'OUT_OF_STOCK';
      } else if (available <= p.reorderLevel) {
        status = 'LOW_STOCK';
      }

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        category: p.category?.name || 'General',
        unitOfMeasure: p.unitOfMeasure,
        unitCost,
        sellingPrice: Number(p.sellingPrice || 0),
        onHand,
        reserved,
        available,
        reorderLevel: p.reorderLevel,
        totalValue: Math.round(totalValue * 100) / 100,
        status,
        batchesCount: p.inventoryBatches.length,
      };
    });
  }

  async getBatches(organizationId: string, warehouseId?: string, productId?: string) {
    const where: Prisma.InventoryBatchWhereInput = {
      product: { organizationId },
      ...(warehouseId ? { warehouseId } : {}),
      ...(productId ? { productId } : {}),
      quantity: { gt: 0 },
    };

    const batches = await this.prisma.inventoryBatch.findMany({
      where,
      include: {
        product: { select: { id: true, sku: true, name: true, unitOfMeasure: true } },
        warehouse: { select: { id: true, name: true, code: true } },
      },
      orderBy: [{ expiryDate: 'asc' }, { createdAt: 'asc' }],
    });

    const now = new Date();
    return batches.map((b) => {
      let daysToExpiry: number | null = null;
      let expiryStatus = 'GOOD';

      if (b.expiryDate) {
        const diffMs = b.expiryDate.getTime() - now.getTime();
        daysToExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (daysToExpiry <= 0) {
          expiryStatus = 'EXPIRED';
        } else if (daysToExpiry <= 60) {
          expiryStatus = 'NEAR_EXPIRY';
        }
      }

      return {
        id: b.id,
        batchNumber: b.batchNumber || 'DEFAULT',
        product: b.product,
        warehouse: b.warehouse,
        quantity: Number(b.quantity),
        reservedQty: Number(b.reservedQty),
        availableQty: Math.max(0, Number(b.quantity) - Number(b.reservedQty)),
        unitCost: Number(b.unitCost || 0),
        expiryDate: b.expiryDate,
        daysToExpiry,
        expiryStatus,
      };
    });
  }

  async getLedger(organizationId: string, query: QueryInventoryDto) {
    const { page = 1, limit = 20, warehouseId, productId, transactionType } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.InventoryTransactionWhereInput = {
      organizationId,
      ...(warehouseId ? { warehouseId } : {}),
      ...(productId ? { productId } : {}),
      ...(transactionType ? { transactionType } : {}),
    };

    const [transactions, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, sku: true, name: true, unitOfMeasure: true } },
          warehouse: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.inventoryTransaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adjustStock(organizationId: string, dto: AdjustStockDto, userId?: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, organizationId },
    });
    if (!product) {
      throw new NotFoundException(`Product #${dto.productId} not found`);
    }

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, organizationId },
    });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse #${dto.warehouseId} not found`);
    }

    const isPositive =
      dto.adjustmentType === InventoryTransactionType.ADJUSTMENT_POSITIVE ||
      dto.adjustmentType === InventoryTransactionType.OPENING_BALANCE;

    return await this.prisma.$transaction(async (tx) => {
      // Find or create batch
      let batch = await tx.inventoryBatch.findFirst({
        where: {
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          batchNumber: dto.batchNumber || null,
        },
      });

      if (!isPositive) {
        if (!batch || Number(batch.quantity) < dto.quantity) {
          throw new BadRequestException(
            `Cannot decrease stock by ${dto.quantity}. Current batch on-hand is ${batch ? batch.quantity : 0}`,
          );
        }
      }

      const qtyDelta = isPositive ? dto.quantity : -dto.quantity;

      if (batch) {
        await tx.inventoryBatch.update({
          where: { id: batch.id },
          data: {
            quantity: { increment: new Prisma.Decimal(qtyDelta) },
          },
        });
      } else {
        batch = await tx.inventoryBatch.create({
          data: {
            productId: dto.productId,
            warehouseId: dto.warehouseId,
            batchNumber: dto.batchNumber,
            expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
            quantity: new Prisma.Decimal(dto.quantity),
            unitCost: new Prisma.Decimal(dto.unitCost || Number(product.purchaseCost || 0)),
          },
        });
      }

      const txRecord = await tx.inventoryTransaction.create({
        data: {
          organizationId,
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          transactionType: dto.adjustmentType,
          quantity: new Prisma.Decimal(qtyDelta),
          unitCost: new Prisma.Decimal(dto.unitCost || Number(product.purchaseCost || 0)),
          batchNumber: dto.batchNumber,
          notes: dto.reason,
          createdBy: userId,
        },
      });

      await this.auditService.log({
        organizationId,
        actorId: userId,
        action: `STOCK_${dto.adjustmentType}`,
        entityType: 'InventoryTransaction',
        entityId: txRecord.id,
        changes: { productId: dto.productId, qtyDelta, reason: dto.reason },
      });

      return txRecord;
    });
  }

  async transferStock(organizationId: string, dto: TransferStockDto, userId?: string) {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException('Source and destination warehouse must be different');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Find source batch
      const sourceBatch = await tx.inventoryBatch.findFirst({
        where: {
          productId: dto.productId,
          warehouseId: dto.fromWarehouseId,
          ...(dto.batchNumber ? { batchNumber: dto.batchNumber } : {}),
          quantity: { gte: new Prisma.Decimal(dto.quantity) },
        },
      });

      if (!sourceBatch) {
        throw new BadRequestException(
          `Insufficient stock available in source warehouse to transfer ${dto.quantity} units`,
        );
      }

      // Deduct from source
      await tx.inventoryBatch.update({
        where: { id: sourceBatch.id },
        data: {
          quantity: { decrement: new Prisma.Decimal(dto.quantity) },
        },
      });

      // Transfer Out transaction
      await tx.inventoryTransaction.create({
        data: {
          organizationId,
          productId: dto.productId,
          warehouseId: dto.fromWarehouseId,
          transactionType: InventoryTransactionType.TRANSFER_OUT,
          quantity: new Prisma.Decimal(-dto.quantity),
          unitCost: sourceBatch.unitCost,
          batchNumber: sourceBatch.batchNumber,
          notes: `Transfer to warehouse ${dto.toWarehouseId}. ${dto.notes || ''}`,
          createdBy: userId,
        },
      });

      // Add to destination
      let destBatch = await tx.inventoryBatch.findFirst({
        where: {
          productId: dto.productId,
          warehouseId: dto.toWarehouseId,
          batchNumber: sourceBatch.batchNumber,
        },
      });

      if (destBatch) {
        await tx.inventoryBatch.update({
          where: { id: destBatch.id },
          data: {
            quantity: { increment: new Prisma.Decimal(dto.quantity) },
          },
        });
      } else {
        destBatch = await tx.inventoryBatch.create({
          data: {
            productId: dto.productId,
            warehouseId: dto.toWarehouseId,
            batchNumber: sourceBatch.batchNumber,
            expiryDate: sourceBatch.expiryDate,
            quantity: new Prisma.Decimal(dto.quantity),
            unitCost: sourceBatch.unitCost,
          },
        });
      }

      // Transfer In transaction
      await tx.inventoryTransaction.create({
        data: {
          organizationId,
          productId: dto.productId,
          warehouseId: dto.toWarehouseId,
          transactionType: InventoryTransactionType.TRANSFER_IN,
          quantity: new Prisma.Decimal(dto.quantity),
          unitCost: sourceBatch.unitCost,
          batchNumber: sourceBatch.batchNumber,
          notes: `Transfer from warehouse ${dto.fromWarehouseId}. ${dto.notes || ''}`,
          createdBy: userId,
        },
      });

      await this.auditService.log({
        organizationId,
        actorId: userId,
        action: 'STOCK_TRANSFERRED',
        entityType: 'InventoryBatch',
        entityId: destBatch.id,
        changes: {
          productId: dto.productId,
          quantity: dto.quantity,
          from: dto.fromWarehouseId,
          to: dto.toWarehouseId,
        },
      });

      return { success: true, transferredQty: dto.quantity };
    });
  }

  async exportCsv(organizationId: string) {
    const summary = await this.getStockSummary(organizationId);

    const headers = [
      'SKU',
      'Name',
      'Brand',
      'Category',
      'Unit',
      'On Hand',
      'Reserved',
      'Available',
      'Reorder Level',
      'Unit Cost (INR)',
      'Total Value (INR)',
      'Status',
    ];

    const rows = summary.map((s) => [
      `"${s.sku}"`,
      `"${s.name}"`,
      `"${s.brand || ''}"`,
      `"${s.category}"`,
      `"${s.unitOfMeasure}"`,
      s.onHand.toString(),
      s.reserved.toString(),
      s.available.toString(),
      s.reorderLevel.toString(),
      s.unitCost.toString(),
      s.totalValue.toString(),
      `"${s.status}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
