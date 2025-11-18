import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TokenManagementService } from './token-management.service';
import { LangChainTokenUsageService } from '@entities/langchain-token-usage/langchain-token-usage.service';
import { TokenTransactionService } from '@entities/token-transaction/token-transaction.service';
import {
  CreateLangChainTokenUsageDto,
  GetTokenUsageStatsDto,
} from '@entities/langchain-token-usage/langchain-token-usage.dto';
import {
  GetTransactionHistoryDto,
  ValidateTokenLimitDto,
} from '@entities/token-transaction/token-transaction.dto';
import { ICommonResponse } from '@utils/dto/common.interface';

@ApiTags('Token Management')
@Controller('api/v1/tokens')
@ApiBearerAuth()
export class TokenManagementController {
  constructor(
    private readonly tokenManagementService: TokenManagementService,
    private readonly langChainTokenUsageService: LangChainTokenUsageService,
    private readonly tokenTransactionService: TokenTransactionService,
  ) {}

  /**
   * Get user token report
   */
  @Get('report/:userId')
  @ApiOperation({ summary: 'Get comprehensive token usage report for user' })
  @ApiResponse({
    status: 200,
    description: 'Token report retrieved successfully',
  })
  async getUserTokenReport(@Param('userId') userId: string): Promise<ICommonResponse<any>> {
    const report = await this.tokenManagementService.getUserTokenReport(userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Token report retrieved successfully',
      data: report,
    };
  }

  /**
   * Get current token balance
   */
  @Get('balance/:userId')
  @ApiOperation({ summary: 'Get current token balance for user' })
  @ApiResponse({
    status: 200,
    description: 'Current balance retrieved',
  })
  async getBalance(@Param('userId') userId: string): Promise<ICommonResponse<any>> {
    const balance = await this.tokenTransactionService.getCurrentBalance(userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Current balance retrieved',
      data: { balance, userId },
    };
  }

  /**
   * Validate token limit before operation
   */
  @Post('validate-limit')
  @ApiOperation({ summary: 'Validate if user can perform operation with token requirement' })
  @ApiResponse({
    status: 200,
    description: 'Token validation result',
  })
  async validateTokenLimit(
    @Body() dto: ValidateTokenLimitDto,
  ): Promise<ICommonResponse<any>> {
    const result = await this.tokenTransactionService.validateTokenLimit(
      dto.userId,
      dto.requiredTokens,
      dto.dailyLimit,
      dto.monthlyLimit,
    );
    return {
      statusCode: HttpStatus.OK,
      message: result.isValid ? 'Sufficient tokens available' : 'Insufficient tokens',
      data: result,
    };
  }

  /**
   * Record token usage and debit
   */
  @Post('record-usage')
  @ApiOperation({ summary: 'Record token usage from LLM and debit from user account' })
  @ApiResponse({
    status: 201,
    description: 'Token usage recorded and debited',
  })
  async recordTokenUsage(
    @Body() dto: CreateLangChainTokenUsageDto,
  ): Promise<ICommonResponse<any>> {
    const result = await this.tokenManagementService.recordTokenUsageAndDebit(
      dto.userId,
      dto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Token usage recorded and debited successfully',
      data: result,
    };
  }

  /**
   * Get token usage history
   */
  @Get('usage-history/:userId')
  @ApiOperation({ summary: 'Get token usage history for user' })
  @ApiResponse({
    status: 200,
    description: 'Usage history retrieved',
  })
  async getTokenUsageHistory(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 50,
    @Query('skip') skip: number = 0,
    @Query('usageType') usageType?: string,
  ): Promise<ICommonResponse<any>> {
    const result = await this.langChainTokenUsageService.getTokenUsageHistory(
      userId,
      limit,
      skip,
      usageType as any,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Usage history retrieved',
      data: result,
    };
  }

  /**
   * Get token usage statistics
   */
  @Get('usage-stats/:userId')
  @ApiOperation({ summary: 'Get token usage statistics for user' })
  @ApiResponse({
    status: 200,
    description: 'Usage statistics retrieved',
  })
  async getTokenUsageStats(
    @Param('userId') userId: string,
    @Query() dto: GetTokenUsageStatsDto,
  ): Promise<ICommonResponse<any>> {
    const stats = await this.langChainTokenUsageService.getTokenUsageStats(userId, dto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Usage statistics retrieved',
      data: stats,
    };
  }

  /**
   * Get usage breakdown by type
   */
  @Get('usage-by-type/:userId')
  @ApiOperation({ summary: 'Get token usage breakdown by type' })
  @ApiResponse({
    status: 200,
    description: 'Usage breakdown retrieved',
  })
  async getUsageByType(@Param('userId') userId: string): Promise<ICommonResponse<any>> {
    const breakdown = await this.tokenManagementService.getTokenUsageByType(userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Usage breakdown retrieved',
      data: breakdown,
    };
  }

  /**
   * Get usage breakdown by provider
   */
  @Get('usage-by-provider/:userId')
  @ApiOperation({ summary: 'Get token usage breakdown by provider' })
  @ApiResponse({
    status: 200,
    description: 'Provider breakdown retrieved',
  })
  async getUsageByProvider(@Param('userId') userId: string): Promise<ICommonResponse<any>> {
    const breakdown = await this.tokenManagementService.getTokenUsageByProvider(userId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Provider breakdown retrieved',
      data: breakdown,
    };
  }

  /**
   * Get transaction history
   */
  @Get('transactions/:userId')
  @ApiOperation({ summary: 'Get token transaction history for user' })
  @ApiResponse({
    status: 200,
    description: 'Transaction history retrieved',
  })
  async getTransactionHistory(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 20,
    @Query('skip') skip: number = 0,
    @Query('transactionType') transactionType?: string,
    @Query('status') status?: string,
  ): Promise<ICommonResponse<any>> {
    const result = await this.tokenTransactionService.getTransactionHistory(
      userId,
      limit,
      skip,
      { transactionType: transactionType as any, status: status as any },
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Transaction history retrieved',
      data: result,
    };
  }

  /**
   * Get transaction summary
   */
  @Get('transaction-summary/:userId')
  @ApiOperation({ summary: 'Get token transaction summary for user' })
  @ApiResponse({
    status: 200,
    description: 'Transaction summary retrieved',
  })
  async getTransactionSummary(
    @Param('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ICommonResponse<any>> {
    const summary = await this.tokenTransactionService.getTransactionSummary(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Transaction summary retrieved',
      data: summary,
    };
  }

  /**
   * Check daily limit status
   */
  @Get('daily-limit-status/:userId')
  @ApiOperation({ summary: 'Check if user is within daily token limit' })
  @ApiResponse({
    status: 200,
    description: 'Daily limit status retrieved',
  })
  async getDailyLimitStatus(
    @Param('userId') userId: string,
    @Query('planId') planId?: string,
    @Query('limit') limit?: number,
  ): Promise<ICommonResponse<any>> {
    const status = await this.tokenManagementService.isWithinDailyLimit(userId, planId, limit);
    return {
      statusCode: HttpStatus.OK,
      message: status.within ? 'Within daily limit' : 'Daily limit exceeded',
      data: status,
    };
  }

  /**
   * Check monthly limit status
   */
  @Get('monthly-limit-status/:userId')
  @ApiOperation({ summary: 'Check if user is within monthly token limit' })
  @ApiResponse({
    status: 200,
    description: 'Monthly limit status retrieved',
  })
  async getMonthlyLimitStatus(
    @Param('userId') userId: string,
    @Query('planId') planId?: string,
    @Query('limit') limit?: number,
  ): Promise<ICommonResponse<any>> {
    const status = await this.tokenManagementService.isWithinMonthlyLimit(userId, planId, limit);
    return {
      statusCode: HttpStatus.OK,
      message: status.within ? 'Within monthly limit' : 'Monthly limit exceeded',
      data: status,
    };
  }

  /**
   * Refund tokens for failed request
   */
  @Post('refund/:userId/:tokenUsageId')
  @ApiOperation({ summary: 'Refund tokens for failed request' })
  @ApiResponse({
    status: 200,
    description: 'Tokens refunded',
  })
  async refundTokens(
    @Param('userId') userId: string,
    @Param('tokenUsageId') tokenUsageId: string,
    @Query('reason') reason?: string,
  ): Promise<ICommonResponse<any>> {
    const result = await this.tokenManagementService.refundFailedRequest(
      userId,
      tokenUsageId,
      reason,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Tokens refunded successfully',
      data: result,
    };
  }

  /**
   * Platform-wide statistics
   */
  @Get('admin/platform-stats')
  @ApiOperation({ summary: 'Get platform-wide token statistics' })
  @ApiResponse({
    status: 200,
    description: 'Platform statistics retrieved',
  })
  async getPlatformStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ICommonResponse<any>> {
    const stats = await this.tokenManagementService.getPlatformStatistics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Platform statistics retrieved',
      data: stats,
    };
  }
}
