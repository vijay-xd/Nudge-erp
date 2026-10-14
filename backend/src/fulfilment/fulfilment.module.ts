import { Module } from '@nestjs/common';
import { FulfilmentController } from './fulfilment.controller.js';
import { FulfilmentService } from './fulfilment.service.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [FulfilmentController],
  providers: [FulfilmentService],
  exports: [FulfilmentService],
})
export class FulfilmentModule {}
