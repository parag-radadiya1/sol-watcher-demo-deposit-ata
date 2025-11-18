import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TokenTransaction, TransactionType, TransactionStatus } from './token-transaction.entities';
import {
  CreateTokenTransactionDto,
  GetTransactionHistoryDto,
  TokenTransactionSummaryDto,
  ValidateTokenLimitResponseDto,
} from './token-transaction.dto';
import { TokenUsageType } from '../../entities/langchain-token-usage/langchain-token-usage.entities';

@Injectable()
export class TokenTransactionService {
  constructor(
    @InjectModel(TokenTransaction.name)
    private tokenTransactionModel: Model<TokenTransaction>,
  ) {}

  /**
   * Map TokenUsageType to TransactionType for specific tracking
   */
  private mapUsageTypeToTransactionType(usageType?: TokenUsageType): TransactionType {
    const typeMap: Record<TokenUsageType, TransactionType> = {
      [TokenUsageType.CHAT]: TransactionType.CHAT_DEBIT,
      [TokenUsageType.ASTROLOGY]: TransactionType.ASTROLOGY_DEBIT,
      [TokenUsageType.BIRTHSTONE]: TransactionType.BIRTHSTONE_DEBIT,
      [TokenUsageType.MARRIAGE_MATCH]: TransactionType.MARRIAGE_MATCH_DEBIT,
      [TokenUsageType.DAILY_ASTROLOGY]: TransactionType.DAILY_ASTROLOGY_DEBIT,
      [TokenUsageType.CONVERSATION]: TransactionType.CONVERSATION_DEBIT,
      [TokenUsageType.OTHER]: TransactionType.DEBIT,
    };

    return typeMap[usageType] || TransactionType.DEBIT;
  }

  /**
   * Create a new token transaction
   */
  async createTransaction(
    dto: CreateTokenTransactionDto,
  ): Promise<TokenTransaction> {
    // Validate that balances make sense
    const expectedBalance = this.calculateExpectedBalance(
      dto.balanceBefore,
      dto.tokensAmount,
      dto.transactionType,
    );

    if (expectedBalance !== dto.balanceAfter) {
      throw new BadRequestException(
        `Balance calculation mismatch. Expected: ${expectedBalance}, Provided: ${dto.balanceAfter}`,
      );
    }

    const transaction = new this.tokenTransactionModel({
      ...dto,
      status: TransactionStatus.COMPLETED,
      transactionDate: new Date(),
    });

    return await transaction.save();
  }

  /**
   * Debit tokens from user account with usage type tracking
   */
  async debitTokensWithUsageType(
    userId: string,
    tokensAmount: number,
    currentBalance: number,
    usageType?: TokenUsageType,
    description?: string,
    referenceId?: string,
  ): Promise<TokenTransaction> {
    if (tokensAmount <= 0) {
      throw new BadRequestException('Token amount must be greater than 0');
    }

    if (currentBalance < tokensAmount) {
      throw new BadRequestException(
        `Insufficient tokens. Required: ${tokensAmount}, Available: ${currentBalance}`,
      );
    }

    const balanceAfter = currentBalance - tokensAmount;
    const transactionType = this.mapUsageTypeToTransactionType(usageType);

    return await this.createTransaction({
      userId,
      transactionType,
      tokensAmount,
      balanceBefore: currentBalance,
      balanceAfter,
      description: description || `${usageType || 'Token'} usage debit`,
      referenceId,
      source: 'api',
    });
  }

  /**
   * Debit tokens from user account
   */
  async debitTokens(
    userId: string,
    tokensAmount: number,
    currentBalance: number,
    description?: string,
    referenceId?: string,
  ): Promise<TokenTransaction> {
    if (tokensAmount <= 0) {
      throw new BadRequestException('Token amount must be greater than 0');
    }

    if (currentBalance < tokensAmount) {
      throw new BadRequestException(
        `Insufficient tokens. Required: ${tokensAmount}, Available: ${currentBalance}`,
      );
    }

    const balanceAfter = currentBalance - tokensAmount;

    return await this.createTransaction({
      userId,
      transactionType: TransactionType.DEBIT,
      tokensAmount,
      balanceBefore: currentBalance,
      balanceAfter,
      description: description || 'Token usage debit',
      referenceId,
      source: 'api',
    });
  }

  /**
   * Credit tokens to user account
   */
  async creditTokens(
    userId: string,
    tokensAmount: number,
    currentBalance: number,
    description?: string,
    referenceId?: string,
  ): Promise<TokenTransaction> {
    if (tokensAmount <= 0) {
      throw new BadRequestException('Token amount must be greater than 0');
    }

    const balanceAfter = currentBalance + tokensAmount;

    return await this.createTransaction({
      userId,
      transactionType: TransactionType.CREDIT,
      tokensAmount,
      balanceBefore: currentBalance,
      balanceAfter,
      description: description || 'Token credit',
      referenceId,
      source: 'api',
    });
  }

  /**
   * Refund tokens to user
   */
  async refundTokens(
    userId: string,
    tokensAmount: number,
    currentBalance: number,
    reason?: string,
    referenceId?: string,
  ): Promise<TokenTransaction> {
    if (tokensAmount <= 0) {
      throw new BadRequestException('Refund amount must be greater than 0');
    }

    const balanceAfter = currentBalance + tokensAmount;

    return await this.createTransaction({
      userId,
      transactionType: TransactionType.REFUND,
      tokensAmount,
      balanceBefore: currentBalance,
      balanceAfter,
      description: 'Token refund',
      reason: reason || 'User request',
      referenceId,
      source: 'api',
    });
  }

  /**
   * Apply penalty tokens
   */
  async applyPenalty(
    userId: string,
    tokensAmount: number,
    currentBalance: number,
    reason: string,
    referenceId?: string,
  ): Promise<TokenTransaction> {
    if (tokensAmount <= 0) {
      throw new BadRequestException('Penalty amount must be greater than 0');
    }

    const balanceAfter = Math.max(0, currentBalance - tokensAmount);

    return await this.createTransaction({
      userId,
      transactionType: TransactionType.PENALTY,
      tokensAmount: currentBalance - balanceAfter,
      balanceBefore: currentBalance,
      balanceAfter,
      description: 'Penalty deduction',
      reason,
      referenceId,
      source: 'system',
    });
  }

  /**
   * Get transaction history for a user
   */
  async getTransactionHistory(
    userId: string,
    limit: number = 20,
    skip: number = 0,
    filters?: Partial<GetTransactionHistoryDto>,
  ): Promise<{ data: TokenTransaction[]; total: number }> {
    const query: any = { userId };

    if (filters?.transactionType) {
      query.transactionType = filters.transactionType;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      query.transactionDate = {};
      if (filters?.startDate) {
        query.transactionDate.$gte = new Date(filters.startDate);
      }
      if (filters?.endDate) {
        query.transactionDate.$lte = new Date(filters.endDate);
      }
    }

    const data = await this.tokenTransactionModel
      .find(query)
      .sort({ transactionDate: -1 })
      .limit(limit)
      .skip(skip)
      .exec();

    const total = await this.tokenTransactionModel.countDocuments(query);

    return { data, total };
  }

  /**
   * Get transaction summary for a user
   */
  async getTransactionSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<TokenTransactionSummaryDto> {
    const filter: any = { userId, status: TransactionStatus.COMPLETED };

    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) {
        filter.transactionDate.$gte = startDate;
      }
      if (endDate) {
        filter.transactionDate.$lte = endDate;
      }
    }

    const transactions = await this.tokenTransactionModel.find(filter).exec();

    let totalCredits = 0;
    let totalDebits = 0;
    let totalRefunds = 0;
    const transactionsByType: Record<string, number> = {};

    transactions.forEach((t) => {
      transactionsByType[t.transactionType] = (transactionsByType[t.transactionType] || 0) + 1;

      switch (t.transactionType) {
        case TransactionType.CREDIT:
        case TransactionType.BONUS:
          totalCredits += t.tokensAmount;
          break;
        case TransactionType.DEBIT:
        case TransactionType.PENALTY:
        case TransactionType.ASTROLOGY_DEBIT:
        case TransactionType.BIRTHSTONE_DEBIT:
        case TransactionType.MARRIAGE_MATCH_DEBIT:
        case TransactionType.DAILY_ASTROLOGY_DEBIT:
        case TransactionType.CONVERSATION_DEBIT:
        case TransactionType.CHAT_DEBIT:
          totalDebits += t.tokensAmount;
          break;
        case TransactionType.REFUND:
          totalRefunds += t.tokensAmount;
          break;
      }
    });

    const currentBalance = totalCredits + totalRefunds - totalDebits;

    const lastTransaction = transactions.length > 0 ? transactions[0] : null;

    return {
      totalCredits,
      totalDebits,
      totalRefunds,
      currentBalance,
      totalTransactions: transactions.length,
      transactionsByType,
      lastTransactionDate: lastTransaction?.transactionDate,
      periodStartDate: startDate,
      periodEndDate: endDate,
    };
  }

  /**
   * Get current balance for a user
   */
  async getCurrentBalance(userId: string): Promise<number> {
    const summary = await this.getTransactionSummary(userId);
    return summary.currentBalance;
  }

  /**
   * Calculate daily token usage
   */
  async getDailyTokenUsage(userId: string, date?: Date): Promise<number> {
    const startOfDay = new Date(date || new Date());
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const allDebitTypes = [
      TransactionType.DEBIT,
      TransactionType.PENALTY,
      TransactionType.ASTROLOGY_DEBIT,
      TransactionType.BIRTHSTONE_DEBIT,
      TransactionType.MARRIAGE_MATCH_DEBIT,
      TransactionType.DAILY_ASTROLOGY_DEBIT,
      TransactionType.CONVERSATION_DEBIT,
      TransactionType.CHAT_DEBIT,
    ];

    const debits = await this.tokenTransactionModel.find({
      userId,
      transactionType: { $in: allDebitTypes },
      status: TransactionStatus.COMPLETED,
      transactionDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    return debits.reduce((sum, t) => sum + t.tokensAmount, 0);
  }

  /**
   * Calculate monthly token usage
   */
  async getMonthlyTokenUsage(userId: string, date?: Date): Promise<number> {
    const startOfMonth = new Date(date || new Date());
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const allDebitTypes = [
      TransactionType.DEBIT,
      TransactionType.PENALTY,
      TransactionType.ASTROLOGY_DEBIT,
      TransactionType.BIRTHSTONE_DEBIT,
      TransactionType.MARRIAGE_MATCH_DEBIT,
      TransactionType.DAILY_ASTROLOGY_DEBIT,
      TransactionType.CONVERSATION_DEBIT,
      TransactionType.CHAT_DEBIT,
    ];

    const debits = await this.tokenTransactionModel.find({
      userId,
      transactionType: { $in: allDebitTypes },
      status: TransactionStatus.COMPLETED,
      transactionDate: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });

    return debits.reduce((sum, t) => sum + t.tokensAmount, 0);
  }

  /**
   * Validate if user has sufficient tokens
   */
  async validateTokenLimit(
    userId: string,
    requiredTokens: number,
    dailyLimit?: number,
    monthlyLimit?: number,
  ): Promise<ValidateTokenLimitResponseDto> {
    const currentBalance = await this.getCurrentBalance(userId);
    const dailyUsed = dailyLimit ? await this.getDailyTokenUsage(userId) : 0;
    const monthlyUsed = monthlyLimit ? await this.getMonthlyTokenUsage(userId) : 0;

    const hasBalance = currentBalance >= requiredTokens;
    const withinDailyLimit = !dailyLimit || dailyUsed + requiredTokens <= dailyLimit;
    const withinMonthlyLimit = !monthlyLimit || monthlyUsed + requiredTokens <= monthlyLimit;

    const isValid = hasBalance && withinDailyLimit && withinMonthlyLimit;

    let message = 'Sufficient balance available';
    if (!hasBalance) {
      message = `Insufficient balance. Required: ${requiredTokens}, Available: ${currentBalance}`;
    } else if (dailyLimit && !withinDailyLimit) {
      message = `Daily limit exceeded. Limit: ${dailyLimit}, Used: ${dailyUsed}, Required: ${requiredTokens}`;
    } else if (monthlyLimit && !withinMonthlyLimit) {
      message = `Monthly limit exceeded. Limit: ${monthlyLimit}, Used: ${monthlyUsed}, Required: ${requiredTokens}`;
    }

    return {
      isValid,
      currentBalance,
      requiredTokens,
      balanceAfterDeduction: Math.max(0, currentBalance - requiredTokens),
      dailyUsed: dailyLimit ? dailyUsed : undefined,
      dailyLimit,
      monthlyUsed: monthlyLimit ? monthlyUsed : undefined,
      monthlyLimit,
      message,
    };
  }

  /**
   * Reset user tokens (admin only)
   */
  async resetTokens(
    userId: string,
    newBalance: number,
    currentBalance: number,
    reason: string,
  ): Promise<TokenTransaction> {
    if (newBalance < 0) {
      throw new BadRequestException('New balance cannot be negative');
    }

    const difference = newBalance - currentBalance;

    return await this.createTransaction({
      userId,
      transactionType: TransactionType.RESET,
      tokensAmount: Math.abs(difference),
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      description: 'Token balance reset',
      reason,
      source: 'admin',
    });
  }

  /**
   * Calculate expected balance based on transaction type
   */
  private calculateExpectedBalance(
    balanceBefore: number,
    amount: number,
    type: TransactionType,
  ): number {
    const debitTypes = [
      TransactionType.DEBIT,
      TransactionType.PENALTY,
      TransactionType.ASTROLOGY_DEBIT,
      TransactionType.BIRTHSTONE_DEBIT,
      TransactionType.MARRIAGE_MATCH_DEBIT,
      TransactionType.DAILY_ASTROLOGY_DEBIT,
      TransactionType.CONVERSATION_DEBIT,
      TransactionType.CHAT_DEBIT,
    ];

    if (debitTypes.includes(type)) {
      return balanceBefore - amount;
    } else if ([TransactionType.CREDIT, TransactionType.REFUND, TransactionType.BONUS].includes(type)) {
      return balanceBefore + amount;
    } else if (type === TransactionType.RESET) {
      return amount;
    }
    return balanceBefore;
  }

  /**
   * Find a specific transaction by ID
   */
  async findById(id: string): Promise<TokenTransaction> {
    const transaction = await this.tokenTransactionModel.findById(id);
    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }
    return transaction;
  }

  /**
   * Get aggregated statistics
   */
  async getAggregatedStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    const filter: any = { status: TransactionStatus.COMPLETED };

    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) {
        filter.transactionDate.$gte = startDate;
      }
      if (endDate) {
        filter.transactionDate.$lte = endDate;
      }
    }

    const allDebitTypes = [
      TransactionType.DEBIT,
      TransactionType.PENALTY,
      TransactionType.ASTROLOGY_DEBIT,
      TransactionType.BIRTHSTONE_DEBIT,
      TransactionType.MARRIAGE_MATCH_DEBIT,
      TransactionType.DAILY_ASTROLOGY_DEBIT,
      TransactionType.CONVERSATION_DEBIT,
      TransactionType.CHAT_DEBIT,
    ];

    const creditTypes = [TransactionType.CREDIT, TransactionType.BONUS, TransactionType.REFUND];

    const stats = await this.tokenTransactionModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalTokensDebited: {
            $sum: {
              $cond: [{ $in: ['$transactionType', allDebitTypes] }, '$tokensAmount', 0],
            },
          },
          totalTokensCredited: {
            $sum: {
              $cond: [{ $in: ['$transactionType', creditTypes] }, '$tokensAmount', 0],
            },
          },
          uniqueUsers: { $addToSet: '$userId' },
        },
      },
      {
        $addFields: {
          uniqueUserCount: { $size: '$uniqueUsers' },
        },
      },
    ]);

    return stats[0] || {
      totalTransactions: 0,
      totalTokensDebited: 0,
      totalTokensCredited: 0,
      uniqueUserCount: 0,
    };
  }
}

