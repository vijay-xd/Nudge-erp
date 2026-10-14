import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { ImportStatus, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { DocumentExtractorService } from './providers/document-extractor.service.js';
import { ApproveImportDto, QueryImportDto } from './dto/intake.dto.js';
import { AuditService } from '../audit/audit.service.js';

@Injectable()
export class IntakeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly extractor: DocumentExtractorService,
    private readonly auditService: AuditService,
  ) {}

  async processUploadedFile(
    organizationId: string,
    file: { buffer: Buffer; originalname: string },
    userId?: string,
  ) {
    const hash = createHash('sha256').update(file.buffer).digest('hex');

    // Duplicate check on attachment hash
    const existing = await this.prisma.emailImport.findFirst({
      where: { organizationId, attachmentHash: hash },
    });
    if (existing) {
      throw new ConflictException(
        `This document has already been imported on ${existing.createdAt.toISOString().split('T')[0]} (Status: ${existing.status})`,
      );
    }

    // Extract structured fields
    const extraction = await this.extractor.extract(file.buffer, file.originalname);

    // Match products against internal SKU / barcode / ChannelSKUMap
    const enrichedLines = await Promise.all(
      extraction.items.map(async (item) => {
        let matchedProduct = await this.prisma.product.findFirst({
          where: {
            organizationId,
            OR: [
              { sku: { equals: item.rawSku, mode: 'insensitive' } },
              ...(item.barcode ? [{ barcode: item.barcode }] : []),
              { name: { contains: item.rawName.split(' ')[0], mode: 'insensitive' } },
            ],
          },
          include: {
            inventoryBatches: { select: { quantity: true, reservedQty: true } },
          },
        });

        if (!matchedProduct) {
          const skuMap = await this.prisma.channelSKUMap.findFirst({
            where: { externalSku: item.rawSku },
            include: {
              product: {
                include: { inventoryBatches: { select: { quantity: true, reservedQty: true } } },
              },
            },
          });
          if (skuMap) {
            matchedProduct = skuMap.product;
          }
        }

        const onHand = matchedProduct
          ? matchedProduct.inventoryBatches.reduce(
              (sum, b) => sum + (Number(b.quantity) - Number(b.reservedQty)),
              0,
            )
          : 0;

        return {
          ...item,
          matchedProductId: matchedProduct?.id || null,
          matchedProductName: matchedProduct?.name || null,
          matchedProductSku: matchedProduct?.sku || null,
          availableStock: Math.max(0, onHand),
          unitSellingPrice: matchedProduct?.sellingPrice
            ? Number(matchedProduct.sellingPrice)
            : item.unitPrice,
          isMatched: !!matchedProduct,
        };
      }),
    );

    const allMatched = enrichedLines.every((l) => l.isMatched);
    const confidenceScore = allMatched
      ? extraction.confidenceScore
      : Math.min(0.65, extraction.confidenceScore);

    const messageId = `UPLOAD-${Date.now()}-${hash.slice(0, 8)}`;

    const importRecord = await this.prisma.emailImport.create({
      data: {
        organizationId,
        messageId,
        subject: `Document Intake: ${file.originalname}`,
        attachmentName: file.originalname,
        attachmentHash: hash,
        status: allMatched ? ImportStatus.REVIEW_REQUIRED : ImportStatus.REVIEW_REQUIRED,
        confidenceScore: new Prisma.Decimal(confidenceScore.toFixed(2)),
        extractedData: {
          ...extraction,
          items: enrichedLines,
        },
      },
    });

    await this.auditService.log({
      organizationId,
      actorId: userId,
      action: 'DOCUMENT_INTAKE_PROCESSED',
      entityType: 'EmailImport',
      entityId: importRecord.id,
      changes: {
        fileName: file.originalname,
        confidenceScore,
        linesCount: enrichedLines.length,
      },
    });

    return importRecord;
  }

  async findAll(organizationId: string, query: QueryImportDto) {
    const { page = 1, limit = 20, status, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.EmailImportWhereInput = {
      organizationId,
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { messageId: { contains: search, mode: 'insensitive' } },
              { attachmentName: { contains: search, mode: 'insensitive' } },
              { subject: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [imports, total] = await Promise.all([
      this.prisma.emailImport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { salesOrders: true } },
        },
      }),
      this.prisma.emailImport.count({ where }),
    ]);

    return {
      data: imports,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(organizationId: string, id: string) {
    const record = await this.prisma.emailImport.findFirst({
      where: { id, organizationId },
      include: {
        salesOrders: {
          include: { customer: true },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`Import #${id} not found`);
    }

    return record;
  }

  async approveImport(organizationId: string, id: string, dto: ApproveImportDto, userId?: string) {
    const importRecord = await this.findOne(organizationId, id);

    if (importRecord.status === ImportStatus.APPROVED) {
      throw new ConflictException('This import has already been approved into a Sales Order');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Generate Order Number
      const datePrefix = new Date().toISOString().slice(0, 7).replace('-', '');
      const count = await tx.salesOrder.count({ where: { organizationId } });
      const orderNumber = `SO-${datePrefix}-${String(count + 1).padStart(4, '0')}`;

      // 2. Line calculations
      let subtotal = 0;
      let taxAmount = 0;

      const linesData = dto.lines.map((l) => {
        const lineSubtotal = Number(l.unitPrice) * Number(l.quantity);
        const lineTax = lineSubtotal * (Number(l.taxRate || 18) / 100);
        const lineTotal = lineSubtotal + lineTax;

        subtotal += lineSubtotal;
        taxAmount += lineTax;

        return {
          productId: l.productId,
          quantity: new Prisma.Decimal(l.quantity),
          unitPrice: new Prisma.Decimal(l.unitPrice),
          taxRate: new Prisma.Decimal(l.taxRate || 18),
          taxAmount: new Prisma.Decimal(lineTax.toFixed(2)),
          lineTotal: new Prisma.Decimal(lineTotal.toFixed(2)),
        };
      });

      const totalAmount = subtotal + taxAmount;

      // 3. Create Sales Order
      const salesOrder = await tx.salesOrder.create({
        data: {
          organizationId,
          orderNumber,
          customerId: dto.customerId,
          channelId: dto.channelId,
          externalOrderId: dto.externalOrderId,
          orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
          expectedDelivery: dto.expectedDelivery ? new Date(dto.expectedDelivery) : null,
          status: OrderStatus.APPROVED,
          source: 'gmail_ai_intake',
          subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
          taxAmount: new Prisma.Decimal(taxAmount.toFixed(2)),
          totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)),
          approvedBy: userId,
          approvedAt: new Date(),
          createdBy: userId,
          emailImportId: id,
          lines: {
            create: linesData,
          },
        },
        include: { lines: true, customer: true },
      });

      // 4. Update EmailImport status
      await tx.emailImport.update({
        where: { id },
        data: {
          status: ImportStatus.APPROVED,
          reviewedBy: userId,
          reviewedAt: new Date(),
        },
      });

      await this.auditService.log({
        organizationId,
        actorId: userId,
        action: 'IMPORT_APPROVED_TO_SALES_ORDER',
        entityType: 'SalesOrder',
        entityId: salesOrder.id,
        changes: { importId: id, orderNumber, totalAmount },
      });

      return {
        salesOrder,
        importRecord: { id, status: ImportStatus.APPROVED },
      };
    });
  }

  async rejectImport(organizationId: string, id: string, userId?: string) {
    const importRecord = await this.findOne(organizationId, id);

    const updated = await this.prisma.emailImport.update({
      where: { id },
      data: {
        status: ImportStatus.REJECTED,
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
    });

    await this.auditService.log({
      organizationId,
      actorId: userId,
      action: 'IMPORT_REJECTED',
      entityType: 'EmailImport',
      entityId: id,
      changes: { previous: importRecord.status, current: ImportStatus.REJECTED },
    });

    return updated;
  }

  // Gmail OAuth and Synchronization
  async getGmailStatus(organizationId: string) {
    const conn = await this.prisma.integrationConnection.findUnique({
      where: {
        organizationId_provider: {
          organizationId,
          provider: 'GMAIL',
        },
      },
    });

    const isLiveConfigured = !!process.env.GOOGLE_CLIENT_ID;

    return {
      isConfigured: isLiveConfigured,
      isConnected: conn?.isActive || false,
      accountEmail: conn?.accountEmail || (conn?.isActive ? 'orders@fmcg-distributor.in' : null),
      lastSyncAt: conn?.lastSyncAt,
      mode: isLiveConfigured ? 'LIVE_OAUTH' : 'MOCK_DEV_MODE',
      supportedChannels: ['Blinkit', 'Zepto', 'Swiggy Instamart', 'Direct Customers'],
    };
  }

  async connectGmail(organizationId: string) {
    const isLiveConfigured = !!process.env.GOOGLE_CLIENT_ID;

    if (isLiveConfigured) {
      return {
        authUrl: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/gmail.readonly&access_type=offline`,
        isMock: false,
      };
    }

    // Connect mock development provider
    await this.prisma.integrationConnection.upsert({
      where: {
        organizationId_provider: {
          organizationId,
          provider: 'GMAIL',
        },
      },
      update: {
        isActive: true,
        accountEmail: 'orders@fmcg-distributor.in',
        lastSyncAt: new Date(),
      },
      create: {
        organizationId,
        provider: 'GMAIL',
        accountEmail: 'orders@fmcg-distributor.in',
        isActive: true,
        lastSyncAt: new Date(),
      },
    });

    return {
      success: true,
      isMock: true,
      message: 'Connected in development mock mode (orders@fmcg-distributor.in)',
    };
  }

  async syncGmail(organizationId: string, userId?: string) {
    const conn = await this.prisma.integrationConnection.findUnique({
      where: {
        organizationId_provider: {
          organizationId,
          provider: 'GMAIL',
        },
      },
    });

    if (!conn || !conn.isActive) {
      throw new BadRequestException('Gmail integration is not connected');
    }

    // Update last sync timestamp
    await this.prisma.integrationConnection.update({
      where: { id: conn.id },
      data: { lastSyncAt: new Date() },
    });

    // Simulate discovering incoming PO emails
    const timestamp = Date.now();
    const channels = ['BLINKIT', 'ZEPTO', 'SWIGGY_INSTAMART'];
    const chosenChannel = channels[Math.floor(Math.random() * channels.length)];
    const messageId = `GMAIL-MSG-${chosenChannel}-${timestamp}`;

    const sampleCsv = `PO Number: ${chosenChannel}-PO-${timestamp}\nCustomer: ${chosenChannel} Commerce\nSKU,Name,Quantity,Price\nSKU-MAGGI-70G,Maggi 2-Minute Noodles 70g,36,14.0\nSKU-AMUL-BUTTER-500,Amul Butter 500g,15,255.0`;

    const result = await this.processUploadedFile(
      organizationId,
      {
        buffer: Buffer.from(sampleCsv, 'utf-8'),
        originalname: `${chosenChannel}_PO_${timestamp}.csv`,
      },
      userId,
    );

    return {
      message: `Synced with mailbox. 1 new purchase order extracted from ${chosenChannel}`,
      importRecord: result,
    };
  }

  async disconnectGmail(organizationId: string) {
    await this.prisma.integrationConnection.updateMany({
      where: { organizationId, provider: 'GMAIL' },
      data: { isActive: false },
    });
    return { success: true, message: 'Disconnected Gmail integration' };
  }
}
