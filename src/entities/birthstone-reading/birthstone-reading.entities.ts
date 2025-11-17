import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MongoSchema } from '@utils/classes/schema.classes';
import { SchemaTypes } from 'mongoose';

export interface IBirthstoneReading {
  overview: any;
  birthstoneCategories: any;
  meaningSymbolism: string;
  keyBenefits: string[];
  planetaryAssociation: any;
  chakraConnection: any;
  howToWear: any;
  cleansingCharging: any;
  substituteStone: string;
  additionalProperties?: any;
}

@Schema({ timestamps: true, versionKey: false, collection: 'birthstone_readings' })
export class BirthstoneReading extends MongoSchema {
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'User', index: true })
  userId: string;

  @Prop({ type: String, required: true })
  fullName: string;

  @Prop({ type: Date, required: true })
  birthDate: Date;

  @Prop({ type: String, required: true })
  birthPlace: string;

  @Prop({ type: Object, required: true })
  reading: IBirthstoneReading;

  @Prop({ type: Date, required: true })
  generatedAt: Date;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const BirthstoneReadingSchema = SchemaFactory.createForClass(BirthstoneReading);

// Create indexes
BirthstoneReadingSchema.index({ userId: 1, createdAt: -1 });
