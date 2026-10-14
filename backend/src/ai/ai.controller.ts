import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OrgId } from '../auth/decorators/org-id.decorator.js';
import { AiService } from './ai.service.js';
import { AiQueryDto } from './dto/ai-query.dto.js';

@ApiTags('AI Copilot & Search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('company-context')
  @ApiOperation({ summary: 'Get live company profile, database metrics, and curated FAQs' })
  @ApiResponse({ status: 200, description: 'Company context retrieved' })
  async getCompanyContext(@OrgId() organizationId: string) {
    return this.aiService.getCompanyContext(organizationId);
  }

  @Post('query')
  @ApiOperation({ summary: 'Execute natural language query or FAQ against live ERP data' })
  @ApiResponse({ status: 200, description: 'AI query processed' })
  async query(@Body() queryDto: AiQueryDto, @OrgId() organizationId: string) {
    return this.aiService.processQuery(organizationId, queryDto);
  }
}
