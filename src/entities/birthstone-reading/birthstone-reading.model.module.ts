import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BirthstoneReading, BirthstoneReadingSchema } from './birthstone-reading.entities';
import { BirthstoneReadingModelService } from './birthstone-reading.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BirthstoneReading.name, schema: BirthstoneReadingSchema },
    ]),
  ],
  providers: [BirthstoneReadingModelService],
  exports: [BirthstoneReadingModelService],
})
export class BirthstoneReadingModelModule {}

