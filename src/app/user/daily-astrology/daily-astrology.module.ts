import { Module } from '@nestjs/common';
import { DailyAstrologyController } from './daily-astrology.controller';
import { DailyAstrologyService } from './daily-astrology.service';
import { DailyAstrologyPredictionModelModule } from '@entities/daily-astrology-prediction/daily-astrology-prediction.model.module';
import { UserModelsModule } from '@entities-user/user.model.module';
import { LangChainModule } from '@app/langchain/langchain.module';
import { GuardAuthService } from '@helper/guardAuth.helper.service';
import { CommonModule } from '@utils/common.module';
import { TokenModelsModule } from '@entities/token/token.model.module';
import { QueueModule } from '@app/queue/queue.module';
import { JobModelModule } from '@entities-job/job.model.module';

@Module({
  imports: [
    DailyAstrologyPredictionModelModule,
    UserModelsModule,
    LangChainModule,
    CommonModule,
    TokenModelsModule,
    QueueModule,
    JobModelModule,
  ],
  controllers: [DailyAstrologyController],
  providers: [DailyAstrologyService, GuardAuthService],
  exports: [DailyAstrologyService],
})
export class DailyAstrologyModule {}
