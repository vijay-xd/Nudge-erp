import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AiQueryDto {
  @ApiProperty({ description: 'User question or search query' })
  @IsString()
  @IsNotEmpty()
  prompt!: string;

  @ApiPropertyOptional({ description: 'Conversation history' })
  @IsArray()
  @IsOptional()
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}
