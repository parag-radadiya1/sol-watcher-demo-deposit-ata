import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { MongoSchema } from '@utils/classes/schema.classes';
import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export enum PlanType {
  FREE = 'free',
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

@Schema({ timestamps: true, versionKey: false, collection: 'plan' })
export class Plan extends MongoSchema {
  @ApiProperty({ example: 'Basic Plan' })
  @Prop({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Basic token plan for new users', required: false })
  @Prop({ type: String, required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: PlanType, example: 'basic' })
  @Prop({ type: String, enum: PlanType, required: true })
  @IsEnum(PlanType)
  @IsNotEmpty()
  type: PlanType;

  @ApiProperty({ example: 10000 })
  @Prop({ type: Number, required: true, default: 10000 })
  @IsNumber()
  @IsNotEmpty()
  tokenBalance: number; // Initial token balance for users on this plan

  @ApiProperty({ example: 50000 })
  @Prop({ type: Number, required: true, default: 50000 })
  @IsNumber()
  @IsNotEmpty()
  dailyTokenLimit: number; // Daily token usage limit

  @ApiProperty({ example: 500000 })
  @Prop({ type: Number, required: true, default: 500000 })
  @IsNumber()
  @IsNotEmpty()
  monthlyTokenLimit: number; // Monthly token usage limit

  @ApiProperty({ example: 10000 })
  @Prop({ type: Number, required: true, default: 10000 })
  @IsNumber()
  @IsNotEmpty()
  perRequestTokenLimit: number; // Max tokens per single request

  @ApiProperty({ example: 5, required: false })
  @Prop({ type: Number, required: false, default: null })
  @IsNumber()
  @IsOptional()
  chatMessageLimit?: number; // Max AI response messages in a conversation (null = unlimited)

  @ApiProperty({ example: 5, required: false })
  @Prop({ type: Number, required: false, default: null })
  @IsNumber()
  @IsOptional()
  questionLimit?: number; // Max questions user can ask (null = unlimited)

  @ApiProperty({ example: false })
  @Prop({ type: Boolean, default: false })
  @IsBoolean()
  voiceConversationEnabled: boolean; // Whether voice conversation is enabled

  @ApiProperty({ example: 99.99 })
  @Prop({ type: Number, required: false })
  @IsNumber()
  @IsOptional()
  price?: number; // Monthly price in USD

  @ApiProperty({ example: 'USD', required: false })
  @Prop({ type: String, required: false, default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: true })
  @Prop({ type: Boolean, default: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ example: true })
  @Prop({ type: Boolean, default: true })
  @IsBoolean()
  isTokenTrackingEnabled: boolean; // Whether to track tokens for users on this plan

  @ApiProperty({ example: 0, required: false })
  @Prop({ type: Number, required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  userCount?: number; // Number of users on this plan

  @ApiProperty({ example: 'Plan for basic users', required: false })
  @Prop({ type: String, required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}

export const planSchema = SchemaFactory.createForClass(Plan);
export const planModel = MongooseModule.forFeature([
  { name: Plan.name, schema: planSchema },
]);
