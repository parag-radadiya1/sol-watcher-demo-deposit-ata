import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsEnum, IsString } from 'class-validator';
import { TransactionType, TransactionStatus } from './token-transaction.entities';

export class CreateTokenTransactionDto {
  @ApiProperty({ type: String, example: '507f1f77bcf86cd799439011' })
  userId: string;

  @ApiProperty({ enum: TransactionType, example: 'debit' })
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @ApiProperty({ example: 500 })
  @IsNumber()
  tokensAmount: number;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  balanceBefore: number;

  @ApiProperty({ example: 4500 })
  @IsNumber()
  balanceAfter: number;

  @ApiProperty({ example: 'Astrology reading processing', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'langchain-token-usage-id', required: false })
  @IsString()
  @IsOptional()
  tokenUsageId?: string;

  @ApiProperty({ example: 'request-id-12345', required: false })
  @IsString()
  @IsOptional()
  referenceId?: string;

  @ApiProperty({ example: 'api', required: false })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({ example: 'Token limit exceeded', required: false })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiProperty({ example: null, required: false })
  @IsString()
  @IsOptional()
  remarks?: string;
}

export class TokenTransactionResponseDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  _id: string;

  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  userId: string;

  @ApiProperty({ enum: TransactionType, example: 'debit' })
  transactionType: TransactionType;

  @ApiProperty({ enum: TransactionStatus, example: 'completed' })
  status: TransactionStatus;

  @ApiProperty({ example: 500 })
  tokensAmount: number;

  @ApiProperty({ example: 5000 })
  balanceBefore: number;

  @ApiProperty({ example: 4500 })
  balanceAfter: number;

  @ApiProperty({ example: 'Astrology reading processing' })
  description?: string;

  @ApiProperty({ example: 'request-id-12345' })
  referenceId?: string;

  @ApiProperty({ example: 'api' })
  source?: string;

  @ApiProperty({ example: 'Token limit exceeded' })
  reason?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  transactionDate: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: Date;
}

export class GetTransactionHistoryDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  userId: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({ example: 10, required: false })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', required: false })
  @IsOptional()
  startDate?: Date;

  @ApiProperty({ example: '2024-01-31T23:59:59.000Z', required: false })
  @IsOptional()
  endDate?: Date;

  @ApiProperty({ enum: TransactionType, required: false })
  @IsEnum(TransactionType)
  @IsOptional()
  transactionType?: TransactionType;

  @ApiProperty({ enum: TransactionStatus, required: false })
  @IsEnum(TransactionStatus)
  @IsOptional()
  status?: TransactionStatus;
}

export class TokenTransactionSummaryDto {
  @ApiProperty({ example: 10000 })
  totalCredits: number;

  @ApiProperty({ example: 5000 })
  totalDebits: number;

  @ApiProperty({ example: 500 })
  totalRefunds: number;

  @ApiProperty({ example: 4500 })
  currentBalance: number;

  @ApiProperty({ example: 50 })
  totalTransactions: number;

  @ApiProperty({ type: Object, example: { debit: 30, credit: 15, refund: 5 } })
  transactionsByType: Record<string, number>;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  lastTransactionDate: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  periodStartDate: Date;

  @ApiProperty({ example: '2024-01-31T23:59:59.000Z' })
  periodEndDate: Date;
}

export class ValidateTokenLimitDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  userId: string;

  @ApiProperty({ example: 500 })
  @IsNumber()
  requiredTokens: number;

  @ApiProperty({ example: 1000, required: false })
  @IsNumber()
  @IsOptional()
  dailyLimit?: number;

  @ApiProperty({ example: 10000, required: false })
  @IsNumber()
  @IsOptional()
  monthlyLimit?: number;
}

export class ValidateTokenLimitResponseDto {
  @ApiProperty({ example: true })
  isValid: boolean;

  @ApiProperty({ example: 5000 })
  currentBalance: number;

  @ApiProperty({ example: 500 })
  requiredTokens: number;

  @ApiProperty({ example: 4500 })
  balanceAfterDeduction: number;

  @ApiProperty({ example: 1000 })
  dailyUsed?: number;

  @ApiProperty({ example: 1000, required: false })
  dailyLimit?: number;

  @ApiProperty({ example: 5000 })
  monthlyUsed?: number;

  @ApiProperty({ example: 10000, required: false })
  monthlyLimit?: number;

  @ApiProperty({ example: 'Sufficient balance available' })
  message: string;
}
