import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { LLMProvider, TokenUsageType } from './langchain-token-usage.entities';

export class CreateLangChainTokenUsageDto {
  @ApiProperty({ type: String, example: '507f1f77bcf86cd799439011' })
  userId: string;

  @ApiProperty({ enum: LLMProvider, example: 'openai' })
  @IsEnum(LLMProvider)
  provider: LLMProvider;

  @ApiProperty({ enum: TokenUsageType, example: 'chat', required: false })
  @IsEnum(TokenUsageType)
  @IsOptional()
  usageType?: TokenUsageType;

  @ApiProperty({ example: 150 })
  @IsNumber()
  inputTokens: number;

  @ApiProperty({ example: 250 })
  @IsNumber()
  outputTokens: number;

  @ApiProperty({ example: 'What is astrology?', required: false })
  @IsString()
  @IsOptional()
  prompt?: string;

  @ApiProperty({ example: 'Astrology is a science...', required: false })
  @IsString()
  @IsOptional()
  response?: string;

  @ApiProperty({ example: 'gpt-3.5-turbo', required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ example: 'request-id-12345', required: false })
  @IsString()
  @IsOptional()
  requestId?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  success?: boolean;

  @ApiProperty({ example: 'Error message', required: false })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiProperty({ example: 1200, required: false })
  @IsNumber()
  @IsOptional()
  responseTimeMs?: number;
}

export class LangChainTokenUsageResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  userId: string;

  @ApiProperty({ enum: LLMProvider, example: 'openai' })
  provider: LLMProvider;

  @ApiProperty({ enum: TokenUsageType, example: 'chat' })
  usageType?: TokenUsageType;

  @ApiProperty({ example: 150 })
  inputTokens: number;

  @ApiProperty({ example: 250 })
  outputTokens: number;

  @ApiProperty({ example: 400 })
  totalTokens: number;

  @ApiProperty({ example: 'gpt-3.5-turbo' })
  model?: string;

  @ApiProperty({ example: 'request-id-12345' })
  requestId?: string;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 1200 })
  responseTimeMs?: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}

export class GetTokenUsageStatsDto {
  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: false })
  @IsOptional()
  startDate?: Date;

  @ApiProperty({ example: '2024-01-31T23:59:59.000Z', required: false })
  @IsOptional()
  endDate?: Date;

  @ApiProperty({ enum: TokenUsageType, required: false })
  @IsEnum(TokenUsageType)
  @IsOptional()
  usageType?: TokenUsageType;

  @ApiProperty({ enum: LLMProvider, required: false })
  @IsEnum(LLMProvider)
  @IsOptional()
  provider?: LLMProvider;
}

export class TokenUsageStatsResponseDto {
  @ApiProperty({ example: 10000 })
  totalInputTokens: number;

  @ApiProperty({ example: 15000 })
  totalOutputTokens: number;

  @ApiProperty({ example: 25000 })
  totalTokens: number;

  @ApiProperty({ example: 50 })
  requestCount: number;

  @ApiProperty({ example: 48 })
  successCount: number;

  @ApiProperty({ example: 2 })
  failureCount: number;

  @ApiProperty({ example: 96 })
  successRate: number;

  @ApiProperty({ example: 500 })
  averageInputTokens: number;

  @ApiProperty({ example: 750 })
  averageOutputTokens: number;

  @ApiProperty({ example: 1200 })
  averageResponseTimeMs: number;

  @ApiProperty({ type: Object, example: { chat: 10000, astrology: 15000 } })
  tokensByType?: Record<string, number>;

  @ApiProperty({ type: Object, example: { openai: 15000, google: 10000 } })
  tokensByProvider?: Record<string, number>;
}
