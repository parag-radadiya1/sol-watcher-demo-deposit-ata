import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MongoSchema } from '@utils/classes/schema.classes';
import { SchemaTypes, Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type MarriageMatchDocument = MarriageMatch & Document;

// Main Marriage Match Entity with new structure
@Schema({ timestamps: true, versionKey: false, collection: 'marriage_matches' })
export class MarriageMatch extends MongoSchema {
  @ApiProperty({ type: String, description: 'User ID of the person requesting the match' })
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'User', index: true })
  userId: string;

  @ApiProperty({ type: String, description: 'ID of the potential partner (optional, can be null for stored profiles)' })
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  partnerId?: string;

  @ApiProperty({ description: 'Partners information' })
  @Prop({ type: SchemaTypes.Mixed, required: true })
  partners: {
    boy: any;
    girl: any;
  };

  @ApiProperty({ description: 'Synastry analysis' })
  @Prop({ type: SchemaTypes.Mixed, required: true })
  synastry: {
    overallSummary: string;
    aspects: any[];
    compatibilityFactors: any;
  };

  @ApiProperty({ description: 'Composite chart analysis' })
  @Prop({ type: SchemaTypes.Mixed, required: true })
  compositeChart: {
    sun: any;
    moon: any;
    ascendant: any;
    venus: any;
    mars: any;
    relationshipThemes: {
      strengths: string[];
      challenges: string[];
    };
  };

  @ApiProperty({ description: 'Compatibility scores' })
  @Prop({ type: SchemaTypes.Mixed, required: true })
  scores: {
    love: number;
    emotion: number;
    communication: number;
    sexuality: number;
    overall: number;
  };

  @ApiProperty({ description: 'Final summary' })
  @Prop({ type: SchemaTypes.Mixed, required: true })
  finalSummary: {
    short: string;
    detailed: string;
  };

  @ApiProperty({ example: true })
  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @ApiProperty({ example: 'Generated via AI', description: 'Source of match calculation' })
  @Prop({ type: String, default: 'user_input' })
  source: string;

  @ApiProperty({ example: 'sha256hash...', description: 'Hash of partner details for caching purposes' })
  @Prop({ type: String, default: null, index: true })
  partnerDetailsHash?: string;

  @ApiProperty({ example: 'partners\n  boy\n    name: Aarav\n  ...', description: 'Raw TOON format message from AI' })
  @Prop({ type: String, default: null })
  toonMessage?: string;
}

export const MarriageMatchSchema = SchemaFactory.createForClass(MarriageMatch);

// Create indexes
MarriageMatchSchema.index({ userId: 1, createdAt: -1 });
MarriageMatchSchema.index({ userId: 1, partnerId: 1 });
MarriageMatchSchema.index({ 'scores.overall': -1 });
MarriageMatchSchema.index({ userId: 1, partnerDetailsHash: 1 });
