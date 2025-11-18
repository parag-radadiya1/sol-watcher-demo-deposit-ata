import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { LangChainTokenUsageService } from '@entities/langchain-token-usage/langchain-token-usage.service';
import { TokenTransactionService } from '@entities/token-transaction/token-transaction.service';
import { PlanService } from '@entities/plan/plan.service';
import { CreateLangChainTokenUsageDto } from '@entities/langchain-token-usage/langchain-token-usage.dto';
import { TokenUsageType, LLMProvider } from '@entities/langchain-token-usage/langchain-token-usage.entities';

export interface ITokenLimitConfig {
  dailyLimit?: number;
  monthlyLimit?: number;
  perRequestLimit?: number;
  totalLimit?: number;
}

@Injectable()
export class TokenManagementService {
  // Default token limits per user
  private readonly defaultLimits: ITokenLimitConfig = {
    dailyLimit: 50000, // 50k tokens per day
    monthlyLimit: 500000, // 500k tokens per month
    perRequestLimit: 10000, // 10k tokens per request
    totalLimit: 1000000, // 1M total tokens
  };

  constructor(
    private readonly langChainTokenUsageService: LangChainTokenUsageService,
    private readonly tokenTransactionService: TokenTransactionService,
    private readonly planService: PlanService,
  ) {}

  /**
   * Get token limits from user's plan
   */
  async getLimitsForUser(userId: string, userPlanId?: string): Promise<ITokenLimitConfig> {
    try {
      if (userPlanId) {
        const plan = await this.planService.getPlanById(userPlanId);
        return {
          dailyLimit: plan.dailyTokenLimit,
          monthlyLimit: plan.monthlyTokenLimit,
          perRequestLimit: plan.perRequestTokenLimit,
        };
      }
    } catch (error) {
      console.warn(`Could not fetch plan for user ${userId}:`, error.message);
    }

    // Fallback to default limits
    return this.defaultLimits;
  }

  /**
   * Check if user can perform token operation
   */
  async canUserPerformOperation(
    userId: string,
    requiredTokens: number,
    userPlanId?: string,
    limits?: ITokenLimitConfig,
  ): Promise<{
    allowed: boolean;
    message: string;
    currentBalance?: number;
    limits?: ITokenLimitConfig;
  }> {
    // Get limits from user's plan or use provided limits
    let config = limits;
    if (!config) {
      config = await this.getLimitsForUser(userId, userPlanId);
    }

    try {
      const validation = await this.tokenTransactionService.validateTokenLimit(
        userId,
        requiredTokens,
        config.dailyLimit,
        config.monthlyLimit,
      );

      if (!validation.isValid) {
        return {
          allowed: false,
          message: validation.message,
          currentBalance: validation.currentBalance,
          limits: config,
        };
      }

      if (config.perRequestLimit && requiredTokens > config.perRequestLimit) {
        return {
          allowed: false,
          message: `Request token limit exceeded. Limit: ${config.perRequestLimit}, Required: ${requiredTokens}`,
          currentBalance: validation.currentBalance,
          limits: config,
        };
      }

      return {
        allowed: true,
        message: 'Operation allowed',
        currentBalance: validation.currentBalance,
        limits: config,
      };
    } catch (error) {
      return {
        allowed: false,
        message: `Error validating token limit: ${error.message}`,
        limits: config,
      };
    }
  }

  /**
   * Record token usage and debit from user account
   */
  async recordTokenUsageAndDebit(
    userId: string,
    dto: CreateLangChainTokenUsageDto,
    userPlanId?: string,
    limits?: ITokenLimitConfig,
  ): Promise<{
    tokenUsage: any;
    transaction: any;
    currentBalance: number;
  }> {
    // First validate the user has enough tokens
    const canPerform = await this.canUserPerformOperation(
      userId,
      dto.inputTokens + dto.outputTokens,
      userPlanId,
      limits,
    );

    if (!canPerform.allowed) {
      throw new BadRequestException(canPerform.message);
    }

    // Record the token usage
    const tokenUsage = await this.langChainTokenUsageService.createTokenUsage({
      ...dto,
      userId,
    });

    // Debit tokens from user account
    const currentBalance = canPerform.currentBalance;
    const totalTokens = dto.inputTokens + dto.outputTokens;

    const transaction = await this.tokenTransactionService.debitTokens(
      userId,
      totalTokens,
      currentBalance,
      `${dto.usageType || 'API'} - ${dto.provider}`,
      tokenUsage._id.toString(),
    );

    const newBalance = currentBalance - totalTokens;

    return {
      tokenUsage,
      transaction,
      currentBalance: newBalance,
    };
  }

  /**
   * Get comprehensive user token report
   */
  async getUserTokenReport(userId: string, userPlanId?: string) {
    const [
      totalUsed,
      dailyUsed,
      monthlyUsed,
      currentBalance,
      summary,
      stats,
    ] = await Promise.all([
      this.langChainTokenUsageService.getTotalTokensUsed(userId),
      this.langChainTokenUsageService.getDailyTokenUsage(userId),
      this.langChainTokenUsageService.getMonthlyTokenUsage(userId),
      this.tokenTransactionService.getCurrentBalance(userId),
      this.tokenTransactionService.getTransactionSummary(userId),
      this.langChainTokenUsageService.getTokenUsageStats(userId, {}),
    ]);

    const limits = await this.getLimitsForUser(userId, userPlanId);

    return {
      currentBalance,
      totalUsed,
      dailyUsed,
      monthlyUsed,
      summary,
      stats,
      limits,
      remainingDailyTokens: Math.max(0, (limits.dailyLimit || 0) - dailyUsed),
      remainingMonthlyTokens: Math.max(0, (limits.monthlyLimit || 0) - monthlyUsed),
    };
  }

  /**
   * Get token usage breakdown by type
   */
  async getTokenUsageByType(userId: string) {
    const types = Object.values(TokenUsageType) as string[];
    const breakdown: Record<string, number> = {};

    await Promise.all(
      types.map(async (type) => {
        breakdown[type] = await this.langChainTokenUsageService.getTokenUsageByType(userId, type as TokenUsageType);
      }),
    );

    return breakdown;
  }

  /**
   * Get token usage breakdown by provider
   */
  async getTokenUsageByProvider(userId: string) {
    const providers = Object.values(LLMProvider) as string[];
    const breakdown: Record<string, number> = {};

    await Promise.all(
      providers.map(async (provider) => {
        breakdown[provider] = await this.langChainTokenUsageService.getTokenUsageByProvider(
          userId,
          provider as LLMProvider,
        );
      }),
    );

    return breakdown;
  }

  /**
   * Refund tokens for failed requests
   */
  async refundFailedRequest(
    userId: string,
    tokenUsageId: string,
    reason?: string,
  ): Promise<any> {
    const tokenUsage = await this.langChainTokenUsageService.findById(tokenUsageId);

    if (tokenUsage.userId !== userId) {
      throw new BadRequestException('Token usage does not belong to this user');
    }

    const currentBalance = await this.tokenTransactionService.getCurrentBalance(userId);
    const tokensToRefund = tokenUsage.totalTokens;

    const refund = await this.tokenTransactionService.refundTokens(
      userId,
      tokensToRefund,
      currentBalance,
      reason || 'Failed request refund',
      tokenUsageId,
    );

    return {
      refund,
      tokensRefunded: tokensToRefund,
      newBalance: currentBalance + tokensToRefund,
    };
  }

  /**
   * Apply penalty tokens for abuse
   */
  async applyPenalty(
    userId: string,
    penaltyTokens: number,
    reason: string,
  ): Promise<any> {
    const currentBalance = await this.tokenTransactionService.getCurrentBalance(userId);

    const penalty = await this.tokenTransactionService.applyPenalty(
      userId,
      penaltyTokens,
      currentBalance,
      reason,
    );

    return {
      penalty,
      tokensPenalized: penaltyTokens,
      newBalance: Math.max(0, currentBalance - penaltyTokens),
    };
  }

  /**
   * Bonus tokens to user
   */
  async giveBonus(
    userId: string,
    bonusTokens: number,
    reason: string,
  ): Promise<any> {
    const currentBalance = await this.tokenTransactionService.getCurrentBalance(userId);

    const bonus = await this.tokenTransactionService.creditTokens(
      userId,
      bonusTokens,
      currentBalance,
      reason || 'Bonus tokens',
    );

    return {
      bonus,
      tokensAdded: bonusTokens,
      newBalance: currentBalance + bonusTokens,
    };
  }

  /**
   * Get overall platform statistics
   */
  async getPlatformStatistics(startDate?: Date, endDate?: Date) {
    const [usageStats, transactionStats] = await Promise.all([
      this.langChainTokenUsageService.getAggregatedStats(startDate, endDate),
      this.tokenTransactionService.getAggregatedStats(startDate, endDate),
    ]);

    return {
      tokenUsage: usageStats,
      transactions: transactionStats,
      timestamp: new Date(),
    };
  }

  /**
   * Check if user is within daily limit
   */
  async isWithinDailyLimit(
    userId: string,
    userPlanId?: string,
    dailyLimit?: number,
  ): Promise<{ within: boolean; used: number; remaining: number }> {
    let limit = dailyLimit;
    if (!limit) {
      const limits = await this.getLimitsForUser(userId, userPlanId);
      limit = limits.dailyLimit;
    }

    const used = await this.langChainTokenUsageService.getDailyTokenUsage(userId);
    const remaining = Math.max(0, (limit || 0) - used);

    return {
      within: used <= (limit || 0),
      used,
      remaining,
    };
  }

  /**
   * Check if user is within monthly limit
   */
  async isWithinMonthlyLimit(
    userId: string,
    userPlanId?: string,
    monthlyLimit?: number,
  ): Promise<{ within: boolean; used: number; remaining: number }> {
    let limit = monthlyLimit;
    if (!limit) {
      const limits = await this.getLimitsForUser(userId, userPlanId);
      limit = limits.monthlyLimit;
    }

    const used = await this.langChainTokenUsageService.getMonthlyTokenUsage(userId);
    const remaining = Math.max(0, (limit || 0) - used);

    return {
      within: used <= (limit || 0),
      used,
      remaining,
    };
  }
}
