import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from './job.entities';
import { JobModelService } from './job.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Job.name, schema: JobSchema }]),
  ],
  providers: [JobModelService],
  exports: [JobModelService, MongooseModule],
})
export class JobModelModule {}

