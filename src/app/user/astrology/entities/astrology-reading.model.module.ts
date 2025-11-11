import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AstrologyReading, AstrologyReadingSchema } from './astrology-reading.entities';
import { AstrologyReadingModelService } from './astrology-reading.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AstrologyReading.name, schema: AstrologyReadingSchema },
    ]),
  ],
  providers: [AstrologyReadingModelService],
  exports: [AstrologyReadingModelService],
})
export class AstrologyReadingModelModule {}

