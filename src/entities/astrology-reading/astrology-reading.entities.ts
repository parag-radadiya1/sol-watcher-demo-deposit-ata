import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MongoSchema } from '@utils/classes/schema.classes';
import { SchemaTypes } from 'mongoose';
import { IAstrologyNumerologyReading } from '@app/user/astrology/interfaces';

@Schema({ timestamps: true, versionKey: false, collection: 'astrology_readings' })
export class AstrologyReading extends MongoSchema {
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'User', index: true })
  userId: string;

  @Prop({ type: String, required: true })
  fullName: string;

  @Prop({ type: Date, required: true })
  birthDate: Date;

  @Prop({ type: String, required: true })
  birthPlace: string;

  @Prop({ type: Object, required: true })
  reading: IAstrologyNumerologyReading;

  @Prop({ type: Date, required: true })
  generatedAt: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const AstrologyReadingSchema = SchemaFactory.createForClass(AstrologyReading);

// Create indexes
AstrologyReadingSchema.index({ userId: 1, createdAt: -1 });
