import { Module } from '@nestjs/common';
import { PurchaseOrdersController } from './purchase-orders.controller.js';
import { PurchaseOrdersService } from './purchase-orders.service.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}
