import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { SalesOrdersService } from '../src/sales-orders/sales-orders.service.js';
import { PurchaseOrdersService } from '../src/purchase-orders/purchase-orders.service.js';
import { InventoryService } from '../src/inventory/inventory.service.js';
import { FinanceService } from '../src/finance/finance.service.js';
import { IntakeService } from '../src/intake/intake.service.js';
import { FulfilmentService } from '../src/fulfilment/fulfilment.service.js';
import { OrderStatus, PurchaseOrderStatus, InvoiceStatus } from '@prisma/client';

describe('Nudge ERP Core Workflow E2E Integration', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let salesOrdersService: SalesOrdersService;
  let poService: PurchaseOrdersService;
  let inventoryService: InventoryService;
  let financeService: FinanceService;
  let intakeService: IntakeService;
  let fulfilmentService: FulfilmentService;

  let orgId: string;
  let testUserId: string;
  let customerId: string;
  let vendorId: string;
  let warehouseId: string;
  let productId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    prisma = app.get(PrismaService);
    salesOrdersService = app.get(SalesOrdersService);
    poService = app.get(PurchaseOrdersService);
    inventoryService = app.get(InventoryService);
    financeService = app.get(FinanceService);
    intakeService = app.get(IntakeService);
    fulfilmentService = app.get(FulfilmentService);

    // Retrieve seeded demo data
    const org = await prisma.organization.findFirst({
      where: { name: 'Sharma FMCG Distributors' },
    });
    expect(org).toBeDefined();
    orgId = org!.id;

    const user = await prisma.user.findFirst({
      where: { email: 'admin@nudge-demo.com' },
    });
    expect(user).toBeDefined();
    testUserId = user!.id;

    const customer = await prisma.customer.findFirst({
      where: { organizationId: orgId },
    });
    expect(customer).toBeDefined();
    customerId = customer!.id;

    const vendor = await prisma.vendor.findFirst({
      where: { organizationId: orgId },
    });
    expect(vendor).toBeDefined();
    vendorId = vendor!.id;

    const warehouse = await prisma.warehouse.findFirst({
      where: { organizationId: orgId },
    });
    expect(warehouse).toBeDefined();
    warehouseId = warehouse!.id;

    const product = await prisma.product.findFirst({
      where: { organizationId: orgId },
    });
    expect(product).toBeDefined();
    productId = product!.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Document Intake: processes uploaded PO and detects duplicates', async () => {
    const uniqueId = Date.now();
    const csvContent = `PO Number: TEST-EXT-${uniqueId}\nCustomer: Test Customer\nSKU,Name,Quantity,Price\nSKU-MAGGI-70G,Maggi Noodles,50,14.0`;
    const buffer = Buffer.from(csvContent, 'utf-8');

    const importRecord = await intakeService.processUploadedFile(
      orgId,
      { buffer, originalname: `test_po_${uniqueId}.csv` },
      testUserId,
    );

    expect(importRecord).toBeDefined();
    expect(importRecord.attachmentName).toBe(`test_po_${uniqueId}.csv`);
    expect(importRecord.status).toBe('REVIEW_REQUIRED');

    // Duplicate upload of exact same buffer should throw ConflictException
    await expect(
      intakeService.processUploadedFile(
        orgId,
        { buffer, originalname: `test_po_${uniqueId}_copy.csv` },
        testUserId,
      ),
    ).rejects.toThrow();
  });

  it('2. Sales Order: creates order and enforces externalOrderId idempotency', async () => {
    const externalOrderId = `EXT-${Date.now()}`;

    const order = await salesOrdersService.create(
      orgId,
      {
        customerId,
        externalOrderId,
        notes: 'Test Order for verification',
        lines: [
          {
            productId,
            quantity: 20,
            unitPrice: 100,
            discount: 0,
            taxRate: 18,
          },
        ],
      },
      testUserId,
    );

    expect(order.orderNumber).toMatch(/^SO-/);
    expect(Number(order.subtotal)).toBe(2000);
    expect(Number(order.taxAmount)).toBe(360);
    expect(Number(order.totalAmount)).toBe(2360);
    expect(order.status).toBe(OrderStatus.PENDING_REVIEW);

    // Re-creating same external order must fail with conflict
    await expect(
      salesOrdersService.create(
        orgId,
        {
          customerId,
          externalOrderId,
          lines: [{ productId, quantity: 1, unitPrice: 100 }],
        },
        testUserId,
      ),
    ).rejects.toThrow();
  });

  it('3. Procurement & Goods Receipt: receives stock and creates inventory ledger entries', async () => {
    // Create PO
    const po = await poService.create(
      orgId,
      {
        vendorId,
        lines: [
          {
            productId,
            quantity: 100,
            unitCost: 80,
            taxRate: 18,
          },
        ],
      },
      testUserId,
    );

    expect(po.poNumber).toMatch(/^PO-/);
    expect(po.status).toBe(PurchaseOrderStatus.DRAFT);

    // Approve PO
    await poService.updateStatus(
      orgId,
      po.id,
      { status: PurchaseOrderStatus.APPROVED },
      testUserId,
    );

    // Record partial Goods Receipt (50 units)
    const grnResult = await poService.recordGoodsReceipt(
      orgId,
      po.id,
      {
        warehouseId,
        notes: 'Delivery Challan #999',
        lines: [
          {
            purchaseOrderLineId: po.lines[0].id,
            receivedQty: 50,
            acceptedQty: 50,
            batchNumber: 'TEST-BATCH-001',
            expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
            unitCost: 82,
          },
        ],
      },
      testUserId,
    );

    expect(grnResult.receipt.receiptNumber).toMatch(/^GRN-/);
    expect(grnResult.purchaseOrder.status).toBe(PurchaseOrderStatus.PARTIALLY_RECEIVED);

    // Verify Inventory Ledger entry
    const ledger = await inventoryService.getLedger(orgId, {
      productId,
      warehouseId,
      limit: 5,
    });
    expect(ledger.data.length).toBeGreaterThan(0);
    expect(ledger.data[0].transactionType).toBe('GOODS_RECEIPT');
  });

  it('4. Sales Fulfilment & Dispatch: supports partial and full fulfilment with fill rate tracking', async () => {
    // Create approved sales order for 10 units
    const order = await salesOrdersService.create(
      orgId,
      {
        customerId,
        lines: [
          {
            productId,
            quantity: 10,
            unitPrice: 120,
            taxRate: 18,
          },
        ],
      },
      testUserId,
    );

    await salesOrdersService.updateStatus(
      orgId,
      order.id,
      { status: OrderStatus.APPROVED },
      testUserId,
    );

    // First partial shipment (6 units)
    const dispatch1 = await salesOrdersService.fulfillOrder(
      orgId,
      order.id,
      {
        warehouseId,
        carrier: 'Blue Dart',
        trackingNumber: 'BD123456',
        items: [
          {
            salesOrderLineId: order.lines[0].id,
            quantity: 6,
          },
        ],
      },
      testUserId,
    );

    expect(dispatch1.shipment.shipmentNumber).toMatch(/^SHP-/);
    expect(dispatch1.order.status).toBe(OrderStatus.PARTIALLY_FULFILLED);

    // Check fill rate metrics
    const fillRate1 = await fulfilmentService.getFillRateMetrics(orgId);
    expect(fillRate1.fillRatePercent).toBeGreaterThan(0);

    // Final shipment (remaining 4 units)
    const dispatch2 = await salesOrdersService.fulfillOrder(
      orgId,
      order.id,
      {
        warehouseId,
        carrier: 'Blue Dart',
        items: [
          {
            salesOrderLineId: order.lines[0].id,
            quantity: 4,
          },
        ],
      },
      testUserId,
    );

    expect(dispatch2.order.status).toBe(OrderStatus.FULFILLED);
  });

  it('5. Invoicing & Payment Reconciliation: tracks customer payment and outstanding balance', async () => {
    // Generate invoice from sales order
    const order = await salesOrdersService.create(
      orgId,
      {
        customerId,
        lines: [{ productId, quantity: 5, unitPrice: 200, taxRate: 18 }],
      },
      testUserId,
    );

    const invoice = await salesOrdersService.generateInvoice(orgId, order.id, testUserId);
    expect(invoice.invoiceNumber).toMatch(/^INV-/);
    expect(invoice.status).toBe(InvoiceStatus.ISSUED);
    expect(Number(invoice.paidAmount)).toBe(0);

    const totalToPay = Number(invoice.totalAmount);

    // Record partial payment
    const partialPayment = await financeService.recordPayment(
      orgId,
      {
        paymentType: 'RECEIVED',
        paymentMethod: 'UPI',
        amount: totalToPay / 2,
        referenceNumber: 'UPI982374',
        allocations: [{ invoiceId: invoice.id, amount: totalToPay / 2 }],
      },
      testUserId,
    );

    expect(partialPayment).toBeDefined();
    const updatedInvoice1 = await financeService.getInvoice(orgId, invoice.id);
    expect(updatedInvoice1.status).toBe(InvoiceStatus.PARTIALLY_PAID);

    // Pay remaining balance
    await financeService.recordPayment(
      orgId,
      {
        paymentType: 'RECEIVED',
        paymentMethod: 'BANK_TRANSFER',
        amount: totalToPay / 2,
        allocations: [{ invoiceId: invoice.id, amount: totalToPay / 2 }],
      },
      testUserId,
    );

    const updatedInvoice2 = await financeService.getInvoice(orgId, invoice.id);
    expect(updatedInvoice2.status).toBe(InvoiceStatus.PAID);
    expect(Number(updatedInvoice2.paidAmount)).toBeCloseTo(totalToPay);
  });

  it('6. Tenant Isolation: prevents cross-organization data leakage', async () => {
    // Create a second organization
    const org2 = await prisma.organization.create({
      data: {
        name: 'Another Competitor Org',
        isDemo: true,
      },
    });

    // Querying with org2 id should not return Sharma FMCG orders
    const ordersForOrg2 = await salesOrdersService.findAll(org2.id, {});
    expect(ordersForOrg2.data.length).toBe(0);

    // Trying to get Sharma order with org2 id should throw NotFoundException
    const sharmaOrder = await prisma.salesOrder.findFirst({
      where: { organizationId: orgId },
    });
    expect(sharmaOrder).toBeDefined();

    await expect(
      salesOrdersService.findOne(org2.id, sharmaOrder!.id),
    ).rejects.toThrow();

    // Clean up org2
    await prisma.organization.delete({ where: { id: org2.id } });
  });
});
