import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InventoryTransactionType, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreateSalesOrderDto,
  FulfillOrderDto,
  QuerySalesOrderDto,
  UpdateSalesOrderStatusDto,
} from './dto/sales-order.dto.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class SalesOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(organizationId: string, query: QuerySalesOrderDto) {
    const { page = 1, limit = 20, search, status, customerId, channelId, startDate, endDate } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.SalesOrderWhereInput = {
      organizationId,
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
      ...(channelId ? { channelId } : {}),
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
              { orderNumber: { contains: search, mode: 'insensitive' } },
              { externalOrderId: { contains: search, mode: 'insensitive' } },
              { customer: { legalName: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { orderDate: 'desc' },
        include: {
          customer: {
            select: { id: true, legalName: true, tradingName: true, channelType: true },
          },
          channel: {
            select: { id: true, name: true, channelType: true },
          },
          _count: {
            select: { lines: true, shipments: true, invoices: true },
          },
        },
      }),
      this.prisma.salesOrder.count({ where }),
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
    const order = await this.prisma.salesOrder.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        channel: true,
        lines: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unitOfMeasure: true,
                hsnCode: true,
              },
            },
          },
        },
        shipments: {
          include: {
            lines: true,
            warehouse: { select: { id: true, name: true, code: true } },
          },
        },
        invoices: {
          include: {
            lines: true,
          },
        },
        reservations: {
          where: { isActive: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Sales Order #${id} not found`);
    }

    return order;
  }

  async create(organizationId: string, dto: CreateSalesOrderDto, userId?: string) {
    // 1. Idempotency check for externalOrderId within org and channel
    if (dto.externalOrderId) {
      const existing = await this.prisma.salesOrder.findFirst({
        where: {
          organizationId,
          externalOrderId: dto.externalOrderId,
          channelId: dto.channelId || null,
        },
      });
      if (existing) {
        throw new ConflictException(
          `Sales Order with external ID "${dto.externalOrderId}" already exists for this channel. Order Number: ${existing.orderNumber}`,
        );
      }
    }

    // 2. Customer validation
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, organizationId, isActive: true },
    });
    if (!customer) {
      throw new NotFoundException(`Customer #${dto.customerId} not found or inactive`);
    }

    // 3. Generate sequential order number
    const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = await this.prisma.salesOrder.count({ where: { organizationId } });
    const orderNumber = `SO-${datePrefix}-${String(count + 1).padStart(4, '0')}`;

    // 4. Calculate line and order totals
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    const linesData = dto.lines.map((line) => {
      const lineSubtotal = Number(line.unitPrice) * Number(line.quantity);
      const lineDiscount = Number(line.discount || 0);
      const taxable = Math.max(0, lineSubtotal - lineDiscount);
      const lineTax = taxable * (Number(line.taxRate || 18) / 100);
      const lineTotal = taxable + lineTax;

      subtotal += lineSubtotal;
      discountAmount += lineDiscount;
      taxAmount += lineTax;

      return {
        productId: line.productId,
        quantity: new Prisma.Decimal(line.quantity),
        unitPrice: new Prisma.Decimal(line.unitPrice),
        discount: new Prisma.Decimal(lineDiscount),
        taxRate: new Prisma.Decimal(line.taxRate || 18),
        taxAmount: new Prisma.Decimal(lineTax.toFixed(2)),
        lineTotal: new Prisma.Decimal(lineTotal.toFixed(2)),
      };
    });

    const totalAmount = subtotal - discountAmount + taxAmount;

    const order = await this.prisma.salesOrder.create({
      data: {
        organizationId,
        orderNumber,
        customerId: dto.customerId,
        channelId: dto.channelId,
        externalOrderId: dto.externalOrderId,
        orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
        expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : null,
        status: OrderStatus.PENDING_REVIEW,
        source: 'manual',
        subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
        discountAmount: new Prisma.Decimal(discountAmount.toFixed(2)),
        taxAmount: new Prisma.Decimal(taxAmount.toFixed(2)),
        totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)),
        notes: dto.notes,
        createdBy: userId,
        lines: {
          create: linesData,
        },
      },
      include: {
        customer: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    await this.auditService.log({
      organizationId,
      actorId: userId,
      action: 'SALES_ORDER_CREATED',
      entityType: 'SalesOrder',
      entityId: order.id,
      changes: { orderNumber, totalAmount, linesCount: dto.lines.length },
    });

    return order;
  }

  async updateStatus(
    organizationId: string,
    id: string,
    dto: UpdateSalesOrderStatusDto,
    userId?: string,
  ) {
    const order = await this.findOne(organizationId, id);

    // Business validation for status transitions
    if (order.status === OrderStatus.FULFILLED && dto.status !== OrderStatus.RETURNED) {
      throw new BadRequestException('Fulfilled orders cannot be transitioned except to RETURNED');
    }
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cancelled orders cannot be modified');
    }

    return await this.prisma.$transaction(async (tx) => {
      const updateData: Prisma.SalesOrderUpdateInput = {
        status: dto.status,
      };

      if (dto.status === OrderStatus.APPROVED) {
        updateData.approvedBy = userId;
        updateData.approvedAt = new Date();
      }

      if (dto.status === OrderStatus.CANCELLED) {
        updateData.cancelledAt = new Date();
        updateData.cancelReason = dto.cancelReason || 'Cancelled by user';

        // Release any reservations
        await tx.inventoryReservation.updateMany({
          where: { salesOrderId: id, organizationId, isActive: true },
          data: { isActive: false },
        });

        // Decrement reserved quantities in batches
        const reservations = await tx.inventoryReservation.findMany({
          where: { salesOrderId: id, organizationId },
        });

        for (const res of reservations) {
          const remainingToRelease = Number(res.quantity) - Number(res.fulfilledQty);
          if (remainingToRelease > 0) {
            const batch = await tx.inventoryBatch.findFirst({
              where: { productId: res.productId, warehouseId: res.warehouseId },
            });
            if (batch) {
              await tx.inventoryBatch.update({
                where: { id: batch.id },
                data: {
                  reservedQty: {
                    decrement: new Prisma.Decimal(remainingToRelease),
                  },
                },
              });
            }
          }
        }
      }

      const updated = await tx.salesOrder.update({
        where: { id },
        data: updateData,
        include: { lines: true, customer: true },
      });

      await this.auditService.log({
        organizationId,
        actorId: userId,
        action: `SALES_ORDER_STATUS_${dto.status}`,
        entityType: 'SalesOrder',
        entityId: id,
        changes: { previous: order.status, current: dto.status },
      });

      return updated;
    });
  }

  async reserveStock(organizationId: string, id: string, warehouseId: string, userId?: string) {
    const order = await this.findOne(organizationId, id);

    if (order.status !== OrderStatus.APPROVED && order.status !== OrderStatus.PENDING_REVIEW) {
      throw new BadRequestException(`Cannot reserve stock for order in ${order.status} state`);
    }

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, organizationId, isActive: true },
    });
    if (!warehouse) {
      throw new NotFoundException(`Warehouse #${warehouseId} not found`);
    }

    return await this.prisma.$transaction(async (tx) => {
      const shortages: Array<{ productId: string; requested: number; available: number }> = [];

      for (const line of order.lines) {
        const neededQty = Number(line.quantity) - Number(line.fulfilledQty);

        // Find available stock in this warehouse
        const batches = await tx.inventoryBatch.findMany({
          where: {
            productId: line.productId,
            warehouseId,
            quantity: { gt: 0 },
          },
          orderBy: { expiryDate: 'asc' }, // FEFO
        });

        const totalAvailable = batches.reduce(
          (sum, b) => sum + (Number(b.quantity) - Number(b.reservedQty)),
          0,
        );

        if (totalAvailable < neededQty) {
          shortages.push({
            productId: line.productId,
            requested: neededQty,
            available: Math.max(0, totalAvailable),
          });
        }

        // Reserve available up to neededQty
        let qtyToReserve = Math.min(neededQty, Math.max(0, totalAvailable));

        if (qtyToReserve > 0) {
          await tx.inventoryReservation.create({
            data: {
              organizationId,
              productId: line.productId,
              warehouseId,
              salesOrderId: id,
              salesOrderLineId: line.id,
              quantity: new Prisma.Decimal(qtyToReserve),
              isActive: true,
            },
          });

          // Update batch reservedQty
          for (const batch of batches) {
            if (qtyToReserve <= 0) break;
            const batchAvail = Number(batch.quantity) - Number(batch.reservedQty);
            if (batchAvail > 0) {
              const take = Math.min(qtyToReserve, batchAvail);
              await tx.inventoryBatch.update({
                where: { id: batch.id },
                data: { reservedQty: { increment: new Prisma.Decimal(take) } },
              });
              qtyToReserve -= take;
            }
          }

          // Record reservation transaction
          await tx.inventoryTransaction.create({
            data: {
              organizationId,
              productId: line.productId,
              warehouseId,
              transactionType: InventoryTransactionType.RESERVATION,
              quantity: new Prisma.Decimal(Math.min(neededQty, totalAvailable)),
              referenceType: 'SalesOrder',
              referenceId: id,
              notes: `Stock reserved for order ${order.orderNumber}`,
              createdBy: userId,
            },
          });
        }
      }

      const newStatus = shortages.length === 0 ? OrderStatus.ALLOCATED : order.status;
      const updatedOrder = await tx.salesOrder.update({
        where: { id },
        data: { status: newStatus },
        include: { reservations: true, lines: true },
      });

      return {
        order: updatedOrder,
        shortages,
        isFullyAllocated: shortages.length === 0,
      };
    });
  }

  async fulfillOrder(organizationId: string, id: string, dto: FulfillOrderDto, userId?: string) {
    const order = await this.findOne(organizationId, id);

    if (
      order.status !== OrderStatus.APPROVED &&
      order.status !== OrderStatus.ALLOCATED &&
      order.status !== OrderStatus.PARTIALLY_FULFILLED
    ) {
      throw new BadRequestException(
        `Order must be in APPROVED, ALLOCATED, or PARTIALLY_FULFILLED status to fulfill. Current status: ${order.status}`,
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Generate Shipment Number
      const shipmentCount = await tx.shipment.count({ where: { organizationId } });
      const shipmentNumber = `SHP-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(shipmentCount + 1).padStart(4, '0')}`;

      const shipment = await tx.shipment.create({
        data: {
          organizationId,
          shipmentNumber,
          salesOrderId: id,
          warehouseId: dto.warehouseId,
          dispatchDate: new Date(),
          carrier: dto.carrier || 'Standard Dispatch',
          trackingNumber: dto.trackingNumber,
          status: 'DISPATCHED',
          notes: dto.notes,
          createdBy: userId,
        },
      });

      // 2. Process each fulfillment line
      for (const item of dto.items) {
        const orderLine = order.lines.find((l) => l.id === item.salesOrderLineId);
        if (!orderLine) {
          throw new BadRequestException(`Line #${item.salesOrderLineId} not found in this order`);
        }

        const remainingToFulfill = Number(orderLine.quantity) - Number(orderLine.fulfilledQty);
        if (Number(item.quantity) > remainingToFulfill + 0.0001) {
          throw new BadRequestException(
            `Shipped quantity (${item.quantity}) exceeds remaining unfulfilled quantity (${remainingToFulfill}) for product`,
          );
        }

        // Deduct from inventory batch (FEFO order)
        let qtyToDeduct = Number(item.quantity);

        const batches = await tx.inventoryBatch.findMany({
          where: {
            productId: orderLine.productId,
            warehouseId: dto.warehouseId,
            ...(item.batchNumber ? { batchNumber: item.batchNumber } : {}),
            quantity: { gt: 0 },
          },
          orderBy: { expiryDate: 'asc' },
        });

        const totalBatchStock = batches.reduce((sum, b) => sum + Number(b.quantity), 0);
        if (totalBatchStock < qtyToDeduct) {
          throw new BadRequestException(
            `Insufficient inventory on hand in warehouse to dispatch ${qtyToDeduct} units of SKU`,
          );
        }

        for (const batch of batches) {
          if (qtyToDeduct <= 0) break;
          const take = Math.min(qtyToDeduct, Number(batch.quantity));
          const reservedDeduct = Math.min(take, Number(batch.reservedQty));

          await tx.inventoryBatch.update({
            where: { id: batch.id },
            data: {
              quantity: { decrement: new Prisma.Decimal(take) },
              reservedQty: { decrement: new Prisma.Decimal(reservedDeduct) },
            },
          });

          // Append-only inventory transaction
          await tx.inventoryTransaction.create({
            data: {
              organizationId,
              productId: orderLine.productId,
              warehouseId: dto.warehouseId,
              transactionType: InventoryTransactionType.SALES_DISPATCH,
              quantity: new Prisma.Decimal(-take),
              unitCost: batch.unitCost,
              batchNumber: batch.batchNumber,
              referenceType: 'Shipment',
              referenceId: shipment.id,
              notes: `Dispatch for order ${order.orderNumber} shipment ${shipmentNumber}`,
              createdBy: userId,
            },
          });

          qtyToDeduct -= take;
        }

        // Update sales order line fulfilledQty
        await tx.salesOrderLine.update({
          where: { id: orderLine.id },
          data: {
            fulfilledQty: { increment: new Prisma.Decimal(item.quantity) },
          },
        });

        // Create Shipment Line
        await tx.shipmentLine.create({
          data: {
            shipmentId: shipment.id,
            salesOrderLineId: orderLine.id,
            productId: orderLine.productId,
            pickedQty: new Prisma.Decimal(item.quantity),
            packedQty: new Prisma.Decimal(item.quantity),
            shippedQty: new Prisma.Decimal(item.quantity),
            batchNumber: item.batchNumber,
          },
        });
      }

      // 3. Re-calculate entire order fulfillment status
      const updatedLines = await tx.salesOrderLine.findMany({
        where: { salesOrderId: id },
      });

      const allFulfilled = updatedLines.every(
        (l) => Number(l.fulfilledQty) >= Number(l.quantity) - 0.001,
      );
      const anyFulfilled = updatedLines.some((l) => Number(l.fulfilledQty) > 0);

      const newOrderStatus = allFulfilled
        ? OrderStatus.FULFILLED
        : anyFulfilled
          ? OrderStatus.PARTIALLY_FULFILLED
          : order.status;

      const finalOrder = await tx.salesOrder.update({
        where: { id },
        data: { status: newOrderStatus },
        include: { lines: true, shipments: true },
      });

      await this.auditService.log({
        organizationId,
        actorId: userId,
        action: 'ORDER_DISPATCHED',
        entityType: 'Shipment',
        entityId: shipment.id,
        changes: { shipmentNumber, newOrderStatus, itemsCount: dto.items.length },
      });

      return {
        shipment,
        order: finalOrder,
      };
    });
  }

  async generateInvoice(organizationId: string, id: string, userId?: string) {
    const order = await this.findOne(organizationId, id);

    const invoiceCount = await this.prisma.customerInvoice.count({ where: { organizationId } });
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(invoiceCount + 1).padStart(4, '0')}`;

    return await this.prisma.$transaction(async (tx) => {
      const invoice = await tx.customerInvoice.create({
        data: {
          organizationId,
          invoiceNumber,
          customerId: order.customerId,
          salesOrderId: id,
          invoiceDate: new Date(),
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days credit
          status: 'ISSUED',
          subtotal: order.subtotal,
          discountAmount: order.discountAmount,
          taxAmount: order.taxAmount,
          totalAmount: order.totalAmount,
          paidAmount: new Prisma.Decimal(0),
          notes: `Invoice generated for Sales Order #${order.orderNumber}`,
          createdBy: userId,
          lines: {
            create: order.lines.map((line) => ({
              productId: line.productId,
              description: line.product.name,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxRate: line.taxRate,
              taxAmount: line.taxAmount,
              lineTotal: line.lineTotal,
            })),
          },
        },
        include: { lines: true, customer: true },
      });

      await this.auditService.log({
        organizationId,
        actorId: userId,
        action: 'INVOICE_GENERATED',
        entityType: 'CustomerInvoice',
        entityId: invoice.id,
        changes: { invoiceNumber, totalAmount: order.totalAmount },
      });

      return invoice;
    });
  }

  async exportCsv(organizationId: string) {
    const orders = await this.prisma.salesOrder.findMany({
      where: { organizationId },
      include: { customer: true, channel: true },
      orderBy: { orderDate: 'desc' },
    });

    const headers = [
      'Order Number',
      'Customer',
      'Channel',
      'External Order ID',
      'Date',
      'Status',
      'Subtotal (INR)',
      'Tax (INR)',
      'Total Amount (INR)',
    ];

    const rows = orders.map((o) => [
      `"${o.orderNumber}"`,
      `"${o.customer.legalName}"`,
      `"${o.channel?.name || 'Direct'}"`,
      `"${o.externalOrderId || ''}"`,
      `"${o.orderDate.toISOString().split('T')[0]}"`,
      `"${o.status}"`,
      o.subtotal.toString(),
      o.taxAmount.toString(),
      o.totalAmount.toString(),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
