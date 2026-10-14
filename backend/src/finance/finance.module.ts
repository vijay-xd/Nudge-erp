import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller.js';
import { FinanceService } from './finance.service.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [FinanceController],
  providers: [FinanceService],
  exports: [FinanceService],
})
export class FinanceModule {}
