import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyAstrologyPrediction, DailyAstrologyPredictionSchema } from './daily-astrology-prediction.entities';
import { DailyAstrologyPredictionService } from './daily-astrology-prediction.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DailyAstrologyPrediction.name,
        schema: DailyAstrologyPredictionSchema,
      },
    ]),
  ],
  providers: [DailyAstrologyPredictionService],
  exports: [MongooseModule, DailyAstrologyPredictionService],
})
export class DailyAstrologyPredictionModelModule {}
