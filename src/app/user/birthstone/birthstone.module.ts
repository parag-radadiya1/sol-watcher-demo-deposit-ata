import { Module } from '@nestjs/common';
import { BirthstoneController } from './birthstone.controller';
import { BirthstoneService } from './birthstone.service';
import { UserModelsModule } from '@entities-user/user.model.module';
import { TokenModelsModule } from '@entities-token/token.model.module';
import { LangChainModule } from '@app/langchain/langchain.module';
import { BirthstoneReadingModelModule } from '../../../entities/birthstone-reading/birthstone-reading.model.module';
import { QueueModule } from '@app/queue/queue.module';
import { JobModelModule } from '@entities-job/job.model.module';
import { GuardAuthService } from '@helper/guardAuth.helper.service';
import { CommonModule } from '@utils/common.module';

@Module({
  imports: [
    UserModelsModule,
    TokenModelsModule,
    LangChainModule,
    CommonModule,
    BirthstoneReadingModelModule,
    QueueModule,
    JobModelModule,
  ],
  controllers: [BirthstoneController],
  providers: [BirthstoneService, GuardAuthService],
  exports: [BirthstoneService],
})
export class BirthstoneModule {}
