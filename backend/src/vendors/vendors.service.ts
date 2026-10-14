import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateVendorDto } from './dto/create-vendor.dto.js';
import { UpdateVendorDto } from './dto/update-vendor.dto.js';
import { QueryVendorDto } from './dto/query-vendor.dto.js';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, query: QueryVendorDto) {
    const { page = 1, limit = 20, search, isActive, city, state } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.VendorWhereInput = {
      organizationId,
      ...(isActive !== undefined ? { isActive } : {}),
      ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
      ...(state ? { state: { equals: state, mode: 'insensitive' } } : {}),
      ...(search
        ? {
            OR: [
              { legalName: { contains: search, mode: 'insensitive' } },
              { tradingName: { contains: search, mode: 'insensitive' } },
              { contactPerson: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { gstin: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { legalName: 'asc' },
        include: {
          _count: {
            select: {
              purchaseOrders: true,
              productVendors: true,
              vendorBills: true,
            },
          },
        },
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return {
      data: vendors,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(organizationId: string, id: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: { id, organizationId },
      include: {
        productVendors: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true,
                unitOfMeasure: true,
                sellingPrice: true,
              },
            },
          },
        },
        purchaseOrders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            poNumber: true,
            status: true,
            totalAmount: true,
            orderDate: true,
          },
        },
        vendorBills: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            billNumber: true,
            status: true,
            totalAmount: true,
            paidAmount: true,
            dueDate: true,
          },
        },
        _count: {
          select: {
            purchaseOrders: true,
            productVendors: true,
            vendorBills: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID '${id}' not found`);
    }

    return vendor;
  }

  async create(organizationId: string, userId: string, dto: CreateVendorDto) {
    return this.prisma.vendor.create({
      data: {
        organizationId,
        legalName: dto.legalName.trim(),
        tradingName: dto.tradingName?.trim(),
        contactPerson: dto.contactPerson?.trim(),
        email: dto.email?.toLowerCase().trim(),
        phone: dto.phone?.trim(),
        address: dto.address?.trim(),
        city: dto.city?.trim(),
        state: dto.state?.trim(),
        pincode: dto.pincode?.trim(),
        gstin: dto.gstin?.toUpperCase().trim(),
        panNumber: dto.panNumber?.toUpperCase().trim(),
        paymentTermDays: dto.paymentTermDays ?? 30,
        leadTimeDays: dto.leadTimeDays ?? 7,
        bankName: dto.bankName?.trim(),
        bankAccount: dto.bankAccount?.trim(),
        bankIfsc: dto.bankIfsc?.toUpperCase().trim(),
        notes: dto.notes?.trim(),
        createdBy: userId,
      },
    });
  }

  async update(organizationId: string, id: string, dto: UpdateVendorDto) {
    const existing = await this.prisma.vendor.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Vendor with ID '${id}' not found`);
    }

    return this.prisma.vendor.update({
      where: { id },
      data: {
        ...(dto.legalName ? { legalName: dto.legalName.trim() } : {}),
        ...(dto.tradingName !== undefined ? { tradingName: dto.tradingName?.trim() } : {}),
        ...(dto.contactPerson !== undefined ? { contactPerson: dto.contactPerson?.trim() } : {}),
        ...(dto.email !== undefined ? { email: dto.email?.toLowerCase().trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone?.trim() } : {}),
        ...(dto.address !== undefined ? { address: dto.address?.trim() } : {}),
        ...(dto.city !== undefined ? { city: dto.city?.trim() } : {}),
        ...(dto.state !== undefined ? { state: dto.state?.trim() } : {}),
        ...(dto.pincode !== undefined ? { pincode: dto.pincode?.trim() } : {}),
        ...(dto.gstin !== undefined ? { gstin: dto.gstin?.toUpperCase().trim() } : {}),
        ...(dto.panNumber !== undefined ? { panNumber: dto.panNumber?.toUpperCase().trim() } : {}),
        ...(dto.paymentTermDays !== undefined ? { paymentTermDays: dto.paymentTermDays } : {}),
        ...(dto.leadTimeDays !== undefined ? { leadTimeDays: dto.leadTimeDays } : {}),
        ...(dto.bankName !== undefined ? { bankName: dto.bankName?.trim() } : {}),
        ...(dto.bankAccount !== undefined ? { bankAccount: dto.bankAccount?.trim() } : {}),
        ...(dto.bankIfsc !== undefined ? { bankIfsc: dto.bankIfsc?.toUpperCase().trim() } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async remove(organizationId: string, id: string) {
    const existing = await this.prisma.vendor.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Vendor with ID '${id}' not found`);
    }

    // Soft delete / archive
    return this.prisma.vendor.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
