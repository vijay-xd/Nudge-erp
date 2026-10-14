import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { QueryAuditDto } from './dto/query-audit.dto.js';

export interface CreateAuditEntryInput {
  organizationId: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logAction(input: CreateAuditEntryInput) {
    return this.prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        changes: input.changes ? (input.changes as Prisma.InputJsonValue) : Prisma.JsonNull,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });
  }

  async log(input: CreateAuditEntryInput) {
    return this.logAction(input);
  }

  async findAll(organizationId: string, query: QueryAuditDto) {
    const { page = 1, limit = 20, entityType, entityId, actorId, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {
      organizationId,
      ...(entityType ? { entityType: { equals: entityType, mode: 'insensitive' } } : {}),
      ...(entityId ? { entityId } : {}),
      ...(actorId ? { actorId } : {}),
      ...(search
        ? {
            OR: [
              { action: { contains: search, mode: 'insensitive' } },
              { entityType: { contains: search, mode: 'insensitive' } },
              { entityId: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
