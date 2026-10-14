import { Injectable } from '@nestjs/common';
import { ImportStatus, InvoiceStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(organizationId: string) {
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    // 1. Current & Previous Month Revenue (Customer Invoices, excluding tax according to accounting rules)
    const [currentMonthInvoices, prevMonthInvoices] = await Promise.all([
      this.prisma.customerInvoice.findMany({
        where: {
          organizationId,
          invoiceDate: { gte: startOfCurrentMonth },
          status: { notIn: [InvoiceStatus.CANCELLED, InvoiceStatus.DRAFT] },
        },
        select: { subtotal: true, totalAmount: true, paidAmount: true },
      }),
      this.prisma.customerInvoice.findMany({
        where: {
          organizationId,
          invoiceDate: { gte: startOfPreviousMonth, lte: endOfPreviousMonth },
          status: { notIn: [InvoiceStatus.CANCELLED, InvoiceStatus.DRAFT] },
        },
        select: { subtotal: true, totalAmount: true },
      }),
    ]);

    const currentRevenue = currentMonthInvoices.reduce(
      (sum, inv) => sum + Number(inv.subtotal),
      0,
    );
    const previousRevenue = prevMonthInvoices.reduce(
      (sum, inv) => sum + Number(inv.subtotal),
      0,
    );
    const revenueGrowthPct =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : currentRevenue > 0
          ? 100
          : 0;

    // 2. Total Active Vendors
    const activeVendors = await this.prisma.vendor.count({
      where: { organizationId, isActive: true },
    });

    // 3. Orders stats
    const [totalOrdersCurrentMonth, totalOrdersAllTime, ordersPendingReview] = await Promise.all([
      this.prisma.salesOrder.count({
        where: {
          organizationId,
          orderDate: { gte: startOfCurrentMonth },
        },
      }),
      this.prisma.salesOrder.count({
        where: { organizationId },
      }),
      this.prisma.salesOrder.count({
        where: { organizationId, status: OrderStatus.PENDING_REVIEW },
      }),
    ]);

    // 4. Fill Rate Calculation
    const orderLines = await this.prisma.salesOrderLine.findMany({
      where: {
        salesOrder: { organizationId, status: { not: OrderStatus.CANCELLED } },
        isCancelled: false,
      },
      select: {
        quantity: true,
        fulfilledQty: true,
      },
    });

    let totalOrderedQty = 0;
    let totalFulfilledQty = 0;
    for (const line of orderLines) {
      totalOrderedQty += Number(line.quantity);
      totalFulfilledQty += Number(line.fulfilledQty);
    }

    const fillRatePct =
      totalOrderedQty > 0
        ? Math.round((totalFulfilledQty / totalOrderedQty) * 1000) / 10
        : 100;

    // 5. Inventory Value and Low Stock Products
    const productsWithBatches = await this.prisma.product.findMany({
      where: { organizationId, isActive: true },
      select: {
        id: true,
        sku: true,
        name: true,
        reorderLevel: true,
        unitOfMeasure: true,
        purchaseCost: true,
        sellingPrice: true,
        inventoryBatches: {
          select: { quantity: true, reservedQty: true },
        },
      },
    });

    let totalInventoryValue = 0;

    const lowStockItems = productsWithBatches
      .map((p) => {
        const currentStock = p.inventoryBatches.reduce(
          (sum, b) => sum + Number(b.quantity),
          0,
        );
        const cost = Number(p.purchaseCost || 0);
        totalInventoryValue += currentStock * cost;

        return {
          id: p.id,
          sku: p.sku,
          name: p.name,
          currentStock,
          reorderLevel: p.reorderLevel,
          unitOfMeasure: p.unitOfMeasure,
          sellingPrice: p.sellingPrice ? Number(p.sellingPrice) : null,
          isLowStock: currentStock <= p.reorderLevel,
        };
      })
      .filter((p) => p.isLowStock)
      .sort((a, b) => (a.currentStock - a.reorderLevel) - (b.currentStock - b.reorderLevel));

    // 6. Gmail / Document Imports Breakdown
    const [totalImports, pendingReviewImports, approvedImports, failedImports] = await Promise.all([
      this.prisma.emailImport.count({ where: { organizationId } }),
      this.prisma.emailImport.count({
        where: { organizationId, status: ImportStatus.REVIEW_REQUIRED },
      }),
      this.prisma.emailImport.count({
        where: { organizationId, status: ImportStatus.APPROVED },
      }),
      this.prisma.emailImport.count({
        where: { organizationId, status: ImportStatus.FAILED },
      }),
    ]);

    // 7. Top Selling Products
    const salesAggregates = await this.prisma.salesOrderLine.groupBy({
      by: ['productId'],
      where: {
        salesOrder: {
          organizationId,
          status: { not: OrderStatus.CANCELLED },
        },
        isCancelled: false,
      },
      _sum: {
        quantity: true,
        lineTotal: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    });

    const topProductIds = salesAggregates.map((s) => s.productId);
    const topProductsInfo = await this.prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, sku: true, brand: true },
    });

    const topSellingProducts = salesAggregates.map((agg) => {
      const prod = topProductsInfo.find((p) => p.id === agg.productId);
      return {
        productId: agg.productId,
        name: prod?.name || 'Unknown',
        sku: prod?.sku || '',
        brand: prod?.brand || '',
        unitsSold: Number(agg._sum.quantity || 0),
        totalRevenue: Number(agg._sum.lineTotal || 0),
      };
    });

    // 8. Recent Activity
    const [recentSales, recentPurchases] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where: { organizationId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { legalName: true } },
        },
      }),
      this.prisma.purchaseOrder.findMany({
        where: { organizationId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: { select: { legalName: true } },
        },
      }),
    ]);

    const recentActivity = [
      ...recentSales.map((so) => ({
        id: so.id,
        type: 'SALES_ORDER',
        title: `Sales Order ${so.orderNumber}`,
        subtitle: so.customer.legalName,
        status: so.status,
        amount: Number(so.totalAmount),
        timestamp: so.createdAt,
      })),
      ...recentPurchases.map((po) => ({
        id: po.id,
        type: 'PURCHASE_ORDER',
        title: `Purchase Order ${po.poNumber}`,
        subtitle: po.vendor.legalName,
        status: po.status,
        amount: Number(po.totalAmount),
        timestamp: po.createdAt,
      })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 8);

    return {
      revenue: {
        currentMonth: Math.round(currentRevenue * 100) / 100,
        previousMonth: Math.round(previousRevenue * 100) / 100,
        growthPercentage: Math.round(revenueGrowthPct * 10) / 10,
      },
      activeVendors,
      orders: {
        currentMonth: totalOrdersCurrentMonth,
        allTime: totalOrdersAllTime,
        pendingReview: ordersPendingReview,
      },
      fillRate: {
        percentage: fillRatePct,
        totalOrdered: totalOrderedQty,
        totalFulfilled: totalFulfilledQty,
      },
      inventoryValue: Math.round(totalInventoryValue * 100) / 100,
      lowStockCount: lowStockItems.length,
      lowStockProducts: lowStockItems.slice(0, 5),
      gmailImports: {
        total: totalImports,
        pendingReview: pendingReviewImports,
        approved: approvedImports,
        failed: failedImports,
      },
      topSellingProducts,
      recentActivity,
    };
  }

  async getTrends(organizationId: string) {
    const months: { label: string; start: Date; end: Date }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const label = start.toLocaleString('default', { month: 'short', year: 'numeric' });
      months.push({ label, start, end });
    }

    const monthlyTrends = await Promise.all(
      months.map(async ({ label, start, end }) => {
        const [invoices, orders] = await Promise.all([
          this.prisma.customerInvoice.findMany({
            where: {
              organizationId,
              invoiceDate: { gte: start, lte: end },
              status: { notIn: [InvoiceStatus.CANCELLED, InvoiceStatus.DRAFT] },
            },
            select: { subtotal: true, totalAmount: true, paidAmount: true },
          }),
          this.prisma.salesOrder.findMany({
            where: {
              organizationId,
              orderDate: { gte: start, lte: end },
              status: { not: OrderStatus.CANCELLED },
            },
            select: { totalAmount: true },
          }),
        ]);

        const revenue = invoices.reduce((sum, inv) => sum + Number(inv.subtotal), 0);
        const grossInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
        const collected = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0);
        const orderValue = orders.reduce((sum, ord) => sum + Number(ord.totalAmount), 0);

        return {
          month: label,
          revenue: Math.round(revenue * 100) / 100,
          grossInvoiced: Math.round(grossInvoiced * 100) / 100,
          collected: Math.round(collected * 100) / 100,
          orderValue: Math.round(orderValue * 100) / 100,
          orderCount: orders.length,
          invoiceCount: invoices.length,
        };
      }),
    );

    return {
      trends: monthlyTrends,
    };
  }
}
