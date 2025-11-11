import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type JobDocument = Job & Document;

@Schema({ timestamps: true })
export class Job {
  @Prop({ required: true, unique: true, index: true })
  jobId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, index: true })
  jobType: string;

  @Prop({ type: Object })
  jobData: any;

  @Prop({ required: true })
  queueName: string;

  @Prop({ 
    required: true, 
    enum: ['waiting', 'active', 'completed', 'failed', 'delayed'],
    default: 'waiting',
    index: true 
  })
  status: string;

  @Prop({ default: 0 })
  progress: number;

  @Prop({ default: 0 })
  priority: number;

  @Prop({ default: 0 })
  attempts: number;

  @Prop({ type: Object })
  result: any;

  @Prop()
  error: string;

  @Prop()
  startedAt: Date;

  @Prop()
  completedAt: Date;

  @Prop()
  failedAt: Date;
}

export const JobSchema = SchemaFactory.createForClass(Job);

// Add compound indexes
JobSchema.index({ userId: 1, jobType: 1 });
JobSchema.index({ userId: 1, status: 1 });
JobSchema.index({ status: 1, completedAt: 1 });

