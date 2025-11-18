import { Module } from '@nestjs/common';
import { langChainTokenUsageModel } from './langchain-token-usage.entities';

@Module({
  imports: [langChainTokenUsageModel],
  exports: [langChainTokenUsageModel],
})
export class LangChainTokenUsageModelModule {}

