import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LangChainService } from './langchain.service';
import { TokenManagementModule } from '../token-management/token-management.module';
import { PlanModelModule } from '@entities-plan/plan.model.module';
import { UserModelsModule } from '@entities/user/user.model.module';

@Module({
  imports: [UserModelsModule, ConfigModule, TokenManagementModule, PlanModelModule],
  providers: [LangChainService],
  exports: [LangChainService],
})
export class LangChainModule {}
