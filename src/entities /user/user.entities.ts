import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { MongoSchema } from '@utils/classes/schema.classes';
import { LANGUAGE } from '@utils/enums';
import {
  IsArray,
  IsIP,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { SchemaTypes } from 'mongoose';

@Schema({ timestamps: true, versionKey: false, collection: 'user' })
export class User extends MongoSchema {
  @ApiProperty({ example: 'John Doe' })
  @Prop({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  credId: string;

  @Prop({ type: SchemaTypes.ObjectId, required: true })
  orgId: string;

  @Prop({ type: Boolean, default: false })
  isAdminBinded?: boolean;

  @Prop({ type: String, enum: LANGUAGE, default: LANGUAGE.ENGLISH })
  languagePref?: string;

  @ApiProperty({ example: ['192.168.29.135'] })
  @IsOptional()
  @IsArray()
  @IsIP('4', { each: true })
  @Prop({ type: [String] })
  allowedIps: string[];

  @Prop({ type: Boolean, default: true })
  isActive?: boolean;
}

export const userSchema = SchemaFactory.createForClass(User);
export const userModel = MongooseModule.forFeature([
  { name: User.name, schema: userSchema },
]);
