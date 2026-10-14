import { Module } from '@nestjs/common';
import { SalesOrdersController } from './sales-orders.controller.js';
import { SalesOrdersService } from './sales-orders.service.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [SalesOrdersController],
  providers: [SalesOrdersService],
  exports: [SalesOrdersService],
})
export class SalesOrdersModule {}
