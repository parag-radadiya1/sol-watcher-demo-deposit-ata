import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { AstrologyProcessor } from './processors/astrology.processor';
import { BirthstoneProcessor } from './processors/birthstone.processor';
import { DailyPredictionProcessor } from './processors/daily-prediction.processor';
import { QUEUE_NAMES } from './constants/queue.constants';
import { LangChainModule } from '../langchain/langchain.module';
import { UserModelsModule } from '@entities-user/user.model.module';
import { BirthstoneReadingModelModule } from '@entities/birthstone-reading/birthstone-reading.model.module';
import { JobModelModule } from '@entities-job/job.model.module';
import { AstrologyReadingModelModule } from '@entities/astrology-reading/astrology-reading.model.module';
import { DailyAstrologyPredictionModelModule } from '@entities/daily-astrology-prediction/daily-astrology-prediction.model.module';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
          db: configService.get<number>('REDIS_DB', 0),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.ASTROLOGY_QUEUE,
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.BIRTHSTONE_QUEUE,
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.DAILY_PREDICTION_QUEUE,
    }),
    LangChainModule,
    UserModelsModule,
    AstrologyReadingModelModule,
    BirthstoneReadingModelModule,
    DailyAstrologyPredictionModelModule,
    JobModelModule,
  ],
  providers: [QueueService, AstrologyProcessor, BirthstoneProcessor, DailyPredictionProcessor],
  exports: [QueueService],
})
export class QueueModule {}
