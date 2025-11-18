import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LangChainTokenUsage, LLMProvider, TokenUsageType } from './langchain-token-usage.entities';
import {
  CreateLangChainTokenUsageDto,
  GetTokenUsageStatsDto,
  TokenUsageStatsResponseDto,
} from './langchain-token-usage.dto';

@Injectable()
export class LangChainTokenUsageService {
  constructor(
    @InjectModel(LangChainTokenUsage.name)
    private langChainTokenUsageModel: Model<LangChainTokenUsage>,
  ) {}

  /**
   * Create a new token usage record
   */
  async createTokenUsage(
    dto: CreateLangChainTokenUsageDto,
  ): Promise<LangChainTokenUsage> {
    const totalTokens = dto.inputTokens + dto.outputTokens;

    const tokenUsage = new this.langChainTokenUsageModel({
      ...dto,
      totalTokens,
      success: dto.success ?? true,
      recordedAt: new Date(),
    });

    return await tokenUsage.save();
  }

  /**
   * Get token usage history for a user
   */
  async getTokenUsageHistory(
    userId: string,
    limit: number = 50,
    skip: number = 0,
    usageType?: TokenUsageType,
  ): Promise<{ data: LangChainTokenUsage[]; total: number }> {
    const filter: any = { userId };
    if (usageType) {
      filter.usageType = usageType;
    }

    const data = await this.langChainTokenUsageModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .exec();

    const total = await this.langChainTokenUsageModel.countDocuments(filter);

    return { data, total };
  }

  /**
   * Get comprehensive token usage statistics for a user
   */
  async getTokenUsageStats(
    userId: string,
    dto: GetTokenUsageStatsDto,
  ): Promise<TokenUsageStatsResponseDto> {
    const filter: any = { userId, success: true };

    if (dto.startDate || dto.endDate) {
      filter.createdAt = {};
      if (dto.startDate) {
        filter.createdAt.$gte = new Date(dto.startDate);
      }
      if (dto.endDate) {
        filter.createdAt.$lte = new Date(dto.endDate);
      }
    }

    if (dto.usageType) {
      filter.usageType = dto.usageType;
    }

    if (dto.provider) {
      filter.provider = dto.provider;
    }

    const records = await this.langChainTokenUsageModel.find(filter).exec();

    if (records.length === 0) {
      return {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        requestCount: 0,
        successCount: 0,
        failureCount: 0,
        successRate: 0,
        averageInputTokens: 0,
        averageOutputTokens: 0,
        averageResponseTimeMs: 0,
        tokensByType: {},
        tokensByProvider: {},
      };
    }

    // Calculate aggregates
    const totalInputTokens = records.reduce((sum, r) => sum + r.inputTokens, 0);
    const totalOutputTokens = records.reduce((sum, r) => sum + r.outputTokens, 0);
    const totalTokens = totalInputTokens + totalOutputTokens;

    const failureFilter = { ...filter, success: false };
    const failureCount = await this.langChainTokenUsageModel.countDocuments(failureFilter);

    const totalRecords = await this.langChainTokenUsageModel.countDocuments({ userId });
    const successCount = records.length;

    const averageInputTokens = Math.round(totalInputTokens / successCount);
    const averageOutputTokens = Math.round(totalOutputTokens / successCount);

    const responseTimesWithData = records.filter((r) => r.responseTimeMs);
    const averageResponseTimeMs =
      responseTimesWithData.length > 0
        ? Math.round(
            responseTimesWithData.reduce((sum, r) => sum + r.responseTimeMs, 0) /
              responseTimesWithData.length,
          )
        : 0;

    // Group by usage type
    const tokensByType: Record<string, number> = {};
    records.forEach((r) => {
      const type = r.usageType || TokenUsageType.OTHER;
      tokensByType[type] = (tokensByType[type] || 0) + r.totalTokens;
    });

    // Group by provider
    const tokensByProvider: Record<string, number> = {};
    records.forEach((r) => {
      tokensByProvider[r.provider] = (tokensByProvider[r.provider] || 0) + r.totalTokens;
    });

    const successRate = totalRecords > 0 ? Math.round((successCount / totalRecords) * 100) : 0;

    return {
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      requestCount: successCount,
      successCount,
      failureCount,
      successRate,
      averageInputTokens,
      averageOutputTokens,
      averageResponseTimeMs,
      tokensByType,
      tokensByProvider,
    };
  }

  /**
   * Get daily token usage for a user
   */
  async getDailyTokenUsage(userId: string, date?: Date): Promise<number> {
    const startOfDay = new Date(date || new Date());
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const records = await this.langChainTokenUsageModel.find({
      userId,
      success: true,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    return records.reduce((sum, r) => sum + r.totalTokens, 0);
  }

  /**
   * Get monthly token usage for a user
   */
  async getMonthlyTokenUsage(userId: string, date?: Date): Promise<number> {
    const startOfMonth = new Date(date || new Date());
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const records = await this.langChainTokenUsageModel.find({
      userId,
      success: true,
      createdAt: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    });

    return records.reduce((sum, r) => sum + r.totalTokens, 0);
  }

  /**
   * Get token usage by usage type
   */
  async getTokenUsageByType(
    userId: string,
    usageType: TokenUsageType,
  ): Promise<number> {
    const records = await this.langChainTokenUsageModel.find({
      userId,
      usageType,
      success: true,
    });

    return records.reduce((sum, r) => sum + r.totalTokens, 0);
  }

  /**
   * Get token usage by provider
   */
  async getTokenUsageByProvider(
    userId: string,
    provider: LLMProvider,
  ): Promise<number> {
    const records = await this.langChainTokenUsageModel.find({
      userId,
      provider,
      success: true,
    });

    return records.reduce((sum, r) => sum + r.totalTokens, 0);
  }

  /**
   * Get total tokens used by a user
   */
  async getTotalTokensUsed(userId: string): Promise<number> {
    const records = await this.langChainTokenUsageModel.find({
      userId,
      success: true,
    });

    return records.reduce((sum, r) => sum + r.totalTokens, 0);
  }

  /**
   * Get request count for a user
   */
  async getRequestCount(
    userId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    const filter: any = { userId, success: true };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = startDate;
      }
      if (endDate) {
        filter.createdAt.$lte = endDate;
      }
    }

    return await this.langChainTokenUsageModel.countDocuments(filter);
  }

  /**
   * Delete old token usage records (cleanup)
   */
  async deleteOldRecords(daysOld: number = 90): Promise<any> {
    const date = new Date();
    date.setDate(date.getDate() - daysOld);

    return await this.langChainTokenUsageModel.deleteMany({
      createdAt: { $lt: date },
    });
  }

  /**
   * Find a specific token usage record by ID
   */
  async findById(id: string): Promise<LangChainTokenUsage> {
    const record = await this.langChainTokenUsageModel.findById(id);
    if (!record) {
      throw new NotFoundException(`Token usage record with ID ${id} not found`);
    }
    return record;
  }

  /**
   * Get aggregated stats across all users
   */
  async getAggregatedStats(
    startDate?: Date,
    endDate?: Date,
  ): Promise<any> {
    const filter: any = { success: true };

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = startDate;
      }
      if (endDate) {
        filter.createdAt.$lte = endDate;
      }
    }

    const stats = await this.langChainTokenUsageModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalInputTokens: { $sum: '$inputTokens' },
          totalOutputTokens: { $sum: '$outputTokens' },
          totalTokens: { $sum: '$totalTokens' },
          requestCount: { $sum: 1 },
          averageInputTokens: { $avg: '$inputTokens' },
          averageOutputTokens: { $avg: '$outputTokens' },
          averageResponseTimeMs: { $avg: '$responseTimeMs' },
        },
      },
    ]);

    return stats[0] || {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      requestCount: 0,
      averageInputTokens: 0,
      averageOutputTokens: 0,
      averageResponseTimeMs: 0,
    };
  }
}

