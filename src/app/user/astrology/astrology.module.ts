import { Module } from '@nestjs/common';
import { AstrologyController } from './astrology.controller';
import { AstrologyService } from './astrology.service';
import { UserModelsModule } from '@entities-user/user.model.module';
import { TokenModelsModule } from '@entities-token/token.model.module';
import { LangChainModule } from '@app/langchain/langchain.module';
import { GuardAuthService } from '@helper/guardAuth.helper.service';
import { CommonModule } from '@utils/common.module';
import { AstrologyReadingModelModule } from './entities/astrology-reading.model.module';
import { QueueModule } from '@app/queue';
import { JobModelModule } from '@entities-job/job.model.module';
import { JobController } from '@app/user/job/job.controller';

@Module({
  imports: [
    UserModelsModule,
    TokenModelsModule,
    LangChainModule,
    CommonModule,
    QueueModule,
    AstrologyReadingModelModule,
    JobModelModule,
  ],
  controllers: [AstrologyController],
  providers: [AstrologyService, GuardAuthService],
  exports: [AstrologyService],
})
export class AstrologyModule {}
