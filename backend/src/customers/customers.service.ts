import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';
import { QueryCustomerDto } from './dto/query-customer.dto.js';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, query: QueryCustomerDto) {
    const { page = 1, limit = 20, search, channelType, isActive, city, state } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      organizationId,
      ...(isActive !== undefined ? { isActive } : {}),
      ...(channelType ? { channelType } : {}),
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
              { externalId: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { legalName: 'asc' },
        include: {
          _count: {
            select: {
              salesOrders: true,
              invoices: true,
            },
          },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data: customers,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(organizationId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, organizationId },
      include: {
        salesOrders: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalAmount: true,
            orderDate: true,
          },
        },
        invoices: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            totalAmount: true,
            paidAmount: true,
            dueDate: true,
          },
        },
        _count: {
          select: {
            salesOrders: true,
            invoices: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID '${id}' not found`);
    }

    return customer;
  }

  async create(organizationId: string, userId: string, dto: CreateCustomerDto) {
    if (dto.externalId) {
      const existing = await this.prisma.customer.findUnique({
        where: {
          organizationId_externalId: {
            organizationId,
            externalId: dto.externalId.trim(),
          },
        },
      });

      if (existing) {
        throw new ConflictException(`Customer with external ID '${dto.externalId}' already exists`);
      }
    }

    return this.prisma.customer.create({
      data: {
        organizationId,
        legalName: dto.legalName.trim(),
        tradingName: dto.tradingName?.trim(),
        contactPerson: dto.contactPerson?.trim(),
        email: dto.email?.toLowerCase().trim(),
        phone: dto.phone?.trim(),
        billingAddress: dto.billingAddress?.trim(),
        deliveryAddress: dto.deliveryAddress?.trim(),
        city: dto.city?.trim(),
        state: dto.state?.trim(),
        pincode: dto.pincode?.trim(),
        gstin: dto.gstin?.toUpperCase().trim(),
        channelType: dto.channelType ?? 'DIRECT',
        externalId: dto.externalId?.trim(),
        paymentTermDays: dto.paymentTermDays ?? 30,
        notes: dto.notes?.trim(),
        createdBy: userId,
      },
    });
  }

  async update(organizationId: string, id: string, dto: UpdateCustomerDto) {
    const existing = await this.prisma.customer.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Customer with ID '${id}' not found`);
    }

    if (dto.externalId && dto.externalId.trim() !== existing.externalId) {
      const conflict = await this.prisma.customer.findUnique({
        where: {
          organizationId_externalId: {
            organizationId,
            externalId: dto.externalId.trim(),
          },
        },
      });

      if (conflict && conflict.id !== id) {
        throw new ConflictException(`External ID '${dto.externalId}' is already assigned to another customer`);
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...(dto.legalName ? { legalName: dto.legalName.trim() } : {}),
        ...(dto.tradingName !== undefined ? { tradingName: dto.tradingName?.trim() } : {}),
        ...(dto.contactPerson !== undefined ? { contactPerson: dto.contactPerson?.trim() } : {}),
        ...(dto.email !== undefined ? { email: dto.email?.toLowerCase().trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone?.trim() } : {}),
        ...(dto.billingAddress !== undefined ? { billingAddress: dto.billingAddress?.trim() } : {}),
        ...(dto.deliveryAddress !== undefined ? { deliveryAddress: dto.deliveryAddress?.trim() } : {}),
        ...(dto.city !== undefined ? { city: dto.city?.trim() } : {}),
        ...(dto.state !== undefined ? { state: dto.state?.trim() } : {}),
        ...(dto.pincode !== undefined ? { pincode: dto.pincode?.trim() } : {}),
        ...(dto.gstin !== undefined ? { gstin: dto.gstin?.toUpperCase().trim() } : {}),
        ...(dto.channelType ? { channelType: dto.channelType } : {}),
        ...(dto.externalId !== undefined ? { externalId: dto.externalId?.trim() } : {}),
        ...(dto.paymentTermDays !== undefined ? { paymentTermDays: dto.paymentTermDays } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes?.trim() } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });
  }

  async remove(organizationId: string, id: string) {
    const existing = await this.prisma.customer.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException(`Customer with ID '${id}' not found`);
    }

    return this.prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
