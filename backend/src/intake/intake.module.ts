import { Module } from '@nestjs/common';
import { IntakeController } from './intake.controller.js';
import { IntakeService } from './intake.service.js';
import { DocumentExtractorService } from './providers/document-extractor.service.js';
import { AuditModule } from '../audit/audit.module.js';

@Module({
  imports: [AuditModule],
  controllers: [IntakeController],
  providers: [IntakeService, DocumentExtractorService],
  exports: [IntakeService],
})
export class IntakeModule {}
