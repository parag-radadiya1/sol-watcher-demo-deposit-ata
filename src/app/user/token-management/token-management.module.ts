import { Module } from '@nestjs/common';
import { LangChainTokenUsageModelModule } from '@entities/langchain-token-usage/langchain-token-usage.model.module';
import { TokenTransactionModelModule } from '@entities/token-transaction/token-transaction.model.module';
import { PlanModelModule } from '@entities/plan/plan.model.module';
import { LangChainTokenUsageService } from '@entities/langchain-token-usage/langchain-token-usage.service';
import { TokenTransactionService } from '@entities/token-transaction/token-transaction.service';
import { PlanService } from '@entities/plan/plan.service';
import { TokenManagementService } from './token-management.service';

@Module({
  imports: [
    LangChainTokenUsageModelModule,
    TokenTransactionModelModule,
    PlanModelModule,
  ],
  providers: [
    LangChainTokenUsageService,
    TokenTransactionService,
    PlanService,
    TokenManagementService,
  ],
  exports: [
    LangChainTokenUsageService,
    TokenTransactionService,
    PlanService,
    TokenManagementService,
  ],
})
export class TokenManagementModule {}
