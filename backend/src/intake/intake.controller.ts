import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { OrgId } from '../auth/decorators/org-id.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/interfaces/auth-user.interface.js';
import { IntakeService } from './intake.service.js';
import { ApproveImportDto, QueryImportDto } from './dto/intake.dto.js';

@ApiTags('Document Intake & Gmail Integration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('intake')
export class IntakeController {
  constructor(private readonly intakeService: IntakeService) {}

  @Post('upload')
  @Roles(UserRole.ORG_ADMIN, UserRole.SALES)
  @ApiOperation({ summary: 'Upload customer PO document (PDF, CSV, XLSX) for AI extraction' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @OrgId() orgId: string,
    @UploadedFile() file: any,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('Please provide a document file to upload');
    }
    return this.intakeService.processUploadedFile(orgId, file, user.userId);
  }

  @Get('imports')
  @ApiOperation({ summary: 'List all imported document purchase orders' })
  async getImports(@OrgId() orgId: string, @Query() query: QueryImportDto) {
    return this.intakeService.findAll(orgId, query);
  }

  @Get('imports/:id')
  @ApiOperation({ summary: 'Get details of an extraction for review' })
  async getImport(@OrgId() orgId: string, @Param('id') id: string) {
    return this.intakeService.findOne(orgId, id);
  }

  @Post('imports/:id/approve')
  @Roles(UserRole.ORG_ADMIN, UserRole.SALES)
  @ApiOperation({ summary: 'Human approval: convert reviewed extraction into an active Sales Order' })
  async approveImport(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: ApproveImportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.intakeService.approveImport(orgId, id, dto, user.userId);
  }

  @Post('imports/:id/reject')
  @Roles(UserRole.ORG_ADMIN, UserRole.SALES)
  @ApiOperation({ summary: 'Reject an imported order document' })
  async rejectImport(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.intakeService.rejectImport(orgId, id, user.userId);
  }

  // Gmail integration endpoints
  @Get('gmail/status')
  @ApiOperation({ summary: 'Check Gmail OAuth connection status' })
  async getGmailStatus(@OrgId() orgId: string) {
    return this.intakeService.getGmailStatus(orgId);
  }

  @Post('gmail/connect')
  @Roles(UserRole.ORG_ADMIN)
  @ApiOperation({ summary: 'Connect Gmail mailbox (initiates OAuth or mock connection)' })
  async connectGmail(@OrgId() orgId: string) {
    return this.intakeService.connectGmail(orgId);
  }

  @Post('gmail/sync')
  @Roles(UserRole.ORG_ADMIN, UserRole.SALES)
  @ApiOperation({ summary: 'Poll Gmail mailbox for new customer purchase orders' })
  async syncGmail(@OrgId() orgId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.intakeService.syncGmail(orgId, user.userId);
  }

  @Post('gmail/disconnect')
  @Roles(UserRole.ORG_ADMIN)
  @ApiOperation({ summary: 'Disconnect Gmail integration' })
  async disconnectGmail(@OrgId() orgId: string) {
    return this.intakeService.disconnectGmail(orgId);
  }
}
