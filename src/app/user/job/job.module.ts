import { Module } from '@nestjs/common';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { JobModelModule } from '../../../entities/job/job.model.module';
import { GuardAuthService } from '@helper/guardAuth.helper.service';
import { CommonModule } from '@utils/common.module';
import { UserModelsModule } from '@entities-user/user.model.module';
import { TokenModelsModule } from '@entities-token/token.model.module';
import { QueueModule } from '@app/queue/queue.module';

@Module({
  imports: [
    JobModelModule,
    CommonModule,
    UserModelsModule,
    TokenModelsModule,
    QueueModule,
  ],
  controllers: [JobController],
  providers: [JobService, GuardAuthService],
  exports: [JobService],
})
export class JobModule {}
