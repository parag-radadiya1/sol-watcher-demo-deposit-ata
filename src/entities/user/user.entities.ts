import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { MongoSchema } from '@utils/classes/schema.classes';
import { LANGUAGE } from '@utils/enums';
import {
  IsArray, IsBoolean, IsEmail,
  IsIP,
  IsNotEmpty,
  IsOptional,
  IsString, Matches, MaxLength, MinLength,
} from 'class-validator';
import { SchemaTypes } from 'mongoose';
import { IsValidCountryCode, IsValidMobileNumber } from '@utils/common.validation';
import { validationResponse } from '@utils/constant';
import { REGEX } from '@utils/constants';
import { Transform } from 'class-transformer';

@Schema({ timestamps: true, versionKey: false, collection: 'user' })
export class User extends MongoSchema {
  @ApiProperty({ example: 'John' })
  @Prop({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @Prop({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'Smith', required: false })
  @Prop({ type: String, required: false })
  @IsString()
  @IsOptional()
  surname?: string;

  @ApiProperty({ example: '1990-01-15T10:30:00.000Z' })
  @Prop({ type: Date, required: true })
  @IsNotEmpty()
  birthDate: Date;

  @ApiProperty({ example: 'New York, USA' })
  @Prop({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  birthPlace: string;

  @ApiProperty({ example: 'John Doe' })
  @Prop({ type: String, required: true })
  @IsString()
  @IsNotEmpty()
  name: string;

  @Prop({ type: String, unique: true, required: true })
  @Transform(({ value }) => value?.trim().toLowerCase())
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  @ApiProperty({ example: 'a@gmail.com' })
  email: string;

  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  @Matches(REGEX.password, {
    message: validationResponse.enterValidPassword,
  })
  @MinLength(8)
  @MaxLength(32)
  @ApiProperty({ example: 'a@123' })
  password: string;

  @ApiProperty({ example: '9090909090' })
  @IsString()
  @IsNotEmpty()
  // @Matches(REGEX.contactNo, {
  //   message: validationResponse.enterValidValue('contact number'),
  // })
  @IsValidMobileNumber()
  @Prop({ type: String, required: true })
  mobileNumber?: string;

  @ApiProperty({ example: '+91' })
  @IsString()
  @IsNotEmpty()
  @IsValidCountryCode()
  @Prop({ type: String, required: true })
  countryCode?: string;

  @IsBoolean()
  @Prop({ type: Boolean, default: false })
  numberVerified?: boolean;

  @IsBoolean()
  @Prop({ type: Boolean, default: false })
  emailVerified?: boolean;

  @IsBoolean()
  @Prop({ type: Boolean, default: false })
  isWhatsAppNumber?: boolean;

  @Prop({ type: Boolean, default: true })
  isActive?: boolean;

  @ApiProperty({ example: 'astrology-userid-1234567890', required: false })
  @Prop({ type: String, required: false })
  @IsString()
  @IsOptional()
  lastAstrologyJobId?: string;

  @ApiProperty({ example: 'birthstone-userid-1234567890', required: false })
  @Prop({ type: String, required: false })
  @IsString()
  @IsOptional()
  lastBirthstoneJobId?: string;
}

export const userSchema = SchemaFactory.createForClass(User);
export const userModel = MongooseModule.forFeature([
  { name: User.name, schema: userSchema },
]);
