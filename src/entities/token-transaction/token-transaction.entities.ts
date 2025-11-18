import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { MongoSchema } from '@utils/classes/schema.classes';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { SchemaTypes } from 'mongoose';

export enum TransactionType {
  DEBIT = 'debit',
  CREDIT = 'credit',
  REFUND = 'refund',
  PENALTY = 'penalty',
  BONUS = 'bonus',
  RESET = 'reset',
  // Specific usage type transactions
  ASTROLOGY_DEBIT = 'astrology_debit',
  BIRTHSTONE_DEBIT = 'birthstone_debit',
  MARRIAGE_MATCH_DEBIT = 'marriage_match_debit',
  DAILY_ASTROLOGY_DEBIT = 'daily_astrology_debit',
  CONVERSATION_DEBIT = 'conversation_debit',
  CHAT_DEBIT = 'chat_debit',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true, versionKey: false, collection: 'token_transaction' })
export class TokenTransaction extends MongoSchema {
  @ApiProperty({ type: String, example: '507f1f77bcf86cd799439011' })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'user', required: true })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: TransactionType, example: 'debit' })
  @Prop({ type: String, enum: TransactionType, required: true })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  transactionType: TransactionType;

  @ApiProperty({ enum: TransactionStatus, example: 'completed' })
  @Prop({ type: String, enum: TransactionStatus, default: TransactionStatus.COMPLETED })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;

  @ApiProperty({ example: 500 })
  @Prop({ type: Number, required: true })
  @IsNumber()
  @IsNotEmpty()
  tokensAmount: number;

  @ApiProperty({ example: 5000 })
  @Prop({ type: Number, required: true })
  @IsNumber()
  @IsNotEmpty()
  balanceBefore: number;

  @ApiProperty({ example: 4500 })
  @Prop({ type: Number, required: true })
  @IsNumber()
  @IsNotEmpty()
  balanceAfter: number;

  @ApiProperty({ example: 'Astrology reading processing', required: false })
  @Prop({ type: String, required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'langchain-token-usage-id', required: false })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'langchain_token_usage', required: false })
  @IsString()
  @IsOptional()
  tokenUsageId?: string;

  @ApiProperty({ example: 'request-id-12345', required: false })
  @Prop({ type: String, required: false })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiProperty({ example: 'api', required: false })
  @Prop({ type: String, required: false })
  @IsString()
  @IsOptional()
  source?: string; // 'api', 'manual', 'system', etc.

  @ApiProperty({ example: 'Token limit exceeded', required: false })
  @Prop({ type: String, required: false })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z', required: false })
  @Prop({ type: Date, default: () => new Date() })
  transactionDate?: Date;

  @ApiProperty({ example: null, required: false })
  @Prop({ type: String, required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export const tokenTransactionSchema = SchemaFactory.createForClass(
  TokenTransaction,
);

// Add indexes for efficient queries
tokenTransactionSchema.index({ userId: 1, createdAt: -1 });
tokenTransactionSchema.index({ userId: 1, transactionType: 1 });
tokenTransactionSchema.index({ userId: 1, status: 1 });
tokenTransactionSchema.index({ createdAt: -1 });
tokenTransactionSchema.index({ transactionDate: -1 });

export const tokenTransactionModel = MongooseModule.forFeature([
  { name: TokenTransaction.name, schema: tokenTransactionSchema },
]);
