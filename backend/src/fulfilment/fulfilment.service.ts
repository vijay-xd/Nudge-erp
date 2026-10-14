import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { QueryShipmentDto, UpdateShipmentStatusDto } from './dto/fulfilment.dto.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class FulfilmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getReadyOrders(organizationId: string) {
    return this.prisma.salesOrder.findMany({
      where: {
        organizationId,
        status: {
          in: [
            OrderStatus.APPROVED,
            OrderStatus.ALLOCATED,
            OrderStatus.PARTIALLY_FULFILLED,
          ],
        },
      },
      include: {
        customer: { select: { id: true, legalName: true, tradingName: true } },
        lines: {
          include: {
            product: { select: { id: true, sku: true, name: true, unitOfMeasure: true } },
          },
        },
        reservations: { where: { isActive: true } },
      },
      orderBy: { orderDate: 'asc' },
    });
  }

  async getShipments(organizationId: string, query: QueryShipmentDto) {
    const { page = 1, limit = 20, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ShipmentWhereInput = {
      organizationId,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { shipmentNumber: { contains: search, mode: 'insensitive' } },
              { trackingNumber: { contains: search, mode: 'insensitive' } },
              { carrier: { contains: search, mode: 'insensitive' } },
              { salesOrder: { orderNumber: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [shipments, total] = await Promise.all([
      this.prisma.shipment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          salesOrder: {
            select: {
              id: true,
              orderNumber: true,
              customer: { select: { legalName: true } },
            },
          },
          warehouse: { select: { id: true, name: true, code: true } },
          lines: {
            include: {
              salesOrderLine: {
                include: { product: { select: { sku: true, name: true } } },
              },
            },
          },
        },
      }),
      this.prisma.shipment.count({ where }),
    ]);

    return {
      data: shipments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getShipment(organizationId: string, id: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { id, organizationId },
      include: {
        salesOrder: { include: { customer: true } },
        warehouse: true,
        lines: {
          include: {
            salesOrderLine: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment #${id} not found`);
    }

    return shipment;
  }

  async updateShipmentStatus(
    organizationId: string,
    id: string,
    dto: UpdateShipmentStatusDto,
    userId?: string,
  ) {
    const shipment = await this.getShipment(organizationId, id);

    const updated = await this.prisma.shipment.update({
      where: { id },
      data: {
        status: dto.status,
        trackingNumber: dto.trackingNumber || shipment.trackingNumber,
        carrier: dto.carrier || shipment.carrier,
        notes: dto.notes || shipment.notes,
      },
    });

    await this.auditService.log({
      organizationId,
      actorId: userId,
      action: `SHIPMENT_STATUS_${dto.status}`,
      entityType: 'Shipment',
      entityId: id,
      changes: { previous: shipment.status, current: dto.status },
    });

    return updated;
  }

  async getFillRateMetrics(organizationId: string) {
    const orders = await this.prisma.salesOrder.findMany({
      where: {
        organizationId,
        status: { not: OrderStatus.CANCELLED },
      },
      include: { lines: true },
    });

    const totalOrders = orders.length;
    const fulfilledOrders = orders.filter((o) => o.status === OrderStatus.FULFILLED).length;
    const partiallyFulfilledOrders = orders.filter(
      (o) => o.status === OrderStatus.PARTIALLY_FULFILLED,
    ).length;

    let totalOrderedQty = 0;
    let totalShippedQty = 0;

    for (const order of orders) {
      for (const line of order.lines) {
        totalOrderedQty += Number(line.quantity);
        totalShippedQty += Number(line.fulfilledQty);
      }
    }

    const fillRatePercent =
      totalOrderedQty > 0
        ? Math.round((totalShippedQty / totalOrderedQty) * 10000) / 100
        : 100;

    const totalShipments = await this.prisma.shipment.count({
      where: { organizationId },
    });

    return {
      totalOrders,
      fulfilledOrders,
      partiallyFulfilledOrders,
      pendingOrders: totalOrders - fulfilledOrders - partiallyFulfilledOrders,
      totalOrderedQty: Math.round(totalOrderedQty * 100) / 100,
      totalShippedQty: Math.round(totalShippedQty * 100) / 100,
      fillRatePercent,
      totalShipments,
    };
  }
}
