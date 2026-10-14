import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InvoiceStatus, PaymentType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CreatePaymentDto,
  QueryBillDto,
  QueryInvoiceDto,
} from './dto/finance.dto.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getInvoices(organizationId: string, query: QueryInvoiceDto) {
    const { page = 1, limit = 20, status, customerId, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerInvoiceWhereInput = {
      organizationId,
      ...(status ? { status } : {}),
      ...(customerId ? { customerId } : {}),
      ...(search
        ? {
            OR: [
              { invoiceNumber: { contains: search, mode: 'insensitive' } },
              { customer: { legalName: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [invoices, total] = await Promise.all([
      this.prisma.customerInvoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { invoiceDate: 'desc' },
        include: {
          customer: { select: { id: true, legalName: true, tradingName: true, gstin: true } },
          _count: { select: { lines: true, paymentAllocations: true } },
        },
      }),
      this.prisma.customerInvoice.count({ where }),
    ]);

    return {
      data: invoices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInvoice(organizationId: string, id: string) {
    const invoice = await this.prisma.customerInvoice.findFirst({
      where: { id, organizationId },
      include: {
        customer: true,
        salesOrder: { select: { id: true, orderNumber: true, orderDate: true } },
        lines: true,
        paymentAllocations: {
          include: {
            payment: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice #${id} not found`);
    }

    return invoice;
  }

  async getBills(organizationId: string, query: QueryBillDto) {
    const { page = 1, limit = 20, status, vendorId, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.VendorBillWhereInput = {
      organizationId,
      ...(status ? { status } : {}),
      ...(vendorId ? { vendorId } : {}),
      ...(search
        ? {
            OR: [
              { billNumber: { contains: search, mode: 'insensitive' } },
              { vendor: { legalName: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [bills, total] = await Promise.all([
      this.prisma.vendorBill.findMany({
        where,
        skip,
        take: limit,
        orderBy: { billDate: 'desc' },
        include: {
          vendor: { select: { id: true, legalName: true, tradingName: true } },
          _count: { select: { paymentAllocations: true } },
        },
      }),
      this.prisma.vendorBill.count({ where }),
    ]);

    return {
      data: bills,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPayments(organizationId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { organizationId },
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
        include: {
          allocations: {
            include: {
              invoice: { select: { invoiceNumber: true, totalAmount: true } },
              vendorBill: { select: { billNumber: true, totalAmount: true } },
            },
          },
        },
      }),
      this.prisma.payment.count({ where: { organizationId } }),
    ]);

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async recordPayment(organizationId: string, dto: CreatePaymentDto, userId?: string) {
    const totalAllocated = dto.allocations.reduce((sum, a) => sum + Number(a.amount), 0);
    if (Math.abs(totalAllocated - Number(dto.amount)) > 0.01) {
      throw new BadRequestException(
        `Total allocated amount (₹${totalAllocated}) must match payment amount (₹${dto.amount})`,
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      const paymentCount = await tx.payment.count({ where: { organizationId } });
      const prefix = dto.paymentType === PaymentType.RECEIVED ? 'PAY-IN' : 'PAY-OUT';
      const paymentNumber = `${prefix}-${new Date().toISOString().slice(0, 7).replace('-', '')}-${String(paymentCount + 1).padStart(4, '0')}`;

      const payment = await tx.payment.create({
        data: {
          organizationId,
          paymentNumber,
          paymentType: dto.paymentType,
          paymentMethod: dto.paymentMethod,
          amount: new Prisma.Decimal(dto.amount),
          paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
          referenceNumber: dto.referenceNumber,
          notes: dto.notes,
          createdBy: userId,
        },
      });

      for (const alloc of dto.allocations) {
        await tx.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            invoiceId: alloc.invoiceId,
            vendorBillId: alloc.vendorBillId,
            amount: new Prisma.Decimal(alloc.amount),
          },
        });

        if (alloc.invoiceId) {
          const invoice = await tx.customerInvoice.findUnique({
            where: { id: alloc.invoiceId },
          });
          if (invoice) {
            const newPaid = Number(invoice.paidAmount) + Number(alloc.amount);
            const isFull = newPaid >= Number(invoice.totalAmount) - 0.01;
            await tx.customerInvoice.update({
              where: { id: alloc.invoiceId },
              data: {
                paidAmount: new Prisma.Decimal(newPaid.toFixed(2)),
                status: isFull ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID,
              },
            });
          }
        }

        if (alloc.vendorBillId) {
          const bill = await tx.vendorBill.findUnique({
            where: { id: alloc.vendorBillId },
          });
          if (bill) {
            const newPaid = Number(bill.paidAmount) + Number(alloc.amount);
            const isFull = newPaid >= Number(bill.totalAmount) - 0.01;
            await tx.vendorBill.update({
              where: { id: alloc.vendorBillId },
              data: {
                paidAmount: new Prisma.Decimal(newPaid.toFixed(2)),
                status: isFull ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID,
              },
            });
          }
        }
      }

      await this.auditService.log({
        organizationId,
        actorId: userId,
        action: 'PAYMENT_RECORDED',
        entityType: 'Payment',
        entityId: payment.id,
        changes: { paymentNumber, amount: dto.amount, type: dto.paymentType },
      });

      return payment;
    });
  }

  async getArAgeing(organizationId: string) {
    const invoices = await this.prisma.customerInvoice.findMany({
      where: {
        organizationId,
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
      },
      include: {
        customer: { select: { id: true, legalName: true } },
      },
    });

    const now = new Date();
    const buckets = {
      current: 0, // 0-30 days
      bucket30_60: 0,
      bucket60_90: 0,
      over90: 0,
      total: 0,
    };

    const customerSummary: Record<
      string,
      { customer: string; current: number; bucket30_60: number; bucket60_90: number; over90: number; total: number }
    > = {};

    for (const inv of invoices) {
      const balance = Math.max(0, Number(inv.totalAmount) - Number(inv.paidAmount));
      if (balance <= 0) continue;

      const dueDate = inv.dueDate || inv.invoiceDate;
      const daysPastDue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

      buckets.total += balance;

      if (!customerSummary[inv.customerId]) {
        customerSummary[inv.customerId] = {
          customer: inv.customer.legalName,
          current: 0,
          bucket30_60: 0,
          bucket60_90: 0,
          over90: 0,
          total: 0,
        };
      }
      customerSummary[inv.customerId].total += balance;

      if (daysPastDue <= 30) {
        buckets.current += balance;
        customerSummary[inv.customerId].current += balance;
      } else if (daysPastDue <= 60) {
        buckets.bucket30_60 += balance;
        customerSummary[inv.customerId].bucket30_60 += balance;
      } else if (daysPastDue <= 90) {
        buckets.bucket60_90 += balance;
        customerSummary[inv.customerId].bucket60_90 += balance;
      } else {
        buckets.over90 += balance;
        customerSummary[inv.customerId].over90 += balance;
      }
    }

    return {
      summary: {
        current: Math.round(buckets.current * 100) / 100,
        bucket30_60: Math.round(buckets.bucket30_60 * 100) / 100,
        bucket60_90: Math.round(buckets.bucket60_90 * 100) / 100,
        over90: Math.round(buckets.over90 * 100) / 100,
        total: Math.round(buckets.total * 100) / 100,
      },
      byCustomer: Object.values(customerSummary).map((c) => ({
        ...c,
        total: Math.round(c.total * 100) / 100,
      })),
    };
  }

  async getApAgeing(organizationId: string) {
    const bills = await this.prisma.vendorBill.findMany({
      where: {
        organizationId,
        status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
      },
      include: {
        vendor: { select: { id: true, legalName: true } },
      },
    });

    const now = new Date();
    const buckets = {
      current: 0,
      bucket30_60: 0,
      bucket60_90: 0,
      over90: 0,
      total: 0,
    };

    for (const bill of bills) {
      const balance = Math.max(0, Number(bill.totalAmount) - Number(bill.paidAmount));
      if (balance <= 0) continue;

      const dueDate = bill.dueDate || bill.billDate;
      const daysPastDue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));

      buckets.total += balance;
      if (daysPastDue <= 30) {
        buckets.current += balance;
      } else if (daysPastDue <= 60) {
        buckets.bucket30_60 += balance;
      } else if (daysPastDue <= 90) {
        buckets.bucket60_90 += balance;
      } else {
        buckets.over90 += balance;
      }
    }

    return {
      current: Math.round(buckets.current * 100) / 100,
      bucket30_60: Math.round(buckets.bucket30_60 * 100) / 100,
      bucket60_90: Math.round(buckets.bucket60_90 * 100) / 100,
      over90: Math.round(buckets.over90 * 100) / 100,
      total: Math.round(buckets.total * 100) / 100,
    };
  }

  async getFinanceSummary(organizationId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [monthInvoices, monthPayments, allInvoices, allBills] = await Promise.all([
      this.prisma.customerInvoice.findMany({
        where: { organizationId, invoiceDate: { gte: startOfMonth } },
      }),
      this.prisma.payment.findMany({
        where: {
          organizationId,
          paymentType: PaymentType.RECEIVED,
          paymentDate: { gte: startOfMonth },
        },
      }),
      this.prisma.customerInvoice.findMany({
        where: {
          organizationId,
          status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
        },
      }),
      this.prisma.vendorBill.findMany({
        where: {
          organizationId,
          status: { in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
        },
      }),
    ]);

    const invoicedThisMonth = monthInvoices.reduce((s, i) => s + Number(i.totalAmount), 0);
    const collectionsThisMonth = monthPayments.reduce((s, p) => s + Number(p.amount), 0);
    const totalAr = allInvoices.reduce(
      (s, i) => s + Math.max(0, Number(i.totalAmount) - Number(i.paidAmount)),
      0,
    );
    const totalAp = allBills.reduce(
      (s, b) => s + Math.max(0, Number(b.totalAmount) - Number(b.paidAmount)),
      0,
    );

    return {
      invoicedThisMonth: Math.round(invoicedThisMonth * 100) / 100,
      collectionsThisMonth: Math.round(collectionsThisMonth * 100) / 100,
      totalReceivables: Math.round(totalAr * 100) / 100,
      totalPayables: Math.round(totalAp * 100) / 100,
    };
  }

  async exportCsv(organizationId: string) {
    const invoices = await this.prisma.customerInvoice.findMany({
      where: { organizationId },
      include: { customer: true },
      orderBy: { invoiceDate: 'desc' },
    });

    const headers = [
      'Invoice Number',
      'Customer',
      'Date',
      'Due Date',
      'Status',
      'Subtotal (INR)',
      'Tax (INR)',
      'Total Amount (INR)',
      'Paid Amount (INR)',
      'Balance (INR)',
    ];

    const rows = invoices.map((inv) => [
      `"${inv.invoiceNumber}"`,
      `"${inv.customer.legalName}"`,
      `"${inv.invoiceDate.toISOString().split('T')[0]}"`,
      `"${inv.dueDate ? inv.dueDate.toISOString().split('T')[0] : ''}"`,
      `"${inv.status}"`,
      inv.subtotal.toString(),
      inv.taxAmount.toString(),
      inv.totalAmount.toString(),
      inv.paidAmount.toString(),
      (Number(inv.totalAmount) - Number(inv.paidAmount)).toFixed(2),
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
