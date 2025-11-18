import { Module } from '@nestjs/common';
import { DailyAstrologyPredictionController } from './daily-astrology-prediction.controller';
import { DailyAstrologyPredictionService } from './daily-astrology-prediction.service';
import { DailyAstrologyPredictionModelModule } from '@entities/daily-astrology-prediction/daily-astrology-prediction.model.module';
import { UserModelsModule } from '@entities-user/user.model.module';
import { LangChainModule } from '@app/langchain/langchain.module';
import { GuardAuthService } from '@helper/guardAuth.helper.service';
import { CommonModule } from '@utils/common.module';
import { TokenModelsModule } from '@entities/token/token.model.module';

@Module({
  imports: [
    DailyAstrologyPredictionModelModule,
    UserModelsModule,
    LangChainModule,
    CommonModule,
    TokenModelsModule
  ],
  controllers: [DailyAstrologyPredictionController],
  providers: [DailyAstrologyPredictionService, GuardAuthService],
  exports: [DailyAstrologyPredictionService],
})
export class DailyAstrologyPredictionModule {}
