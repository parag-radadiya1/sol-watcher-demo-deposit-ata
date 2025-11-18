import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { MongoSchema } from '@utils/classes/schema.classes';
import { SchemaTypes } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDate, IsOptional, IsObject, IsArray, IsEnum } from 'class-validator';

export enum DayOfWeek {
  SUNDAY = 'sunday',
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
}

@Schema({ _id: false })
export class AstrologicalInfluence {
  @ApiProperty({ example: 'Moon in Virgo' })
  @Prop({ type: String })
  @IsString()
  moonPhase?: string;

  @ApiProperty({ example: 'Increased focus, organization, and health awareness' })
  @Prop({ type: String })
  @IsString()
  moonInfluence?: string;

  @ApiProperty({ example: 'Mercury Trine Jupiter' })
  @Prop({ type: String })
  @IsString()
  mercuryAspect?: string;

  @ApiProperty({ example: 'Clear communication, learning boost, productive decisions' })
  @Prop({ type: String })
  @IsString()
  mercuryInfluence?: string;

  @ApiProperty({ example: 'Encourages discipline and patience' })
  @Prop({ type: String })
  @IsString()
  saturnInfluence?: string;

  @ApiProperty({ example: 78 })
  @Prop({ type: Number, min: 0, max: 100 })
  @IsNumber()
  energyLevel?: number;

  @ApiProperty({ example: 'Additional planetary or celestial influences' })
  @Prop({ type: String })
  @IsString()
  additionalInfluences?: string;
}

@Schema({ _id: false })
export class NumerologyInfluence {
  @ApiProperty({ example: 6 })
  @Prop({ type: Number })
  @IsNumber()
  personalDayNumber?: number;

  @ApiProperty({ example: 'A Personal Day 6 brings emotional balance, compassion, and harmony' })
  @Prop({ type: String })
  @IsString()
  meaning?: string;

  @ApiProperty({ example: 'Cooperation over competition' })
  @Prop({ type: String })
  @IsString()
  influence?: string;
}

@Schema({ _id: false })
export class CareerAndWork {
  @ApiProperty({ example: 'This is a day for structured progress.' })
  @Prop({ type: String })
  @IsString()
  overview?: string;

  @ApiProperty({ example: 'Morning is especially productive for handling emails and presentations' })
  @Prop({ type: String })
  @IsString()
  morning?: string;

  @ApiProperty({ example: 'Team interactions will feel smooth' })
  @Prop({ type: String })
  @IsString()
  teamDynamics?: string;

  @ApiProperty({ example: 'Avoid taking major risks after evening' })
  @Prop({ type: String })
  @IsString()
  cautions?: string;

  @ApiProperty({ example: 'Refined planning, attention to detail' })
  @Prop({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  opportunities?: string[];
}

@Schema({ _id: false })
export class MoneyAndFinance {
  @ApiProperty({ example: 'Financially, the day is stable and calm.' })
  @Prop({ type: String })
  @IsString()
  overview?: string;

  @ApiProperty({ example: 'Review budgets and organize expenses' })
  @Prop({ type: String })
  @IsString()
  recommendations?: string;

  @ApiProperty({ example: 'Small benefit like discount or cashback possible' })
  @Prop({ type: String })
  @IsString()
  opportunities?: string;

  @ApiProperty({ example: 'Large investments and speculative actions should be postponed' })
  @Prop({ type: String })
  @IsString()
  cautions?: string;
}

@Schema({ _id: false })
export class LoveAndRelationships {
  @ApiProperty({ example: 'The day brings warmth and emotional clarity.' })
  @Prop({ type: String })
  @IsString()
  overview?: string;

  @ApiProperty({ example: 'Meaningful conversations that deepen understanding' })
  @Prop({ type: String })
  @IsString()
  forCouples?: string;

  @ApiProperty({ example: 'Attract positive attention through communication' })
  @Prop({ type: String })
  @IsString()
  forSingles?: string;

  @ApiProperty({ example: 'Space for healing and open dialogue' })
  @Prop({ type: String })
  @IsString()
  healingOpportunities?: string;
}

@Schema({ _id: false })
export class EmotionalAndMentalHealth {
  @ApiProperty({ example: 'Emotionally, today feels more balanced.' })
  @Prop({ type: String })
  @IsString()
  overview?: string;

  @ApiProperty({ example: 'Calmer and less reactive than usual' })
  @Prop({ type: String })
  @IsString()
  emotionalState?: string;

  @ApiProperty({ example: 'Mild stress or overthinking may appear during evening' })
  @Prop({ type: String })
  @IsString()
  potentialChallenges?: string;

  @ApiProperty({ example: 'Mindfulness or light meditation' })
  @Prop({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  recommendations?: string[];
}

@Schema({ _id: false })
export class PhysicalHealthAndWellness {
  @ApiProperty({ example: 'Your health feels steady but slightly sensitive.' })
  @Prop({ type: String })
  @IsString()
  overview?: string;

  @ApiProperty({ example: 'Digestive issues may arise if consuming heavy, oily foods' })
  @Prop({ type: String })
  @IsString()
  cautions?: string;

  @ApiProperty({ example: 'Light meals, warm water, gentle yoga' })
  @Prop({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  recommendations?: string[];

  @ApiProperty({ example: 'Slow, controlled movements rather than intense workouts' })
  @Prop({ type: String })
  @IsString()
  exerciseSuggestions?: string;
}

@Schema({ _id: false })
export class FamilyAndSocialLife {
  @ApiProperty({ example: 'Family interactions today carry a healing energy.' })
  @Prop({ type: String })
  @IsString()
  familyOverview?: string;

  @ApiProperty({ example: 'Opportunity to resolve misunderstandings' })
  @Prop({ type: String })
  @IsString()
  familyOpportunities?: string;

  @ApiProperty({ example: 'Meaningful conversations rather than superficial interactions' })
  @Prop({ type: String })
  @IsString()
  socialOverview?: string;

  @ApiProperty({ example: 'Spending time with close friend or sibling' })
  @Prop({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  socialRecommendations?: string[];
}

@Schema({ _id: false })
export class LuckyElements {
  @ApiProperty({ example: 'Light Blue' })
  @Prop({ type: String })
  @IsString()
  luckyColor?: string;

  @ApiProperty({ example: 3 })
  @Prop({ type: Number })
  @IsNumber()
  luckyNumber?: number;

  @ApiProperty({ example: '2 PM - 4 PM' })
  @Prop({ type: String })
  @IsString()
  luckyTime?: string;

  @ApiProperty({ example: 'East' })
  @Prop({ type: String })
  @IsString()
  luckyDirection?: string;
}

@Schema({ _id: false })
export class AIActionPlan {
  @ApiProperty({ example: ['Begin morning with important tasks', 'Use positive influences for negotiations'] })
  @Prop({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  actionItems?: string[];

  @ApiProperty({ example: 'I move through the day with clarity, confidence, and calm focus.' })
  @Prop({ type: String })
  @IsString()
  affirmation?: string;

  @ApiProperty({ example: 'Avoid making large purchases or investments' })
  @Prop({ type: String })
  @IsString()
  generalAdvice?: string;
}

@Schema({ timestamps: true, versionKey: false, collection: 'daily_astrology_predictions' })
export class DailyAstrologyPrediction extends MongoSchema {
  @ApiProperty({ description: 'User ID reference', example: '507f1f77bcf86cd799439011' })
  @Prop({ type: SchemaTypes.ObjectId, required: true, ref: 'User', index: true })
  @IsString()
  userId: string;

  @ApiProperty({ enum: DayOfWeek, example: 'wednesday' })
  @Prop({ type: String, enum: DayOfWeek, required: true, index: true })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({ example: '2024-11-20' })
  @Prop({ type: Date, required: true, index: true })
  @IsDate()
  predictionDate: Date;

  @ApiProperty({ example: 'Wednesday brings a steady and grounding energy...' })
  @Prop({ type: String, required: true })
  @IsString()
  overallTheme: string;

  @ApiProperty({ type: () => AstrologicalInfluence })
  @Prop({ type: AstrologicalInfluence, required: true })
  @IsObject()
  astrologicalInfluence: AstrologicalInfluence;

  @ApiProperty({ type: () => NumerologyInfluence })
  @Prop({ type: NumerologyInfluence, required: true })
  @IsObject()
  numerologyInfluence: NumerologyInfluence;

  @ApiProperty({ type: () => CareerAndWork })
  @Prop({ type: CareerAndWork, required: false })
  @IsObject()
  @IsOptional()
  careerAndWork?: CareerAndWork;

  @ApiProperty({ type: () => MoneyAndFinance })
  @Prop({ type: MoneyAndFinance, required: false })
  @IsObject()
  @IsOptional()
  moneyAndFinance?: MoneyAndFinance;

  @ApiProperty({ type: () => LoveAndRelationships })
  @Prop({ type: LoveAndRelationships, required: false })
  @IsObject()
  @IsOptional()
  loveAndRelationships?: LoveAndRelationships;

  @ApiProperty({ type: () => EmotionalAndMentalHealth })
  @Prop({ type: EmotionalAndMentalHealth, required: false })
  @IsObject()
  @IsOptional()
  emotionalAndMentalHealth?: EmotionalAndMentalHealth;

  @ApiProperty({ type: () => PhysicalHealthAndWellness })
  @Prop({ type: PhysicalHealthAndWellness, required: false })
  @IsObject()
  @IsOptional()
  physicalHealthAndWellness?: PhysicalHealthAndWellness;

  @ApiProperty({ type: () => FamilyAndSocialLife })
  @Prop({ type: FamilyAndSocialLife, required: false })
  @IsObject()
  @IsOptional()
  familyAndSocialLife?: FamilyAndSocialLife;

  @ApiProperty({ type: () => LuckyElements })
  @Prop({ type: LuckyElements, required: false })
  @IsObject()
  @IsOptional()
  luckyElements?: LuckyElements;

  @ApiProperty({ type: () => AIActionPlan })
  @Prop({ type: AIActionPlan, required: false })
  @IsObject()
  @IsOptional()
  aiActionPlan?: AIActionPlan;

  @ApiProperty({ example: 1, description: 'Schema version for tracking field changes' })
  @Prop({ type: Number, default: 1 })
  @IsNumber()
  schemaVersion: number;

  @ApiProperty({ example: 'Initial schema with all prediction fields', description: 'Change notes for schema updates' })
  @Prop({ type: String, default: 'Initial schema with all prediction fields' })
  @IsString()
  @IsOptional()
  schemaChangeNotes?: string;

  @ApiProperty({ example: 'Generated by AI from astrology data', description: 'Source of prediction generation' })
  @Prop({ type: String, required: false })
  @IsString()
  @IsOptional()
  generatedBy?: string;

  @ApiProperty({ example: true, description: 'Whether the prediction is active/valid' })
  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const DailyAstrologyPredictionSchema = SchemaFactory.createForClass(DailyAstrologyPrediction);

// Create indexes for common queries
DailyAstrologyPredictionSchema.index({ userId: 1, predictionDate: -1 });
DailyAstrologyPredictionSchema.index({ userId: 1, dayOfWeek: 1 });
DailyAstrologyPredictionSchema.index({ predictionDate: 1 });
DailyAstrologyPredictionSchema.index({ schemaVersion: 1 });
