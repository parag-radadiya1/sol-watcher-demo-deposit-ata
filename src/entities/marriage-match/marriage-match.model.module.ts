import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarriageMatch, MarriageMatchSchema } from './marriage-match.entities';
import { MarriageMatchModelService } from './marriage-match.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MarriageMatch.name, schema: MarriageMatchSchema },
    ]),
  ],
  providers: [MarriageMatchModelService],
  exports: [MarriageMatchModelService],
})
export class MarriageMatchModelModule {}

