import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { MongoSchema } from '@utils/classes/schema.classes';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { SchemaTypes } from 'mongoose';

export enum LLMProvider {
  OPENAI = 'openai',
  GOOGLE = 'google',
}

export enum TokenUsageType {
  CHAT = 'chat',
  ASTROLOGY = 'astrology',
  BIRTHSTONE = 'birthstone',
  MARRIAGE_MATCH = 'marriage_match',
  DAILY_ASTROLOGY = 'daily_astrology',
  CONVERSATION = 'conversation',
  OTHER = 'other',
}

@Schema({ timestamps: true, versionKey: false, collection: 'langchain_token_usage' })
export class LangChainTokenUsage extends MongoSchema {
  @ApiProperty({ type: String, example: '507f1f77bcf86cd799439011' })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'user', required: true })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: LLMProvider, example: 'openai' })
  @Prop({ type: String, enum: LLMProvider, required: true })
  @IsEnum(LLMProvider)
  @IsNotEmpty()
  provider: LLMProvider;

  @ApiProperty({ enum: TokenUsageType, example: 'chat' })
  @Prop({ type: String, enum: TokenUsageType, default: TokenUsageType.OTHER })
  @IsEnum(TokenUsageType)
  @IsOptional()
  usageType?: TokenUsageType;

  @ApiProperty({ example: 150 })
  @Prop({ type: Number, required: true, default: 0 })
  @IsNumber()
  @IsNotEmpty()
  inputTokens: number;

  @ApiProperty({ example: 250 })
  @Prop({ type: Number, required: true, default: 0 })
  @IsNumber()
  @IsNotEmpty()
  outputTokens: number;

  @ApiProperty({ example: 400 })
  @Prop({ type: Number, required: true })
  @IsNumber()
  @IsNotEmpty()
  totalTokens: number;

  @ApiProperty({ example: 'What is astrology?', required: false })
  @Prop({ type: String, required: false })
  @IsString()
  @IsOptional()
  prompt?: string;

  @ApiProperty({ example: 'Astrology is a science...', required: false })
  @Prop({ type: String, required: false })
  @IsString()
  @IsOptional()
  response?: string;

  @ApiProperty({ example: 'gpt-3.5-turbo' })
  @Prop({ type: String, required: false })
  @IsString()
  @IsOptional()
  model?: string;

  @ApiProperty({ example: 'request-id-12345', required: false })
  @Prop({ type: String, required: false })
  @IsString()
  @IsOptional()
  requestId?: string;

  @ApiProperty({ example: true })
  @Prop({ type: Boolean, default: true })
  success: boolean;

  @ApiProperty({ example: 'Successfully processed', required: false })
  @Prop({ type: String, required: false })
  @IsString()
  @IsOptional()
  errorMessage?: string;

  @ApiProperty({ example: 1200, required: false })
  @Prop({ type: Number, required: false })
  @IsNumber()
  @IsOptional()
  responseTimeMs?: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', required: false })
  @Prop({ type: Date, default: () => new Date() })
  recordedAt?: Date;
}

export const langChainTokenUsageSchema = SchemaFactory.createForClass(
  LangChainTokenUsage,
);

// Add indexes for efficient queries
langChainTokenUsageSchema.index({ userId: 1, createdAt: -1 });
langChainTokenUsageSchema.index({ userId: 1, provider: 1 });
langChainTokenUsageSchema.index({ userId: 1, usageType: 1 });
langChainTokenUsageSchema.index({ createdAt: -1 });

export const langChainTokenUsageModel = MongooseModule.forFeature([
  { name: LangChainTokenUsage.name, schema: langChainTokenUsageSchema },
]);

