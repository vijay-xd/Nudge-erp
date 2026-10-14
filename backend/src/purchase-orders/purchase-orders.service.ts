import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryTransactionType, Prisma, PurchaseOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreatePurchaseOrderDto,
  QueryPurchaseOrderDto,
  ReceiveGoodsDto,
  UpdatePurchaseOrderStatusDto,
} from './dto/purchase-order.dto.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, query: QueryPurchaseOrderDto) {
    const { page = 1, limit = 20, search, status, vendorId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PurchaseOrderWhereInput = {
      organizationId,
      ...(status ? { status } : {}),
      ...(vendorId ? { vendorId } : {}),
      ...(startDate || endDate
        ? {
            orderDate: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [
              { poNumber: { contains: search, mode: 'insensitive' } },
              { vendor: { legalName: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { orderDate: 'desc' },
        include: {
          vendor: {
            select: { id: true, legalName: true, tradingName: true, gstin: true },
          },
          _count: {
            select: { lines: true, goodsReceipts: true, vendorBills: true },
          },
        },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(organizationId: string, id: string) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, organizationId },
      include: {
        vendor: true,
        lines: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unitOfMeasure: true,
                hsnCode: true,
                purchaseCost: true,
              },
            },
          },
        },
        goodsReceipts: {
          include: {
            lines: true,
            warehouse: { select: { id: true, name: true, code: true } },
          },
        },
        vendorBills: {
          include: {
            paymentAllocations: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Purchase Order #${id} not found`);
    }

    return order;
  }

  async create(organizationId: string, dto: CreatePurchaseOrderDto, userId?: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id: dto.vendorId, organizationId, isActive: true },
    });
    if (!vendor) {
      throw new NotFoundException(`Vendor #${dto.vendorId} not found or inactive`);
    }

    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = await this.prisma.purchaseOrder.count({ where: { organizationId } });
    const poNumber = `PO-${datePrefix}-${String(count + 1).padStart(4, '0')}`;

    let subtotal = 0;
    let taxAmount = 0;

    const linesData = dto.lines.map((line) => {
      const lineSubtotal = Number(line.unitCost) * Number(line.quantity);
      const lineTax = lineSubtotal * (Number(line.taxRate || 18) / 100);
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      taxAmount += lineTax;

      return {
        productId: line.productId,
        quantity: new Prisma.Decimal(line.quantity),
        unitCost: new Prisma.Decimal(line.unitCost),
        taxRate: new Prisma.Decimal(line.taxRate || 18),
        taxAmount: new Prisma.Decimal(lineTax.toFixed(2)),
        lineTotal: new Prisma.Decimal(lineTotal.toFixed(2)),
      };
    });

    const totalAmount = subtotal + taxAmount;

    const po = await this.prisma.purchaseOrder.create({
      data: {
        organizationId,
        poNumber,
        vendorId: dto.vendorId,
        orderDate: new Date(),
        expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : null,
        status: PurchaseOrderStatus.DRAFT,
        subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
        taxAmount: new Prisma.Decimal(taxAmount.toFixed(2)),
        totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)),
        notes: dto.notes,
        createdBy: userId,
        lines: {
          create: linesData,
        },
      },
      include: {
        vendor: true,
        lines: { include: { product: true } },
      },
    });

    await this.auditService.log({
      organizationId,
      actorId: userId,
      action: 'PURCHASE_ORDER_CREATED',
      entityType: 'PurchaseOrder',
      entityId: po.id,
      changes: { poNumber, totalAmount, linesCount: dto.lines.length },
    });

    return po;
  }

  async updateStatus(
    organizationId: string,
    id: string,
    dto: UpdatePurchaseOrderStatusDto,
    userId?: string,
  ) {
    const po = await this.findOne(organizationId, id);

    if (po.status === PurchaseOrderStatus.RECEIVED && dto.status !== PurchaseOrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot modify status of fully received purchase order');
    }

    const updateData: Prisma.PurchaseOrderUpdateInput = {
      status: dto.status,
    };

    if (dto.status === PurchaseOrderStatus.APPROVED) {
      updateData.approvedBy = userId;
      updateData.approvedAt = new Date();
    }
    if (dto.status === PurchaseOrderStatus.SENT) {
      updateData.sentAt = new Date();
    }
    if (dto.status === PurchaseOrderStatus.CANCELLED) {
      updateData.cancelledAt = new Date();
      updateData.cancelReason = dto.cancelReason || 'Cancelled by user';
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: { vendor: true, lines: true },
    });

    await this.auditService.log({
      organizationId,
      actorId: userId,
      action: `PURCHASE_ORDER_STATUS_${dto.status}`,
      entityType: 'PurchaseOrder',
      entityId: id,
      changes: { previous: po.status, current: dto.status },
    });

    return updated;
  }

  async recordGoodsReceipt(organizationId: string, id: string, dto: ReceiveGoodsDto, userId?: string) {
    const po = await this.findOne(organizationId, id);

    if (
      po.status !== PurchaseOrderStatus.APPROVED &&
      po.status !== PurchaseOrderStatus.SENT &&
      po.status !== PurchaseOrderStatus.PARTIALLY_RECEIVED
    ) {
      throw new BadRequestException(
        `PO must be in APPROVED, SENT, or PARTIALLY_RECEIVED state to receive goods. Current status: ${po.status}`,
      );
    }

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, organizationId, isActive: true },
    });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse #${dto.warehouseId} not found`);
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Generate GRN number
      const grnCount = await tx.goodsReceipt.count({ where: { organizationId } });
      const receiptNumber = `GRN-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(grnCount + 1).padStart(4, '0')}`;

      const receipt = await tx.goodsReceipt.create({
        data: {
          organizationId,
          receiptNumber,
          purchaseOrderId: id,
          warehouseId: dto.warehouseId,
          receivedDate: new Date(),
          notes: dto.notes,
          createdBy: userId,
        },
      });

      for (const line of dto.lines) {
        const poLine = po.lines.find((l) => l.id === line.purchaseOrderLineId);
        if (!poLine) {
          throw new BadRequestException(`PO Line #${line.purchaseOrderLineId} not found in this PO`);
        }

        const acceptedQty = Number(line.acceptedQty || 0);
        const receivedQty = Number(line.receivedQty || acceptedQty);
        const rejectedQty = Number(line.rejectedQty || Math.max(0, receivedQty - acceptedQty));
        const effectiveUnitCost = line.unitCost !== undefined ? Number(line.unitCost) : Number(poLine.unitCost);

        // Create GoodsReceiptLine
        await tx.goodsReceiptLine.create({
          data: {
            goodsReceiptId: receipt.id,
            purchaseOrderLineId: poLine.id,
            productId: poLine.productId,
            receivedQty: new Prisma.Decimal(receivedQty),
            acceptedQty: new Prisma.Decimal(acceptedQty),
            rejectedQty: new Prisma.Decimal(rejectedQty),
            batchNumber: line.batchNumber,
            expiryDate: line.expiryDate ? new Date(line.expiryDate) : null,
            unitCost: new Prisma.Decimal(effectiveUnitCost),
            notes: line.batchNumber ? `Batch ${line.batchNumber}` : undefined,
          },
        });

        // Update received quantity on PO line
        await tx.purchaseOrderLine.update({
          where: { id: poLine.id },
          data: {
            receivedQty: { increment: new Prisma.Decimal(acceptedQty) },
          },
        });

        if (acceptedQty > 0) {
          // Find or create InventoryBatch
          let batch = await tx.inventoryBatch.findFirst({
            where: {
              productId: poLine.productId,
              warehouseId: dto.warehouseId,
              batchNumber: line.batchNumber || null,
            },
          });

          if (batch) {
            await tx.inventoryBatch.update({
              where: { id: batch.id },
              data: {
                quantity: { increment: new Prisma.Decimal(acceptedQty) },
                unitCost: new Prisma.Decimal(effectiveUnitCost),
              },
            });
          } else {
            batch = await tx.inventoryBatch.create({
              data: {
                productId: poLine.productId,
                warehouseId: dto.warehouseId,
                batchNumber: line.batchNumber,
                expiryDate: line.expiryDate ? new Date(line.expiryDate) : null,
                quantity: new Prisma.Decimal(acceptedQty),
                unitCost: new Prisma.Decimal(effectiveUnitCost),
              },
            });
          }

          // Append-only inventory transaction
          await tx.inventoryTransaction.create({
            data: {
              organizationId,
              productId: poLine.productId,
              warehouseId: dto.warehouseId,
              transactionType: InventoryTransactionType.GOODS_RECEIPT,
              quantity: new Prisma.Decimal(acceptedQty),
              unitCost: new Prisma.Decimal(effectiveUnitCost),
              batchNumber: line.batchNumber,
              referenceType: 'GoodsReceipt',
              referenceId: receipt.id,
              notes: `Goods received against PO ${po.poNumber} under GRN ${receiptNumber}`,
              createdBy: userId,
            },
          });

          // Moving Weighted Average Cost recalculation
          const product = await tx.product.findUnique({
            where: { id: poLine.productId },
            include: { inventoryBatches: true },
          });

          if (product) {
            const currentTotalStock = product.inventoryBatches.reduce(
              (sum, b) => sum + Number(b.quantity),
              0,
            );
            const currentCost = Number(product.purchaseCost || effectiveUnitCost);
            const stockBeforeReceipt = Math.max(0, currentTotalStock - acceptedQty);

            const newWeightedCost =
              currentTotalStock > 0
                ? (stockBeforeReceipt * currentCost + acceptedQty * effectiveUnitCost) / currentTotalStock
                : effectiveUnitCost;

            await tx.product.update({
              where: { id: product.id },
              data: {
                purchaseCost: new Prisma.Decimal(newWeightedCost.toFixed(2)),
              },
            });
          }
        }
      }

      // Check entire PO fulfillment status
      const updatedPoLines = await tx.purchaseOrderLine.findMany({
        where: { purchaseOrderId: id },
      });

      const allReceived = updatedPoLines.every(
        (l) => Number(l.receivedQty) >= Number(l.quantity) - 0.001,
      );
      const anyReceived = updatedPoLines.some((l) => Number(l.receivedQty) > 0);

      const newPoStatus = allReceived
        ? PurchaseOrderStatus.RECEIVED
        : anyReceived
          ? PurchaseOrderStatus.PARTIALLY_RECEIVED
          : po.status;

      const updatedPo = await tx.purchaseOrder.update({
        where: { id },
        data: { status: newPoStatus },
        include: { lines: true, goodsReceipts: true },
      });

      await this.auditService.log({
        organizationId,
        actorId: userId,
        action: 'GOODS_RECEIPT_RECORDED',
        entityType: 'GoodsReceipt',
        entityId: receipt.id,
        changes: { receiptNumber, newPoStatus },
      });

      return {
        receipt,
        purchaseOrder: updatedPo,
      };
    });
  }

  async generateVendorBill(organizationId: string, id: string, userId?: string) {
    const po = await this.findOne(organizationId, id);

    const billCount = await this.prisma.vendorBill.count({ where: { organizationId } });
    const billNumber = `BILL-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(billCount + 1).padStart(4, '0')}`;

    const bill = await this.prisma.vendorBill.create({
      data: {
        organizationId,
        billNumber,
        vendorId: po.vendorId,
        purchaseOrderId: id,
        billDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'ISSUED',
        subtotal: po.subtotal,
        taxAmount: po.taxAmount,
        totalAmount: po.totalAmount,
        paidAmount: new Prisma.Decimal(0),
        notes: `Supplier bill for PO #${po.poNumber}`,
        createdBy: userId,
      },
      include: { vendor: true },
    });

    await this.auditService.log({
      organizationId,
      actorId: userId,
      action: 'VENDOR_BILL_GENERATED',
      entityType: 'VendorBill',
      entityId: bill.id,
      changes: { billNumber, totalAmount: po.totalAmount },
    });

    return bill;
  }

  async exportCsv(organizationId: string) {
    const orders = await this.prisma.purchaseOrder.findMany({
      where: { organizationId },
      include: { vendor: true },
      orderBy: { orderDate: 'desc' },
    });

    const headers = [
      'PO Number',
      'Vendor',
      'Date',
      'Expected Delivery',
      'Status',
      'Subtotal (INR)',
      'Tax (INR)',
      'Total Amount (INR)',
    ];

    const rows = orders.map((o) => [
      `"${o.poNumber}"`,
      `"${o.vendor.legalName}"`,
      `"${o.orderDate.toISOString().split('T')[0]}"`,
      `"${o.expectedDelivery ? o.expectedDelivery.toISOString().split('T')[0] : ''}"`,
      `"${o.status}"`,
      o.subtotal.toString(),
      o.taxAmount.toString(),
      o.totalAmount.toString(),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
