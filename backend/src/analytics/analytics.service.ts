import { Injectable } from '@nestjs/common';
import { InvoiceStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(organizationId: string, startDate?: string, endDate?: string) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    // 1. Invoiced revenue (excluding tax, adjusted for discounts)
    const invoices = await this.prisma.customerInvoice.findMany({
      where: {
        organizationId,
        invoiceDate: { gte: start, lte: end },
        status: { not: InvoiceStatus.CANCELLED },
      },
      include: {
        lines: {
          include: {
            // Need purchase cost from product to calculate COGS
          },
        },
      },
    });

    const netRevenue = invoices.reduce((sum, inv) => sum + Number(inv.subtotal), 0);
    const totalGstCollected = invoices.reduce((sum, inv) => sum + Number(inv.taxAmount), 0);
    const grossInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    // 2. Orders in date range
    const orders = await this.prisma.salesOrder.findMany({
      where: {
        organizationId,
        orderDate: { gte: start, lte: end },
        status: { not: OrderStatus.CANCELLED },
      },
      include: { lines: true },
    });

    const totalOrders = orders.length;
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

    // 3. Active vendors
    const activeVendors = await this.prisma.vendor.count({
      where: { organizationId, isActive: true },
    });

    // 4. Products and Inventory Health
    const products = await this.prisma.product.findMany({
      where: { organizationId, isActive: true },
      include: {
        inventoryBatches: true,
      },
    });

    let stockoutCount = 0;
    let lowStockCount = 0;
    let totalInventoryValue = 0;

    for (const p of products) {
      const stock = p.inventoryBatches.reduce((sum, b) => sum + Number(b.quantity), 0);
      const cost = Number(p.purchaseCost || 0);
      totalInventoryValue += stock * cost;

      if (stock <= 0) {
        stockoutCount++;
      } else if (stock <= p.reorderLevel) {
        lowStockCount++;
      }
    }

    // 5. Imports overview
    const [totalImports, pendingReviewImports, approvedImports] = await Promise.all([
      this.prisma.emailImport.count({ where: { organizationId } }),
      this.prisma.emailImport.count({
        where: { organizationId, status: 'REVIEW_REQUIRED' },
      }),
      this.prisma.emailImport.count({
        where: { organizationId, status: 'APPROVED' },
      }),
    ]);

    return {
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      metrics: {
        netRevenue: Math.round(netRevenue * 100) / 100,
        grossInvoiced: Math.round(grossInvoiced * 100) / 100,
        totalGstCollected: Math.round(totalGstCollected * 100) / 100,
        totalOrders,
        fillRatePercent,
        totalOrderedQty: Math.round(totalOrderedQty * 100) / 100,
        totalShippedQty: Math.round(totalShippedQty * 100) / 100,
        activeVendors,
        totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
        stockoutCount,
        lowStockCount,
        imports: {
          total: totalImports,
          pendingReview: pendingReviewImports,
          approved: approvedImports,
        },
      },
    };
  }

  async getProductPerformance(organizationId: string) {
    const products = await this.prisma.product.findMany({
      where: { organizationId, isActive: true },
      include: {
        category: true,
        salesOrderLines: {
          include: { salesOrder: true },
        },
        inventoryBatches: true,
      },
    });

    return products.map((p) => {
      let totalUnitsSold = 0;
      let totalRevenue = 0;

      for (const line of p.salesOrderLines) {
        if (line.salesOrder.status !== OrderStatus.CANCELLED) {
          const qty = Number(line.fulfilledQty || line.quantity);
          totalUnitsSold += qty;
          totalRevenue += Number(line.unitPrice) * qty;
        }
      }

      const purchaseCost = p.purchaseCost ? Number(p.purchaseCost) : null;
      const sellingPrice = Number(p.sellingPrice || 0);

      let grossMarginPercent: number | null = null;
      let grossProfit: number | null = null;

      if (purchaseCost !== null && sellingPrice > 0) {
        grossMarginPercent = Math.round(((sellingPrice - purchaseCost) / sellingPrice) * 10000) / 100;
        grossProfit = Math.round((sellingPrice - purchaseCost) * totalUnitsSold * 100) / 100;
      }

      const currentStock = p.inventoryBatches.reduce(
        (sum, b) => sum + Number(b.quantity),
        0,
      );

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category?.name || 'General',
        sellingPrice,
        purchaseCost,
        hasReliableCost: purchaseCost !== null,
        currentStock,
        totalUnitsSold: Math.round(totalUnitsSold * 100) / 100,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        grossMarginPercent,
        grossProfit,
      };
    });
  }

  async getReorderRecommendations(organizationId: string) {
    // 30 days window for velocity
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

    const products = await this.prisma.product.findMany({
      where: { organizationId, isActive: true },
      include: {
        inventoryBatches: true,
        salesOrderLines: {
          where: {
            salesOrder: {
              orderDate: { gte: thirtyDaysAgo },
              status: { not: OrderStatus.CANCELLED },
            },
          },
        },
        productVendors: {
          include: { vendor: true },
          take: 1,
        },
      },
    });

    return products.map((p) => {
      const currentStock = p.inventoryBatches.reduce(
        (sum, b) => sum + Number(b.quantity),
        0,
      );
      const reservedStock = p.inventoryBatches.reduce(
        (sum, b) => sum + Number(b.reservedQty),
        0,
      );
      const availableStock = Math.max(0, currentStock - reservedStock);

      const unitsSold30d = p.salesOrderLines.reduce(
        (sum, l) => sum + Number(l.quantity),
        0,
      );
      const dailyVelocity = Math.round((unitsSold30d / 30) * 100) / 100;

      const leadTimeDays = p.productVendors[0]?.leadTimeDays || 7;
      const safetyStock = Math.ceil(dailyVelocity * 3);
      const reorderPoint = Math.ceil(dailyVelocity * leadTimeDays + safetyStock);

      const needsReorder = availableStock <= Math.max(p.reorderLevel, reorderPoint);
      const suggestedOrderQty = needsReorder
        ? Math.max(0, Math.ceil(reorderPoint * 2 - availableStock))
        : 0;

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        unitOfMeasure: p.unitOfMeasure,
        currentStock,
        availableStock,
        reorderLevel: p.reorderLevel,
        leadTimeDays,
        dailyVelocity,
        safetyStock,
        reorderPoint,
        needsReorder,
        suggestedOrderQty,
        preferredVendor: p.productVendors[0]?.vendor.legalName || 'Default Supplier',
      };
    });
  }

  async exportCsv(organizationId: string) {
    const performance = await this.getProductPerformance(organizationId);

    const headers = [
      'SKU',
      'Name',
      'Category',
      'Selling Price (INR)',
      'Purchase Cost (INR)',
      'Units Sold',
      'Total Revenue (INR)',
      'Gross Margin %',
      'Gross Profit (INR)',
      'Current Stock',
    ];

    const rows = performance.map((p) => [
      `"${p.sku}"`,
      `"${p.name}"`,
      `"${p.category}"`,
      p.sellingPrice.toString(),
      p.purchaseCost !== null ? p.purchaseCost.toString() : 'N/A',
      p.totalUnitsSold.toString(),
      p.totalRevenue.toString(),
      p.grossMarginPercent !== null ? `${p.grossMarginPercent}%` : 'N/A',
      p.grossProfit !== null ? p.grossProfit.toString() : 'N/A',
      p.currentStock.toString(),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
